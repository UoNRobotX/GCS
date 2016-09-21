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
            SET_SETTINGS:            11,
            SET_MISSION:             12,
            SET_MISSIONS:            13,
            SUCCESS:                 14,
            FAILURE:                 15,
            ATTENTION:               16
        };

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
        this.serial.on('packet', (type, data, id) => {
            switch (type) {
                case this.MSG_TYPES.COMMAND:
                    this.handleCommand(data, id);
                    break;
                case this.MSG_TYPES.GET_PARAMETERS:
                    this.emit('get_parameters', id);
                    break;
                case this.MSG_TYPES.GET_MISSION:
                    this.emit('get_mission', id);
                    break;
                case this.MSG_TYPES.SET_PARAMETERS:
                    this.handleSetParameters(data, id);
                    break;
                case this.MSG_TYPES.SET_MISSION:
                    this.handleSetMission(data, id);
                    break;
                default:
                    this.sendFailureMessage('Unexpected message type', id);
            }
        });
    }

    handleCommand(data, id) {
        var message = this.decodeMessage('Command', data, id);

        if (message === null) {
            return;
        }

        switch (message.type) {
            case this.protoPkg.Command.Type.ARM:
                this.emit('arm', true, id);
                break;
            case this.protoPkg.Command.Type.DISARM:
                this.emit('arm', false, id);
                break;
            case this.protoPkg.Command.Type.START:
                this.emit('start', true, id);
                break;
            case this.protoPkg.Command.Type.RESUME:
                this.emit('start', false, id);
                break;
            case this.protoPkg.Command.Type.STOP:
                this.emit('stop', id);
                break;
            case this.protoPkg.Command.Type.KILL:
                this.emit('kill', true, id);
                break;
            case this.protoPkg.Command.Type.UNKILL:
                this.emit('kill', false, id);
                break;
        }
    }

    handleSetParameters(data, id) {
        var newParams = this.decodeMessage('SetParameters', data);
        if (newParams === null) {
            return;
        }

        this.emit('set_parameters', newParams, id);
    }

    handleSetMission(data, id) {
        let setMissionMessage = this.decodeMessage('SetMission', data);
        if (setMissionMessage === null) {
            return;
        }

        let newMission = setMissionMessage.mission;

        this.emit('set_mission', newMission, id);
    }

    sendSuccessMessage(id) {
        this.serial.writeData(
            this.MSG_TYPES.SUCCESS,
            (new this.protoPkg.Success()).toBuffer(),
            id
        );
    }

    sendFailureMessage(message, id) {
        this.serial.writeData(
            this.MSG_TYPES.FAILURE,
            (new this.protoPkg.Failure(message)).toBuffer(),
            id
        );
    }

    sendAttentionMessage(message, id) {
        this.serial.writeData(
            this.MSG_TYPES.ATTENTION,
            (new this.protoPkg.Attention(message)).toBuffer(),
            id
        );
    }

    sendStatusMessage(status, id) {
        let message = new this.protoPkg.Status(
            status.lat,
            status.lng,
            status.heading,
            status.speed,
            status.battery,
            status.armed,
            status.mode,
            status.signal
        );

        this.serial.writeData(this.MSG_TYPES.STATUS, message.toBuffer(), 0);
    }

    sendGetParametersResponse(parameters, id) {
        let message = new this.protoPkg.GetParametersResponse();
        let param;

        for (let i = 0; i < parameters.length; i++) {
            param = parameters[i];
            message.add('parameters', new this.protoPkg.Parameter(
                param[0], param[1], param[2], param[3], param[4]
            ));
        }
        this.serial.writeData(this.MSG_TYPES.GET_PARAMETERS_RESPONSE, message.toBuffer(), id);
    }

    sendGetMissionResponse(mission, id) {
        let msg = new this.protoPkg.GetMissionResponse(new this.protoPkg.Mission());

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

        this.serial.writeData(this.MSG_TYPES.GET_MISSION_RESPONSE, msg.toBuffer(), id);
    }

    decodeMessage(type, buffer, id) {
        try {
            return this.protoPkg[type].decode(buffer);
        } catch (error) {
            console.log('Vehicle: Unable to decode ' + type + ' message', error);
            this.sendFailureMessage('Invalid message', id);

            return null;
        }
    }
}

module.exports = VehicleMessenger;
