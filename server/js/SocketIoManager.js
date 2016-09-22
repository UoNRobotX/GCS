'use strict';

let path = require('path');
let fs = require('fs');
let socket_io = require('socket.io');
let protobuf = require('protobufjs');
let Serial = require('../modules/serial');

class SocketIoManager {
    constructor(server, inputFile, outputFile, baudRate){
        this.serial = new Serial(inputFile, outputFile, baudRate);
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
        //settings
        this.settings = [
            ['Map',       'key',       'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA'],
            ['Map',       'lat',       '21.308731'                              ],
            ['Map',       'lng',       '-157.888815'                            ],
            ['Map',       'zoom',      '19'                                     ],
            ['Section 1', 'Setting 1', 'value 1'                                ]
        ];
        //client connections
        this.io = socket_io(server);
        this.sockets = {}; //contains one socket for each client //{socketId1: socket1, ...}
        this.socketId = 0; //incremented for each client connection
        //load .proto messages
        this.protoPkg = null;
        this.initProtoFiles();
        //load mission list
        this.missions = new this.protoPkg.SetMissions(); //mission list stored on server
            // TODO: use a more verbose format intead of a .proto message object
        this.initMissions();
        //setup handlers for client messages
        this.setupClientMessageHandlers();
        //setup handlers for vehicle messages
        this.setupVehicleMessageHandlers();
    }

    initProtoFiles(){
        let protoBuilder = protobuf.loadProtoFile(
            path.join(__dirname, '../public/assets/proto/Test.proto')
        );
        if (protoBuilder === null){
            throw new Error ('Unable to load proto messages');
        }
        this.protoPkg = protoBuilder.build();
    }

    initMissions(){
        let missionsFile = path.join(__dirname, '../data/missions');
        //load missions
        fs.readFile(missionsFile, (error, data) => {
            if (error){
                console.log('Unable to read missions file. Using empty missions list.');
            } else {
                try {
                    this.missions = this.protoPkg.SetMissions.decode(data);
                } catch (e){
                    console.log('Missions file is invalid. Using empty missions list.');
                }
            }
        });
        //save missions on shutdown
        process.on('exit', () => {
            fs.writeFileSync(missionsFile, this.missions.toBuffer());
        });
        process.on('SIGINT', () => {
            fs.writeFileSync(missionsFile, this.missions.toBuffer());
            process.exit();
        });
    }

    setupClientMessageHandlers(){
        this.io.on('connection', (socket) => {
            let socketId = this.socketId;
            this.sockets[socketId] = socket;
            this.socketId++;
            //print a message
            let host = socket.client.request.headers.host;
            console.log('connected to: ' + host);
            //when a connection closes, print a message
            socket.on('disconnect', () => {
                delete this.sockets[socketId];
                console.log('disconnected from: ' + host);
            });
            //client message handlers
            socket.on('GetParameters', (data) => {
                this.handleClientGetParameters(data, socket);
            });
            socket.on('GetSettings', (data) => {
                this.handleClientGetSettings(data, socket);
            });
            socket.on('GetMission', (data) => {
                this.handleClientGetMission(data, socket);
            });
            socket.on('GetMissions', (data) => {
                this.handleClientGetMissions(data, socket);
            });
            socket.on('SetParameters', (data) => {
                this.handleClientSetParameters(data, socket);
            });
            socket.on('SetSettings', (data) => {
                this.handleClientSetSettings(data, socket);
            });
            socket.on('SetMission', (data) => {
                this.handleClientSetMission(data, socket);
            });
            socket.on('SetMissions', (data) => {
                this.handleClientSetMissions(data, socket);
            });
            socket.on('Command', (data) => {
                this.handleClientCommand(data, socket)
            });
        });
    }

    setupVehicleMessageHandlers(){
        this.serial.on('error', (msg) => {
            console.log('Serial error: ' + msg);
        });
        this.serial.on('packet', (msgType, data) => {
            if (msgType == this.MSG_TYPES.STATUS){
                let msg = this.decodeVehicleMsg('Status', data);
                if (msg === null){return;}
                for (let socketId in this.sockets){
                    this.sockets[socketId].volatile.emit('Status', data);
                        //'volatile' allows the message to be dropped
                }
            } else if (msgType == this.MSG_TYPES.ATTENTION){
                let msg = this.decodeVehicleMsg('Attention', data);
                if (msg === null){return;}
                for (let socketId in this.sockets){
                    this.sockets[socketId].emit('Attention', data);
                }
            } else {
                //check if expected
                if (this.pending === null){
                    console.log('Unexpected message from vehicle');
                    return;
                }
                //decode message
                let msgTypeString;
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
                let msg = this.decodeVehicleMsg(msgTypeString, data);
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
                this.sendMsgToVehicle(null);
            }
        });
    }

    handleClientGetParameters(data, socket){
        let msg = this.decodeClientMsg('GetParameters', data);
        if (msg === null){return;}
        console.log('Got a "GetParameters" message');
        this.sendMsgToVehicle(this.MSG_TYPES.GET_PARAMETERS, data, socket, msg.timestamp);
    }

    handleClientGetSettings(data, socket){
        let msg = this.decodeClientMsg('GetSettings', data);
        if (msg === null){return;}
        console.log('Got a "GetSettings" message');
        let response = new this.protoPkg.GetSettingsResponse();
        response.timestamp = msg.timestamp;
        for (let i = 0; i < this.settings.length; i++){
            let setting = this.settings[i];
            response.add('settings', new this.protoPkg.Setting(
                setting[0], setting[1], setting[2]
            ));
        }
        socket.emit('GetSettingsResponse', response.toBuffer());
    }

    handleClientGetMission(data, socket){
        let msg = this.decodeClientMsg('GetMission', data);
        if (msg === null){return;}
        console.log('Got a "GetMission" message');
        this.sendMsgToVehicle(this.MSG_TYPES.GET_MISSION, data, socket, msg.timestamp);
    }

    handleClientGetMissions(data, socket){
        let msg = this.decodeClientMsg('GetMissions', data);
        if (msg === null){return;}
        console.log('Got a "GetMissions" message');
        this.missions.timestamp = msg.timestamp;
        socket.emit('GetMissionsResponse', this.missions.toBuffer());
    }

    handleClientSetParameters(data, socket){
        let msg = this.decodeClientMsg('SetParameters', data);
        if (msg === null){return;}
        console.log('Got a "SetParameters" message');
        this.sendMsgToVehicle(this.MSG_TYPES.SET_PARAMETERS, data, socket, msg.timestamp);
    }

    handleClientSetSettings(data, socket){
        let newSettings = this.decodeClientMsg('SetSettings', data);
        if (newSettings === null){return;}
        console.log('Got a "SetSettings" message');
        //verify new settings
        let settingsToSet = [];
        let i, j;
        SettingSearch:
        for (i = 0; i < newSettings.settings.length; i++){
            let newSetting = newSettings.settings[i];
            for (j = 0; j < this.settings.length; j++){
                let setting = this.settings[j];
                if (newSetting.section == setting[0] &&
                    newSetting.title == setting[1]){
                    // TODO: perform value checking
                    settingsToSet.push(j);
                    continue SettingSearch;
                }
            }
            let failureMsg = new this.protoPkg.Failure(
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
    }

    handleClientSetMission(data, socket){
        let msg = this.decodeClientMsg('SetMission', data);
        if (msg === null){return;}
        console.log('Got a "SetMission" message');
        this.sendMsgToVehicle(this.MSG_TYPES.SET_MISSION, data, socket, msg.timestamp);
    }

    handleClientSetMissions(data, socket){
        let missionsMsg = this.decodeClientMsg('SetMissions', data);
        if (missionsMsg === null){return;}
        console.log('Got a "SetMissions" message');
        this.missions = missionsMsg;
        socket.emit(
            'Success',
            (new this.protoPkg.Success(missionsMsg.timestamp)).toBuffer()
        );
    }

    handleClientCommand(data, socket){
        let msg = this.decodeClientMsg('Command', data);
        if (msg === null){return;}
        console.log('Got a "Command" message');
        this.sendMsgToVehicle(this.MSG_TYPES.COMMAND, data, socket, msg.timestamp);
    }

    decodeVehicleMsg(msgType, data){
        try {
            return this.protoPkg[msgType].decode(data);
        } catch (e){
            console.log('Unable to decode ' + msgType + ' message from vehicle');
            return null;
        }
    }

    decodeClientMsg(msgType, data){
        try {
            return this.protoPkg[msgType].decode(data);
        } catch (e){
            console.log('Unable to decode ' + msgType + ' message from a client');
            return null;
        }
    }

    sendMsgToVehicle(msgType, buffer, socket, timestamp){
        //queue message
        if (msgType !== null){
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
            this.serial.writeData(this.pending.msgType, this.pending.data);
            this.pending.timer = setTimeout(() => {
                this.pending.socket.emit(
                    'Failure',
                    (new this.protoPkg.Failure(
                        this.pending.timestamp,
                        'Vehicle response timeout reached'
                    )).toBuffer()
                );
                //clear pending message info, and send a queued message if any
                this.pending = null;
                this.sendMsgToVehicle(null);
            }, this.TIMEOUT);
        }
    }
}

module.exports = SocketIoManager;
