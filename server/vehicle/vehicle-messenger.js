'use strict';

let path = require('path');
let protobuf = require('protobufjs');
let EventEmitter = require('events');
let Serial = require('../modules/serial');

class VehicleMessenger extends EventEmitter {
    constructor(inputFile, outputFile, baudRate) {
        super();

        this.protoPkg = null;
        this.serial = new Serial(inputFile, outputFile, baudRate);

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
            ATTENTION:               18
        };

        this.protoPkg = null;
        this.initProtoFiles();
        this.setupEventHandlers();
    }

    initProtoFiles() {
        let protoBuilder = protobuf.loadProtoFile(
            path.join(__dirname, '../public/assets/proto/Test.proto')
        );

        if (protoBuilder === null) {
            throw new Error ('Unable to load proto messages');
        }

        this.protoPkg = protoBuilder.build();
    }

    setupEventHandlers() {
        this.serial.on('packet', (type, data) => {
            switch (type) {
                case this.MSG_TYPES.COMMAND:
                    this.handleCommand(data);
                    break;
                case this.MSG_TYPES.GET_PARAMETERS:
                    this.handleGetParameters(data);
                    break;
                case this.MSG_TYPES.GET_MISSION:
                    this.handleGetMission(data);
                    break;
                case this.MSG_TYPES.SET_PARAMETERS:
                    this.handleSetParameters(data);
                    break;
                case this.MSG_TYPES.SET_MISSION:
                    this.handleSetMission(data);
                    break;
                default:
                    console.log('Unexpected message type from server');
            }
        });

        this.serial.on('error', (msg) => {
            console.log('Serial error: ' + msg);
        });
    }

    handleCommand(data) {
        let message = this.decodeMessage('Command', data);
        if (message === null) {
            return;
        }

        switch (message.type) {
            case this.protoPkg.Command.Type.ARM:
                this.emit('arm', true);
                break;
            case this.protoPkg.Command.Type.DISARM:
                this.emit('arm', false);
                break;
            case this.protoPkg.Command.Type.START:
                this.emit('start', true);
                break;
            case this.protoPkg.Command.Type.RESUME:
                this.emit('start', false);
                break;
            case this.protoPkg.Command.Type.STOP:
                this.emit('stop');
                break;
            case this.protoPkg.Command.Type.KILL:
                this.emit('kill', true);
                break;
            case this.protoPkg.Command.Type.UNKILL:
                this.emit('kill', false);
                break;
            case this.protoPkg.Command.Type.MANUAL:
                this.emit('mode', 'manual');
                break;
            case this.protoPkg.Command.Type.AUTOMATIC:
                this.emit('mode', 'automatic');
                break;
        }
    }

    handleGetParameters(data){
        let message = this.decodeMessage('GetParameters', data);
        if (message === null) {
            return;
        }

        this.emit('get_parameters');
    }

    handleGetMission(data){
        let message = this.decodeMessage('GetMission', data);
        if (message === null) {
            return;
        }

        this.emit('get_mission');
    }

    handleSetParameters(data) {
        let newParams = this.decodeMessage('SetParameters', data);
        if (newParams === null) {
            return;
        }

        this.emit('set_parameters', newParams);
    }

    handleSetMission(data) {
        let message = this.decodeMessage('SetMission', data);
        if (message === null) {
            return;
        }

        this.emit('set_mission', message.mission);
    }

    sendAttentionMessage(message) {
        this.serial.writeData(
            this.MSG_TYPES.ATTENTION,
            (new this.protoPkg.Attention(Date.now(), message)).toBuffer()
        );
    }

    sendStatusMessage(status) {
        let message = new this.protoPkg.Status(
            Date.now(),
            status.lat,
            status.lng,
            status.heading,
            status.speed,
            status.battery,
            status.armed,
            status.mode,
            status.signal
        );

        this.serial.writeData(this.MSG_TYPES.STATUS, message.toBuffer());
    }

    sendGetParametersResponse(parameters) {
        let message = new this.protoPkg.GetParametersResponse();

        message.timestamp = Date.now();

        let param;
        for (let i = 0; i < parameters.length; i++) {
            param = parameters[i];
            message.add('parameters', new this.protoPkg.Parameter(
                param[0], param[1], param[2], param[3], param[4]
            ));
        }
        this.serial.writeData(this.MSG_TYPES.GET_PARAMETERS_RESPONSE, message.toBuffer());
    }

    sendGetMissionResponse(mission) {
        let msg = new this.protoPkg.GetMissionResponse();

        msg.timestamp = Date.now();

        msg.mission = new this.protoPkg.Mission();
        msg.mission.title = mission.title;
        msg.mission.originLatitude = mission.origin.lat;
        msg.mission.originLongitude = mission.origin.lng;

        let wp;
        for (let i = 0; i < mission.waypoints.length; i++) {
            wp = mission.waypoints[i];
            msg.mission.add('waypoints', new this.protoPkg.Mission.Waypoint(
                wp.title, wp.type, wp.position.lat, wp.position.lng
            ));
        }

        this.serial.writeData(this.MSG_TYPES.GET_MISSION_RESPONSE, msg.toBuffer());
    }

    sendSetParametersAck(){
        this.serial.writeData(
            this.MSG_TYPES.SET_PARAMETERS_ACK,
            (new this.protoPkg.SetParametersAck(Date.now())).toBuffer()
        );
    }

    sendSetMissionAck(){
        this.serial.writeData(
            this.MSG_TYPES.SET_MISSION_ACK,
            (new this.protoPkg.SetMissionAck(Date.now())).toBuffer()
        );
    }

    decodeMessage(type, buffer) {
        try {
            return this.protoPkg[type].decode(buffer);
        } catch (error) {
            console.log('Unable to decode ' + type + ' message', error);
            return null;
        }
    }
}

module.exports = VehicleMessenger;
