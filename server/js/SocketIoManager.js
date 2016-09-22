var socket_io = require('socket.io');
var fs = require('fs');
var protobuf = require('protobufjs');
var crc32 = require('buffer-crc32');
var serialport = require('serialport');

module.exports = function(server, inputFile, outputFile, baudRate){
    this.pending = null; //describes a message sent to the vehicle
        //{msgType, data, timestamp, socket, timer}
    this.queued = []; //describes messages to be sent to the vehicle
        //[{msgType, data, timestamp, socket, timer}, ...]
    this.TIMEOUT = 750; //uses timestamps provided by clients
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
    this.sockets = {}; //{socketId1: socket1, ...}
    this.socketId = 0; //incremented for each client connection
    //load .proto messages
    this.protoBuilder = protobuf.loadProtoFile('./public/assets/proto/Test.proto');
    if (this.protoBuilder === null){
        throw new Error ('Unable to load proto messages');
    }
    this.protoPkg = this.protoBuilder.build();
    //missions list
    this.missions = new this.protoPkg.SetMissions(); //mission list stored on server
        // TODO: use a more verbose format intead of a .proto message object
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
    process.on('exit', function(){
        fs.writeFileSync(this.missionsFile, this.missions.toBuffer());
    }.bind(this));
    process.on('SIGINT', function(){
        fs.writeFileSync(this.missionsFile, this.missions.toBuffer());
        process.exit();
    }.bind(this));
    //open output file
    var outputFileStats = fs.statSync(outputFile);
    if (outputFileStats.isCharacterDevice()){
        this.ostream = new serialport(outputFile, {
            baudRate: baudRate
        });
        this.ostream.on('error', function(){throw new Error('Error with writing to port');});
    } else {
        this.ostream = fs.createWriteStream(outputFile, {flags: 'a'});
        this.ostream.on('error', function(){throw new Error('Error with writing to output file');});
    }
    //used to send messsages to vehicle
    this.writeOutputData = function(msgType, buffer, socket, timestamp){
        //queue message
        if (msgType !== null){
            //check data size
            if (buffer.length > Math.pow(2,32)-1){
                socket.emit(
                    'Failure',
                    (new this.protoPkg.Failure(timestamp, 'Message too large')).toBuffer()
                );
                return;
            }
            this.queued.push({
                msgType:   msgType,
                data:      buffer,
                timestamp: timestamp,
                socket:    socket,
                timer:     null
            });
        }
        //if not waiting for a vehicle response, and a message is queued, send it
        if (this.pending === null && this.queued.length > 0){
            this.pending = this.queued.shift();
            //send message
            var header = new Buffer(8);
            this.magicNumber.copy(header);
            header.writeUInt8(this.pending.msgType, 3);
            header.writeUInt32LE(this.pending.data.length, 4);
            this.ostream.write(header);
            this.ostream.write(this.pending.data);
            this.ostream.write(crc32(this.pending.data));
            this.pending.timer = setTimeout(function(){
                this.pending.socket.emit(
                    'Failure',
                    (new this.protoPkg.Failure(
                        this.pending.timestamp,
                        'Vehicle response timeout reached'
                    )).toBuffer()
                );
                //clear pending message info, and send a queued message if any
                this.pending = null;
                this.writeOutputData(null);
            }.bind(this), this.TIMEOUT);
        }
    }
    //open input file
    var inputFileStats = fs.statSync(inputFile);
    if (inputFileStats.isCharacterDevice()){
        this.istream = this.ostream;
        this.istream.on('data', function(data){this.processInputData(data)}.bind(this));
    } else {
        fs.open(inputFile, 'r', function (err, fd){
            if (err){throw new Error('Error with opening input file');}
            var bytesRead = 0;
            var bufSize = 64;
            var buffer = new Buffer(bufSize);
            var readBytes = function(){
                if (fs.statSync(inputFile).size > bytesRead){
                    fs.read(fd, buffer, 0, bufSize, bytesRead, function (err, n, buffer){
                        if (err){throw new Error('Error with reading input file');}
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
        if (this.msgBuf.length >= 8){
            var msgSize = this.msgBuf.readUInt32LE(4);
            if (this.msgBuf.length >= 8 + msgSize + 4){
                var type = this.msgBuf.readUInt8(3);
                var data = this.msgBuf.slice(8, 8 + msgSize);
                var crc = this.msgBuf.slice(8 + msgSize, 8 + msgSize + 4);
                //remove packet
                this.msgBuf = this.msgBuf.slice(8 + msgSize + 4);
                //check CRC32
                if (crc32(data).compare(crc) != 0){
                    //check for another packet
                    this.processInputData(new Buffer(0));
                }
                //process packet
                this.processMsg(type, data);
            }
        }
    }
    //processes messages from vehicle
    this.processMsg = function(msgType, data){
        if (msgType == this.MSG_TYPES.STATUS){
            var msg = this.decodeVehicleMsg('Status', data);
            if (msg === null){return;}
            for (var socketId in this.sockets){
                this.sockets[socketId].volatile.emit('Status', data);
                    //'volatile' allows the message to be dropped
            }
        } else if (msgType == this.MSG_TYPES.ATTENTION){
            var msg = this.decodeVehicleMsg('Attention', data);
            if (msg === null){return;}
            for (var socketId in this.sockets){
                this.sockets[socketId].emit('Attention', data);
            }
        } else {
            //check if expected
            if (this.pending === null){
                console.log('Unexpected message from vehicle');
                return;
            }
            //decode message
            var msgTypeString;
            switch (msgType){
                case this.MSG_TYPES.GET_PARAMETERS_RESPONSE:
                    msgTypeString = 'GetParametersResponse';
                    break;
                case this.MSG_TYPES.GET_MISSION_RESPONSE:
                    msgTypeString = 'GetMissionResponse';
                    break;
                case this.MSG_TYPES.SUCCESS:
                    msgTypeString = 'Success';
                    break;
                case this.MSG_TYPES.FAILURE:
                    msgTypeString = 'Failure';
                    break;
                default:
                    console.log('Unexpected message type from vehicle');
                    return;
            }
            var msg = this.decodeVehicleMsg(msgTypeString, data);
            if (msg === null){return;}
            //check timestamp
            if (Date.now() - msg.timestamp >= this.TIMEOUT){
                return;
            }
            //clear timeout
            clearTimeout(this.pending.timer);
            //send to client
            this.pending.socket.emit(msgTypeString, data);
            //remove pending message, and send a queued message if any
            this.pending = null;
            this.writeOutputData(null);
        }
    }
    //handle messages from clients
    this.io = socket_io(server);
    this.io.on('connection', function(socket){
        var socketId = this.socketId;
        this.sockets[socketId] = socket;
        this.socketId++;
        //print a message
        var host = socket.client.request.headers.host;
        console.log('connected to: ' + host);
        //when a connection closes, print a message
        socket.on('disconnect', function(){
            delete this.sockets[socketId];
            console.log('disconnected from: ' + host);
        }.bind(this));
        //handle client messages
        socket.on('GetParameters', function(data){
            var msg = this.decodeClientMsg('GetParameters', data);
            if (msg === null){return;}
            console.log('Got a "GetParameters" message');
            this.writeOutputData(this.MSG_TYPES.GET_PARAMETERS, data, socket, msg.timestamp);
        }.bind(this));
        socket.on('GetSettings', function(data){
            var msg = this.decodeClientMsg('GetSettings', data);
            if (msg === null){return;}
            console.log('Got a "GetSettings" message');
            var response = new this.protoPkg.GetSettingsResponse();
            response.timestamp = msg.timestamp;
            for (var i = 0; i < this.settings.length; i++){
                var setting = this.settings[i];
                response.add('settings', new this.protoPkg.Setting(
                    setting[0], setting[1], setting[2]
                ));
            }
            socket.emit('GetSettingsResponse', response.toBuffer());
        }.bind(this));
        socket.on('GetMission', function(data){
            var msg = this.decodeClientMsg('GetMission', data);
            if (msg === null){return;}
            console.log('Got a "GetMission" message');
            this.writeOutputData(this.MSG_TYPES.GET_MISSION, data, socket, msg.timestamp);
        }.bind(this));
        socket.on('GetMissions', function(data){
            var msg = this.decodeClientMsg('GetMissions', data);
            if (msg === null){return;}
            console.log('Got a "GetMissions" message');
            this.missions.timestamp = msg.timestamp;
            socket.emit('GetMissionsResponse', this.missions.toBuffer());
        }.bind(this));
        socket.on('SetParameters', function(data){
            var msg = this.decodeClientMsg('SetParameters', data);
            if (msg === null){return;}
            console.log('Got a "SetParameters" message');
            this.writeOutputData(this.MSG_TYPES.SET_PARAMETERS, data, socket, msg.timestamp);
        }.bind(this));
        socket.on('SetSettings', function(data){
            var newSettings = this.decodeClientMsg('SetSettings', data);
            if (newSettings === null){return;}
            console.log('Got a "SetSettings" message');
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
                var failureMsg = new this.protoPkg.Failure(
                    newSettings.timestamp,
                    'A setting was not found'
                );
                socket.emit('Failure', failureMsg.toBuffer());
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
            socket.emit(
                'Success',
                (new this.protoPkg.Success(newSettings.timestamp)).toBuffer()
            );
        }.bind(this));
        socket.on('SetMission', function(data){
            var msg = this.decodeClientMsg('SetMission', data);
            if (msg === null){return;}
            console.log('Got a "SetMission" message');
            this.writeOutputData(this.MSG_TYPES.SET_MISSION, data, socket, msg.timestamp);
        }.bind(this));
        socket.on('SetMissions', function(data){
            var missionsMsg = this.decodeClientMsg('SetMissions', data);
            if (missionsMsg === null){return;}
            console.log('Got a "SetMissions" message');
            this.missions = missionsMsg;
            socket.emit(
                'Success',
                (new this.protoPkg.Success(missionsMsg.timestamp)).toBuffer()
            );
        }.bind(this));
        socket.on('Command', function(data){
            var msg = this.decodeClientMsg('Command', data);
            if (msg === null){return;}
            console.log('Got a "Command" message');
            this.writeOutputData(this.MSG_TYPES.COMMAND, data, socket, msg.timestamp);
        }.bind(this));
    }.bind(this));
    //helper functions
    this.decodeVehicleMsg = function(msgType, data){
        try {
            return this.protoPkg[msgType].decode(data);
        } catch (e){
            console.log('Unable to decode ' + msgType + ' message from vehicle');
            return null;
        }
    }
    this.decodeClientMsg = function(msgType, data){
        try {
            return this.protoPkg[msgType].decode(data);
        } catch (e){
            console.log('Unable to decode ' + msgType + ' message from a client');
            return null;
        }
    }
}
