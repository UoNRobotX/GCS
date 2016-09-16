var socket_io = require('socket.io');
var fs = require('fs');
var path = require('path');
var protobuf = require('protobufjs');
var Vehicle = require('./vehicle.js');
var crc32 = require('buffer-crc32');

//these files are used for vehicle-server communication
    // TODO: when the files are FIFOs, 'npm start' works once, but later attempts exit prematurely
var inputFile  = path.join(__dirname, '../temp/toServer');
var outputFile = path.join(__dirname, '../temp/toVehicle');

module.exports = function(server){
    this.msgId = 0; //used to assign IDs to messages sent to vehicle
    this.MAX_MSG_ID = 255;
    this.pending = null; //contains info about the last message sent to the vehicle
        //{msgType, data, msgId, clientMsgId, socket, timer}
    this.queued = []; //contains info about messages to be sent to the vehicle
        //[{msgType, data, msgId, clientMsgId, socket}, ...]
    this.TIMEOUT = 1000;
    this.MSG_TYPES = {
        STATUS:                   0,
        COMMAND:                  1,
        GET_PARAMETERS:           2,
        GET_PARAMETERS_RESPONSE:  3,
        GET_SETTINGS:             4,
        GET_SETTINGS_RESPONSE:    5,
        GET_MISSION:              6,
        GET_MISSION_RESPONSE:     7,
        GET_MISSIONS:             8,
        GET_MISSIONS_RESPONSE:    9,
        SET_PARAMETERS:          10,
        SET_SETTINGS:            11,
        SET_MISSION:             12,
        SET_MISSIONS:            13,
        SUCCESS:                 14,
        FAILURE:                 15,
        ATTENTION:               16
    };
    this.magicNumber = new Buffer([0x17, 0xC0, 0x42]); //used in messages
    //settings
    this.settings = [
        ['Map',       'key',       'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA'],
        ['Map',       'lat',       '21.308731'                              ],
        ['Map',       'lng',       '-157.888815'                            ],
        ['Map',       'zoom',      '19'                                     ],
        ['Section 1', 'Setting 1', 'value 1'                                ]
    ];
    //contains one socket for each client
    this.sockets = {}; //{id1: socket1, ...}
    this.socketId = 0;
    //load .proto messages
    this.protoBuilder = protobuf.loadProtoFile('./public/assets/proto/Test.proto');
    if (this.protoBuilder === null){
        throw new Error ('Unable to load proto messages');
    }
    this.protoPkg = this.protoBuilder.build();
    //missions list
    this.missions = new this.protoPkg.SetMissions(); //mission list stored on server
    this.missionsFile = './data/missions';
    //load missions from file
    fs.readFile(this.missionsFile, function(err, data){
        if (err){
            console.log('Unable to read missions file. Using empty missions list.');
        } else {
            try {
                this.missions = this.protoPkg.SetMissions.decode(data);
            } catch (e){
                console.log('Missions file is invalid. Using empty missions list.');
            }
        }
    }.bind(this));
    //save missions on shutdown
    this.savedOnShutdown = false;
    this.saveMissions = function(){
        if (!this.savedOnShutdown){
            fs.writeFileSync(this.missionsFile, this.missions.toBuffer());
            this.savedOnShutdown = true;
        }
        process.exit();
    }.bind(this);
    process.on('exit', this.saveMissions);
    process.on('SIGINT', this.saveMissions);
    //create input and output files if non-existent
    var openAndTruncateInputFile = true;
    try {
        var inputStats = fs.statSync(inputFile);
        if (inputStats.isFIFO()){
            openAndTruncateInputFile = false;
        }
    } catch (e){}
    if (openAndTruncateInputFile){
        var inputFd = fs.openSync(inputFile, 'w');
        fs.closeSync(inputFd);
    }
    var openAndTruncateOutputFile = true;
    try {
        var outputStats = fs.statSync(outputFile);
        if (outputStats.isFIFO()){
            openAndTruncateOutputFile = false;
        }
    } catch (e){}
    if (openAndTruncateOutputFile){
        var outputFd = fs.openSync(outputFile, 'w');
        fs.closeSync(outputFd);
    }
    //create fake vehicle
    this.vehicle = new Vehicle(outputFile, inputFile);
    //open output file
    this.ostream = fs.createWriteStream(outputFile, {flags: 'a'});
    this.ostream.on('error', function(){throw new Error('Error with writing output file');});
    //used to send messsages to vehicle
    this.writeOutputData = function(type, buffer, clientMsgId, socket){
        if (typeof type !== 'undefined'){
            //check data size
            if (buffer.length > Math.pow(2,32)-1){
                socket.emit(
                    'Failure',
                    (new this.protoPkg.Failure('Message too large')).toBuffer(),
                    clientMsgId
                );
                return;
            }
            //create message ID
            var msgId = this.msgId;
            this.msgId++;
            if (this.msgId >= this.MAX_MSG_ID){this.msgId = 0;}
            //create message
            this.queued.push({
                msgType: type,
                data: buffer,
                msgId: msgId,
                clientMsgId: clientMsgId,
                socket: socket
            });
        }
        //if not waiting for a vehicle response, send the next message if any
        if (this.pending === null && this.queued.length > 0){
            this.pending = this.queued.shift();
            //send message
            var header = new Buffer(9);
            this.magicNumber.copy(header);
            header.writeUInt8(this.pending.msgType, 3);
            header.writeUInt8(this.pending.msgId, 4);
            header.writeUInt32LE(this.pending.data.length, 5);
            this.ostream.write(header);
            this.ostream.write(this.pending.data);
            this.ostream.write(crc32(this.pending.data));
            this.pending.timer = setTimeout(function(){
                this.pending.socket.emit(
                    'Failure',
                    (new this.protoPkg.Failure('Vehicle response timeout reached')).toBuffer(),
                    this.pending.clientMsgId
                );
                this.pending = null;
                this.writeOutputData();
            }.bind(this), this.TIMEOUT);
        }
    }
    //open input file
    if (fs.statSync(inputFile).isFIFO()){
        var istream = fs.createReadStream(inputFile);
        istream.on('data', function(chunk){this.processInputData(chunk)}.bind(this));
        istream.on('error', function(){throw new Error('Error with reading input file');});
    } else {
        fs.open(inputFile, 'r', function (err, fd){
            if (err){throw new Error('Error with opening input file');}
            var bytesRead = 0;
            var bufSize = 64;
            var buffer = new Buffer(bufSize);
            var readBytes = function(){
                if (fs.statSync(inputFile).size > bytesRead){
                    fs.read(fd, buffer, 0, bufSize, bytesRead, function (err, n, buffer){
                        if (err){throw new Error('Vehicle: Error with reading input file');}
                        this.processInputData(buffer.slice(0,n));
                        bytesRead += n;
                        readBytes();
                    }.bind(this));
                } else {
                    setTimeout(readBytes, 100);
                }
            }.bind(this);
            readBytes();
        }.bind(this));
    }
    this.msgBuf = new Buffer(0);
    this.processInputData = function(buf){
        this.msgBuf = Buffer.concat([this.msgBuf, buf]);
        while (true){
            //find magic number prefix
            var i = 0;
            while (i+2 < this.msgBuf.length){
                if (this.msgBuf[i] != this.magicNumber[0] ||
                    this.msgBuf[i+1] != this.magicNumber[1] ||
                    this.msgBuf[i+2] != this.magicNumber[2]){
                    i++;
                } else {
                    break;
                }
            }
            this.msgBuf = this.msgBuf.slice(i);
            //check for a complete packet
            if (this.msgBuf.length >= 9){
                var msgSize = this.msgBuf.readUInt32LE(5);
                if (this.msgBuf.length >= 9 + msgSize + 4){
                    var type = this.msgBuf.readUInt8(3);
                    var id = this.msgBuf.readUInt8(4);
                    var data = this.msgBuf.slice(9, 9 + msgSize);
                    var crc = this.msgBuf.slice(9 + msgSize, 9 + msgSize + 4);
                    //remove packet
                    this.msgBuf = this.msgBuf.slice(9 + msgSize + 4);
                    //check CRC32
                    if (crc32(data).compare(crc) != 0){
                        continue;
                    }
                    //process packet
                    this.processMsg(type, data, id);
                }
            }
            break;
        }
    }
    //processes messages from vehicle
    this.processMsg = function(type, data, msgId){
        if (type == this.MSG_TYPES.STATUS){
            var msg = this.decodeVehicleMsg('Status', data);
            if (msg === null){return;}
            for (var socketId in this.sockets){
                this.sockets[socketId].volatile.emit('Status', data);
                    //'volatile' allows the message to be dropped
            }
        } else if (type == this.MSG_TYPES.ATTENTION){
            var msg = this.decodeVehicleMsg('Attention', data);
            if (msg === null){return;}
            for (var socketId in this.sockets){
                this.sockets[socketId].emit('Attention', data);
            }
        } else {
            //check if expecting a response
            if (this.pending === null){
                console.log('Unexpected message from vehicle');
                return;
            }
            //check message ID
            if (this.pending.msgId != msgId){
                console.log('Unexpected message ID from vehicle');
                return;
            }
            //handle message
            if (type == this.MSG_TYPES.GET_PARAMETERS_RESPONSE){
                var msg = this.decodeVehicleMsg('GetParametersResponse', data);
                if (msg === null){return;}
                this.pending.socket.emit('GetParametersResponse', data, this.pending.clientMsgId);
            } else if (type == this.MSG_TYPES.GET_MISSION_RESPONSE){
                var msg = this.decodeVehicleMsg('GetMissionResponse', data);
                if (msg === null){return;}
                this.pending.socket.emit('GetMissionResponse', data, this.pending.clientMsgId);
            } else if (type == this.MSG_TYPES.SUCCESS){
                var msg = this.decodeVehicleMsg('Success', data);
                if (msg === null){return;}
                this.pending.socket.emit('Success', data, this.pending.clientMsgId);
            } else if (type == this.MSG_TYPES.FAILURE){
                var msg = this.decodeVehicleMsg('Failure', data);
                if (msg === null){return;}
                this.pending.socket.emit('Failure', data, this.pending.clientMsgId);
            } else {
                console.log('Unexpected message type from vehicle');
                return;
            }
            //clear message timeout
            clearTimeout(this.pending.timer);
            //remove pending message
            this.pending = null;
            //if another messages is queued, send it
            this.writeOutputData();
        }
    }
    //handle messages from clients
    this.io = socket_io(server);
    this.io.on('connection', function(socket){
        var id = this.socketId;
        this.sockets[id] = socket;
        this.socketId++;
        //print a message
        var host = socket.client.request.headers.host;
        console.log('connected to: ' + host);
        //when a connection closes, print a message
        socket.on('disconnect', function(){
            delete this.sockets[id];
            console.log('disconnected from: ' + host);
        }.bind(this));
        //handle client messages
        socket.on('GetParameters', function(data, id){
            console.log('got a "GetParameters" message');
            this.writeOutputData(this.MSG_TYPES.GET_PARAMETERS, new Buffer(0), id, socket);
        }.bind(this));
        socket.on('GetSettings', function(data, id){
            console.log('got a "GetSettings" message');
            var msg = new this.protoPkg.GetSettingsResponse();
            for (var i = 0; i < this.settings.length; i++){
                var setting = this.settings[i];
                msg.add('settings', new this.protoPkg.Setting(
                    setting[0], setting[1], setting[2]
                ));
            }
            socket.emit('GetSettingsResponse', msg.toBuffer(), id);
        }.bind(this));
        socket.on('GetMission', function(data, id){
            console.log('got a "GetMission" message');
            this.writeOutputData(this.MSG_TYPES.GET_MISSION, new Buffer(0), id, socket);
        }.bind(this));
        socket.on('GetMissions', function(data, id){
            console.log('got a "GetMissions" message');
            socket.emit('GetMissionsResponse', this.missions.toBuffer(), id);
        }.bind(this));
        socket.on('SetParameters', function(data, id){
            var msg = this.decodeClientMsg('SetParameters', data);
            if (msg === null){return;}
            console.log('Got "SetParameters" message');
            this.writeOutputData(this.MSG_TYPES.SET_PARAMETERS, data, id, socket);
        }.bind(this));
        socket.on('SetSettings', function(data, id){
            var newSettings = this.decodeClientMsg('SetSettings', data);
            if (newSettings === null){return;}
            console.log('got "SetSettings" message');
            //verify new settings
            var settingsToSet = [];
            var i, j;
            SettingSearch:
            for (i = 0; i < newSettings.settings.length; i++){
                var newSetting = newSettings.settings[i];
                for (j = 0; j < this.settings.length; j++){
                    var setting = this.settings[j];
                    if (newSetting.section == setting[0] &&
                        newSetting.title == setting[1]){
                        // TODO: perform value checking
                        settingsToSet.push(j);
                        continue SettingSearch;
                    }
                }
                var failureMsg = new this.protoPkg.Failure('A setting was not found');
                socket.emit('Failure', failureMsg.toBuffer(), id);
                return;
            }
            //set settings
            for (i = 0; i < newSettings.settings.length; i++){
                this.settings[settingsToSet[i]] = [
                    newSettings.settings[i].section,
                    newSettings.settings[i].title,
                    newSettings.settings[i].value
                ];
            }
            socket.emit('Success', null, id);
        }.bind(this));
        socket.on('SetMission', function(data, id){
            var msg = this.decodeClientMsg('SetMission', data);
            if (msg === null){return;}
            console.log('got "SetMission" message');
            this.writeOutputData(this.MSG_TYPES.SET_MISSION, data, id, socket);
        }.bind(this));
        socket.on('SetMissions', function(data, id){
            var missionsMsg = this.decodeClientMsg('SetMissions', data);
            if (missionsMsg === null){return;}
            console.log('got "SetMissions" message');
            this.missions = missionsMsg;
            socket.emit('Success', (new this.protoPkg.Success()).toBuffer(), id);
        }.bind(this));
        socket.on('Command', function(data, id){
            var msg = this.decodeClientMsg('Command', data);
            if (msg === null){return;}
            console.log('Got "Command" message');
            this.writeOutputData(this.MSG_TYPES.COMMAND, data, id, socket);
        }.bind(this));
    }.bind(this));
    //helper function
    this.decodeVehicleMsg = function(msgType, data){
        try {
            return this.protoPkg[msgType].decode(data);
        } catch (e){
            console.log('Unable to decode ' + msgType + ' message from vehicle');
            return null;
        }
    }
    this.decodeClientMsg = function(msgType, data, id, socket){
        try {
            return this.protoPkg[msgType].decode(data);
        } catch (e){
            console.log('Unable to decode ' + msgType + ' message from a client');
            socket.emit('Failure', (new this.protoPkg.Failure('Invalid message')).toBuffer(), id);
            return null;
        }
    }
}
