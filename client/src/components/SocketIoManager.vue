<template>
    <div></div>
</template>

<script>
// This component manages communication with the server via a socket
// It allows for other components to initiate a request to the server
// These are the requests that can be initiated:
    // Status, get_parameters, set_parameters, get_settings, set_settings,
    // Set_missions, get_missions, set_mission, get_mission,
    // Arm, disarm, start_mission, stop_mission, resume_mission, kill, unkill,
// A component initiates a request r1 by dispatching an event client::r1
    // The event goes up to App.vue, then down to this component
    // This component sends a corresponding message to the server

import socket_io_client from 'socket.io-client';
import protobuf from 'protobufjs';

import {
    getMissions, getMissionsLastUpdateTime,
    getParameters, getParametersLastUpdateTime,
    getSettings, getSettingsLastUpdateTime
} from 'store/getters';
import { setWamv, setParameters, setSettings, setMissions } from 'store/actions';

export default {
    vuex: {
        getters: {
            missions:                 getMissions,
            missionsLastUpdateTime:   getMissionsLastUpdateTime,
            parameters:               getParameters,
            parametersLastUpdateTime: getParametersLastUpdateTime,
            settings:                 getSettings,
            settingsLastUpdateTime:   getSettingsLastUpdateTime
        },
        actions: {
            setWamv,
            setParameters,
            setSettings,
            setMissions
        }
    },

    data() {
        return {
            TIMEOUT: 1000,
            socket: null,
            protoBuilder: null,
            protoPkg: null
        };
    },

    ready() {
        // Load .proto files
        this.protoBuilder = protobuf.newBuilder();
        protobuf.loadProtoFile('assets/proto/Test.proto', () => {
            this.protoPkg = this.protoBuilder.build();
            this.initSocket();
        }, this.protoBuilder);
    },

    methods: {
        initSocket(){
            this.socket = socket_io_client('localhost:3000');
            this.socket.on('connect', this.handleConnectionEstablished);
            this.socket.on('disconnect', () => {
                console.log('disconnected from server');
            });
            this.socket.on('Status',                this.handleStatus);
            this.socket.on('GetParametersResponse', this.handleGetParametersResponse);
            this.socket.on('GetSettingsResponse',   this.handleGetSettingsResponse);
            this.socket.on('GetMissionsResponse',   this.handleGetMissionsResponse);
            this.socket.on('GetMissionResponse',    this.handleGetMissionResponse);
            this.socket.on('SetParametersAck',      this.handleSetParametersAck);
            this.socket.on('SetSettingsAck',        this.handleSetSettingsAck);
            this.socket.on('SetMissionAck',         this.handleSetMissionAck);
            this.socket.on('SetMissionsAck',        this.handleSetMissionsAck);
            this.socket.on('Attention',             this.handleAttention);
        },
        sendMsg(msgType, data){
            let timestamp = Date.now();
            let msg;
            switch (msgType){
                case 'controller_event':
                    this.socket.emit('ControllerAction', data);
                    break;
                case 'get_parameters':
                    this.socket.emit(
                        'GetParameters',
                        (new this.protoPkg.GetParameters(timestamp)).toBuffer()
                    );
                    break;
                case 'set_parameters':
                    // 'data' should have this form:
                        // [{section: s1, subsection: s2, title: t1, value: v1}, ...]
                    msg = new this.protoPkg.SetParameters();
                    msg.timestamp = timestamp;
                    for (let param of data){
                        msg.add('parameters', new this.protoPkg.Parameter(
                            param.section,
                            param.subsection,
                            param.title,
                            this.paramType(param.type),
                            param.value
                        ));
                    }
                    this.socket.emit('SetParameters', msg.toBuffer());
                    break;
                case 'get_settings':
                    this.socket.emit(
                        'GetSettings',
                        (new this.protoPkg.GetSettings(timestamp)).toBuffer()
                    );
                    break;
                case 'set_settings':
                    // 'data' should have this form:
                        // [{section: s1, title: t1, value: v1}, ...]
                    msg = new this.protoPkg.SetSettings();
                    msg.timestamp = timestamp;
                    for (let setting of data){
                        msg.add('settings', new this.protoPkg.Setting(
                            setting.section, setting.title, setting.value
                        ));
                    }
                    this.socket.emit('SetSettings', msg.toBuffer());
                    break;
                case 'get_mission':
                    this.socket.emit(
                        'GetMission',
                        (new this.protoPkg.GetMission(timestamp)).toBuffer()
                    );
                    break;
                case 'set_mission':
                    // See elements of 'missions' in store.js for expected 'data' format
                    msg = new this.protoPkg.SetMission(
                        timestamp,
                        new this.protoPkg.Mission()
                    );
                    msg.mission.title = data.title;
                    msg.mission.originLatitude = data.origin.lat;
                    msg.mission.originLongitude = data.origin.lng;
                    for (let waypoint of data.waypoints){
                        msg.mission.add('waypoints', new this.protoPkg.Mission.Waypoint(
                            waypoint.title,
                            this.waypointType(waypoint.type),
                            waypoint.position.lat,
                            waypoint.position.lng
                        ));
                    }
                    this.socket.emit('SetMission', msg.toBuffer());
                    break;
                case 'get_missions':
                    this.socket.emit(
                        'GetMissions',
                        (new this.protoPkg.GetMissions(timestamp)).toBuffer()
                    );
                    break;
                case 'set_missions':
                    // See 'missions' in store.js for expected 'data' format
                    msg = new this.protoPkg.SetMissions();
                    msg.timestamp = timestamp;
                    for (let mission of data){
                        let m = new this.protoPkg.Mission();
                        m.title = mission.title;
                        m.originLatitude = mission.origin.lat;
                        m.originLongitude = mission.origin.lng;
                        for (let waypoint of mission.waypoints){
                            m.add('waypoints', new this.protoPkg.Mission.Waypoint(
                                waypoint.title,
                                this.waypointType(waypoint.type),
                                waypoint.position.lat,
                                waypoint.position.lng
                            ));
                        }
                        msg.add('missions', m);
                    }
                    this.socket.emit('SetMissions', msg.toBuffer());
                    break;
                case 'arm':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.ARM
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
                case 'disarm':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.DISARM
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
                case 'start_mission':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.START
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
                case 'stop_mission':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.STOP
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
                case 'resume_mission':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.RESUME
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
                case 'kill':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.KILL
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
                case 'unkill':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.UNKILL
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
                case 'manual':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.MANUAL
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
                case 'auto':
                    msg = new this.protoPkg.Command(
                        timestamp,
                        this.protoPkg.Command.Type.AUTOMATIC
                    );
                    this.socket.emit('Command', msg.toBuffer());
                    break;
            }
        },
        handleConnectionEstablished(){
            console.log('connected to server');
            // Get parameters once at startup
            this.sendMsg('get_parameters', null);
            setTimeout(() => {
                if (this.parametersLastUpdateTime === null){
                    this.$dispatch(
                        'app::create-snackbar',
                        'Parameters list failed to load'
                    );
                }
            }, this.TIMEOUT);
            // Get settings once at startup
            this.sendMsg('get_settings', null);
            setTimeout(() => {
                if (this.settingsLastUpdateTime === null){
                    this.$dispatch(
                        'app::create-snackbar',
                        'Settings list failed to load'
                    );
                }
            }, this.TIMEOUT);
            // Load missions once at startup
            this.sendMsg('get_missions', null);
            setTimeout(() => {
                if (this.missionsLastUpdateTime === null){
                    this.$dispatch(
                        'app::create-snackbar',
                        'Mission list failed to load'
                    );
                }
            }, this.TIMEOUT);
        },
        handleStatus(data){
            // Decode message
            let msg;
            try {
                msg = this.protoPkg.Status.decode(data);
            } catch (e){
                console.log('Unable to decode Status message');
                return;
            }
            // Update wamv
            this.setWamv({
                loaded:   true,
                position: {lat: msg.latitude, lng: msg.longitude},
                heading:  msg.heading,
                speed:    msg.speed,
                battery:  msg.battery,
                armed:    msg.armed,
                mode:     this.modeString(msg.mode),
                signal:   msg.signal
            });
        },
        handleGetParametersResponse(data){
            // Decode message
            let paramsMsg;
            try {
                paramsMsg = this.protoPkg.GetParametersResponse.decode(data);
            } catch (e){
                console.log('Unable to decode GetParametersResponse message');
                return;
            }
            // Convert received parameters into an intermediate structure
                // {section1: {subsection1: {param1: {type: t2, value: v1}}, ...}, ...}
            let tempParams = {};
            for (let p of paramsMsg.parameters){
                if (p.section in tempParams){
                    if (p.subSection in tempParams[p.section]){
                        if (p.title in tempParams[p.section][p.subSection]){
                            console.log('Warning: received duplicate parameter');
                        } else {
                            tempParams[p.section][p.subSection][p.title] = {
                                type: this.paramTypeString(p.type),
                                value: p.value
                            };
                        }
                    } else {
                        tempParams[p.section][p.subSection] = {
                            [p.title]: {
                                type: this.paramTypeString(p.type),
                                value: p.value
                            }
                        };
                    }
                } else {
                    tempParams[p.section] = {
                        [p.subSection]: {
                            [p.title]: {
                                type: this.paramTypeString(p.type),
                                value: p.value
                            }
                        }
                    };
                }
            }
            // Convert intermediate structure into one that is convenient for display
            let newParams = [];
            for (let sectionName of Object.getOwnPropertyNames(tempParams)){
                let section = tempParams[sectionName];
                let newSection = {title: sectionName, subSections: []};
                newParams.push(newSection);
                for (let subSectionName of Object.getOwnPropertyNames(section)){
                    let subSection = section[subSectionName];
                    let newSubSection = {title: subSectionName, params: []};
                    newSection.subSections.push(newSubSection);
                    for (let paramName of Object.getOwnPropertyNames(subSection)){
                        let param = subSection[paramName];
                        newSubSection.params.push({
                            title: paramName,
                            type: param.type,
                            value: param.value,
                            valid: true // TODO: remove this?
                        });
                    }
                }
            }
            // Set parameters
            this.setParameters(newParams);
            console.log('Parameters loaded.');
        },
        handleGetSettingsResponse(data){
            // Decode message
            let settingsMsg;
            try {
                settingsMsg = this.protoPkg.GetSettingsResponse.decode(data);
            } catch (e){
                console.log('Unable to decode GetSettingsResponse message');
                return;
            }
            // Convert received settings into an intermediate structure
                // {section1: {setting1: value1}, ...}
            let tempSettings = {};
            for (let s of settingsMsg.settings){
                if (s.section in tempSettings){
                    if (s.title in tempSettings[s.section]){
                        console.log('Warning: received duplicate setting');
                    } else {
                        tempSettings[s.section][s.title] = s.value;
                    }
                } else {
                    tempSettings[s.section] = {
                        [s.title]: s.value
                    };
                }
            }
            // Convert intermediate structure into one that is convenient for display
            let newSettings = [];
            for (let sectionName of Object.getOwnPropertyNames(tempSettings)){
                let section = tempSettings[sectionName];
                let newSection = {title: sectionName, settings: []};
                newSettings.push(newSection);
                for (let settingName of Object.getOwnPropertyNames(section)){
                    newSection.settings.push({
                        title: settingName,
                        value: section[settingName]
                    });
                }
            }
            // Set settings
            this.setSettings(newSettings);
            console.log('Settings loaded.');
        },
        handleGetMissionsResponse(data){
            // Decode message
            let missionsMsg;
            try {
                missionsMsg = this.protoPkg.GetMissionsResponse.decode(data);
            } catch (e){
                console.log('Unable to decode GetMissionsResponse message');
                return;
            }
            // Convert received missions into a certain structure
            let newMissions = [];
            for (let mission of missionsMsg.missions){
                newMissions.push({
                    title: mission.title,
                    origin: {
                        lat: mission.originLatitude,
                        lng: mission.originLongitude
                    },
                    waypoints: mission.waypoints.map((wp) => {
                        return {
                            title: wp.title,
                            type: this.waypointTypeString(wp.type),
                            position: {
                                lat: wp.latitude,
                                lng: wp.longitude
                            },
                            visible: true // TODO: remove this?
                        };
                    })
                });
            }
            // Set missions
            this.setMissions(newMissions);
            console.log('Missions loaded.');
        },
        handleGetMissionResponse(data){
            // Decode message
            let missionMsg;
            try {
                missionMsg = this.protoPkg.GetMissionResponse.decode(data).mission;
            } catch (e){
                console.log('Unable to decode GetMissionResponse message');
                return;
            }
            // Convert received mission into a certain structure, and append it to the list
            this.missions.push({
                title: missionMsg.title,
                origin: {
                    lat: missionMsg.originLatitude,
                    lng: missionMsg.originLongitude
                },
                waypoints: missionMsg.waypoints.map((wp) => {
                    return {
                        title: wp.title,
                        type: this.waypointTypeString(wp.type),
                        position: {
                            lat: wp.latitude,
                            lng: wp.longitude
                        },
                        visible: true // TODO: remove this?
                    };
                })
            });
            console.log('Mission downloaded.');
        },
        handleSetParametersAck(data){
            // Decode message
            try {
                this.protoPkg.SetParametersAck.decode(data);
            } catch (e){
                console.log('Unable to decode SetParametersAck message');
                return;
            }
            // Notify
            this.$dispatch('app::create-snackbar', 'Parameters set on vehicle');
            this.$dispatch('server::set_parameters_ack');
        },
        handleSetSettingsAck(data){
            // Decode message
            try {
                this.protoPkg.SetSettingsAck.decode(data);
            } catch (e){
                console.log('Unable to decode SetSettingsAck message');
                return;
            }
            // Notify
            this.$dispatch('app::create-snackbar', 'Settings set on server');
            this.$dispatch('server::set_settings_ack');
        },
        handleSetMissionAck(data){
            // Decode message
            try {
                this.protoPkg.SetMissionAck.decode(data);
            } catch (e){
                console.log('Unable to decode SetMissionAck message');
                return;
            }
            // Notify
            this.$dispatch('app::create-snackbar', 'Mission set on vehicle');
            this.$dispatch('server::set_mission_ack');
        },
        handleSetMissionsAck(data){
            // Decode message
            try {
                this.protoPkg.SetMissionsAck.decode(data);
            } catch (e){
                console.log('Unable to decode SetMissionsAck message');
                return;
            }
            // Notify
            this.$dispatch('app::create-snackbar', 'Mission list set on server');
        },
        handleAttention(data){
            // Decode message
            let attentionMsg;
            try {
                attentionMsg = this.protoPkg.Attention.decode(data);
            } catch (e){
                console.log('Unable to decode Attention message');
                return;
            }
            // Display message
            this.$dispatch('app::create-snackbar', attentionMsg.msg);
        },
        // TODO: make the following methods unnecessary?
        modeString(mode){
            switch (mode){
                case this.protoPkg.Status.Mode.STOPPED: return 'idle';
                case this.protoPkg.Status.Mode.AUTO:    return 'auto';
                case this.protoPkg.Status.Mode.PAUSED:  return 'paused';
                case this.protoPkg.Status.Mode.KILLED:  return 'killed';
                case this.protoPkg.Status.Mode.MANUAL:  return 'manual';
                default: throw new Error('Invalid mode type');
            }
        },
        paramTypeString(type){
            switch (type){
                case this.protoPkg.Parameter.Type.DOUBLE: return 'double';
                case this.protoPkg.Parameter.Type.VEC3:   return 'vec3';
                case this.protoPkg.Parameter.Type.MAT3:   return 'mat3';
                default: throw new Error('Invalid parameter type');
            }
        },
        paramType(str){
            switch (str){
                case 'double': return this.protoPkg.Parameter.Type.DOUBLE;
                case 'vec3':   return this.protoPkg.Parameter.Type.VEC3;
                case 'mat3':   return this.protoPkg.Parameter.Type.MAT3;
                default: throw new Error('Invalid parameter type string');
            }
        },
        waypointTypeString(type){
            switch (type){
                case this.protoPkg.Mission.Waypoint.Type.GO_TO_POINT:
                    return 'go_to_point';
                default:
                    throw new Error('Invalid waypoint type string');
            }
        },
        waypointType(str){
            switch (str){
                case 'go_to_point':
                    return this.protoPkg.Mission.Waypoint.Type.GO_TO_POINT;
                default:
                    throw new Error('Invalid waypoint type');
            }
        }
    },

    events: {
        'client::get_parameters'() {
            this.sendMsg('get_parameters', null);
        },

        'client::set_parameters'(params) {
            this.sendMsg('set_parameters', params);
        },

        'client::get_settings'() {
            this.sendMsg('get_settings', null);
        },

        'client::set_settings'(settings) {
            this.sendMsg('set_settings', settings);
        },

        'client::set_missions'(missions) {
            this.sendMsg('set_missions', missions);
        },

        'client::get_missions'() {
            this.sendMsg('get_missions', null);
        },

        'client::set_mission'(mission) {
            this.sendMsg('set_mission', mission);
        },

        'client::get_mission'() {
            this.sendMsg('get_mission', null);
        },

        'client::arm'() {
            this.sendMsg('arm', null);
        },

        'client::disarm'() {
            this.sendMsg('disarm', null);
        },

        'client::start_mission'() {
            this.sendMsg('start_mission', null);
        },

        'client::stop_mission'() {
            this.sendMsg('stop_mission', null);
        },

        'client::resume_mission'() {
            this.sendMsg('resume_mission', null);
        },

        'client::kill'() {
            this.sendMsg('kill', null);
        },

        'client::unkill'() {
            this.sendMsg('unkill', null);
        },

        'client::manual'() {
            this.sendMsg('manual', null);
        },

        'client::auto'() {
            this.sendMsg('auto', null);
        },
        'client::controller_event'(data) {
            this.sendMsg('controller_event',data);
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
