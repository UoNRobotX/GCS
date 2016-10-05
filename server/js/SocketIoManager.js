'use strict';

let path = require('path');
let fs = require('fs');
let socket_io = require('socket.io');
let protobuf = require('protobufjs');
let Serial = require('../modules/serial');

class SocketIoManager {
    constructor(server, inputFile, outputFile, baudRate){
        this.serial = new Serial(inputFile, outputFile, baudRate);
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
            SET_PARAMETERS_ACK:      11,
            SET_SETTINGS:            12,
            SET_SETTINGS_ACK:        13,
            SET_MISSION:             14,
            SET_MISSION_ACK:         15,
            SET_MISSIONS:            16,
            SET_MISSIONS_ACK:        17,
            ATTENTION:               18,
            CONTROLLER_COMMAND:      19,
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
        this.pendingGetParametersRequests = []; //contains socket IDs for clients requesting params
        this.pendingGetMissionRequests = [];
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

        this.protoMessages = {};
    }

    initProtoFiles(){
        let protoBuilder = protobuf.loadProtoFile(
            path.join(__dirname, '../public/assets/proto/Test.proto')
        );
        if (protoBuilder === null){
            throw new Error ('Unable to load proto messages');
        }
        this.protoPkg = protoBuilder.build();


        protoBuilder = protobuf.loadProtoFile(path.join(__dirname, '../public/assets/proto/ControllerCommand.proto'));
        if (protoBuilder === null){
            throw new Error ('Unable to load Controller Command proto message');
        }
        let ControllerCommand = protoBuilder.build('message.communication.ControllerCommand');
        this.controllerCommand = new ControllerCommand();
        this.lastControllerCommandMessageTS = 0;
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
                delete this.pendingGetParametersRequests[socketId];
                delete this.pendingGetMissionRequests[socketId];
                console.log('disconnected from: ' + host);
            });
            //client message handlers
            socket.on('GetParameters', (data) => {
                this.handleClientGetParameters(data, socketId);
            });
            socket.on('GetSettings', (data) => {
                this.handleClientGetSettings(data, socket);
            });
            socket.on('GetMission', (data) => {
                this.handleClientGetMission(data, socketId);
            });
            socket.on('GetMissions', (data) => {
                this.handleClientGetMissions(data, socket);
            });
            socket.on('SetParameters', (data) => {
                this.handleClientSetParameters(data);
            });
            socket.on('SetSettings', (data) => {
                this.handleClientSetSettings(data, socket);
            });
            socket.on('SetMission', (data) => {
                this.handleClientSetMission(data);
            });
            socket.on('SetMissions', (data) => {
                this.handleClientSetMissions(data);
            });
            socket.on('Command', (data) => {
                this.handleClientCommand(data)
            });
            socket.on('ControllerAction', (data) => {
                this.handelClientControllerAction(data);
            });
        });
    }

    setupVehicleMessageHandlers(){
        this.serial.on('error', (msg) => {
            console.log('Serial error: ' + msg);
        });
        this.serial.on('packet', (msgType, data) => {
            switch (msgType){
                case this.MSG_TYPES.STATUS:
                    for (let socketId in this.sockets){
                        this.sockets[socketId].volatile.emit('Status', data);
                            //'volatile' allows the message to be dropped
                    }
                    break;
                case this.MSG_TYPES.ATTENTION:
                    for (let socketId in this.sockets){
                        this.sockets[socketId].emit('Attention', data);
                    }
                    break;
                case this.MSG_TYPES.GET_PARAMETERS_RESPONSE:
                    for (let socketId of this.pendingGetParametersRequests){
                        this.sockets[socketId].emit('GetParametersResponse', data);
                    }
                    this.pendingGetParametersRequests = [];
                    break;
                case this.MSG_TYPES.GET_MISSION_RESPONSE:
                    for (let socketId of this.pendingGetMissionRequests){
                        this.sockets[socketId].emit('GetMissionResponse', data);
                    }
                    this.pendingGetMissionRequests = [];
                    break;
                case this.MSG_TYPES.SET_PARAMETERS_ACK:
                    for (let socketId in this.sockets){
                        this.sockets[socketId].emit('SetParametersAck', data);
                    }
                    break;
                case this.MSG_TYPES.SET_MISSION_ACK:
                    for (let socketId in this.sockets){
                        this.sockets[socketId].emit('SetMissionAck', data);
                    }
                    break;
                default:
                    console.log('Unexpected message type from vehicle');
                    return;
            }
        });
    }

    handelClientControllerAction(data){
        if (this.controllerCommand) {
            this.controllerCommand.time_stamp_ms = (new Date).getTime();
            switch(data.name) {

                case 'LEFT_ANALOG_STICK':
                    this.controllerCommand.motor1_thrust = -data.position.y;
                    this.controllerCommand.motor1_angle = data.position.x;
                break;

                case 'RIGHT_ANALOG_STICK':
                   this.controllerCommand.motor2_thrust = -data.position.y;
                   this.controllerCommand.motor2_angle = data.position.x;
                break;

                default:
                return;
            }

            //Avoid spamming the serial port
           // if (this.controllerCommand.time_stamp_ms - this.lastControllerCommandMessageTS > 100) {
                console.log('Controller Command');
                console.log(this.controllerCommand);
                let buffer = this.controllerCommand.encode().buffer;
                this.serial.writeData(this.MSG_TYPES.CONTROLLER_COMMAND, buffer);
                this.lastControllerCommandMessageTS = this.controllerCommand.time_stamp_ms;
            //}
        }
    }

    handleClientGetParameters(data, socketId){
        let msg = this.decodeClientMsg('GetParameters', data);
        if (msg === null){return;}
        console.log('Got a "GetParameters" message');
        this.pendingGetParametersRequests.push(socketId);
        this.serial.writeData(this.MSG_TYPES.GET_PARAMETERS, data);
    }

    handleClientGetSettings(data, socket){
        let msg = this.decodeClientMsg('GetSettings', data);
        if (msg === null){return;}
        console.log('Got a "GetSettings" message');
        let response = new this.protoPkg.GetSettingsResponse();
        response.timestamp = Date.now();
        for (let i = 0; i < this.settings.length; i++){
            let setting = this.settings[i];
            response.add('settings', new this.protoPkg.Setting(
                setting[0], setting[1], setting[2]
            ));
        }
        socket.emit('GetSettingsResponse', response.toBuffer());
    }

    handleClientGetMission(data, socketId){
        let msg = this.decodeClientMsg('GetMission', data);
        if (msg === null){return;}
        console.log('Got a "GetMission" message');
        this.pendingGetMissionRequests.push(socketId);
        this.serial.writeData(this.MSG_TYPES.GET_MISSION, data);
    }

    handleClientGetMissions(data, socket){
        let msg = this.decodeClientMsg('GetMissions', data);
        if (msg === null){return;}
        console.log('Got a "GetMissions" message');
        this.missions.timestamp = Date.now();
        socket.emit('GetMissionsResponse', this.missions.toBuffer());
    }

    handleClientSetParameters(data){
        let msg = this.decodeClientMsg('SetParameters', data);
        if (msg === null){return;}
        console.log('Got a "SetParameters" message');
        this.serial.writeData(this.MSG_TYPES.SET_PARAMETERS, data);
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
            console.log('A setting was not found');
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
        //notify clients
        for (let socketId in this.sockets){
            this.sockets[socketId].emit(
                'SetSettingsAck',
                (new this.protoPkg.SetSettingsAck(Date.now())).toBuffer()
            );
        }
    }

    handleClientSetMission(data){
        let msg = this.decodeClientMsg('SetMission', data);
        if (msg === null){return;}
        console.log('Got a "SetMission" message');
        this.serial.writeData(this.MSG_TYPES.SET_MISSION, data);
    }

    handleClientSetMissions(data){
        let missionsMsg = this.decodeClientMsg('SetMissions', data);
        if (missionsMsg === null){return;}
        console.log('Got a "SetMissions" message');
        this.missions = missionsMsg;
        //notify clients
        for (let socketId in this.sockets){
            this.sockets[socketId].emit(
                'SetMissionsAck',
                (new this.protoPkg.SetMissionsAck(Date.now())).toBuffer()
            );
        }
    }

    handleClientCommand(data){
        let msg = this.decodeClientMsg('Command', data);
        if (msg === null){return;}
        console.log('Got a "Command" message');
        this.serial.writeData(this.MSG_TYPES.COMMAND, data);
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
}

module.exports = SocketIoManager;
