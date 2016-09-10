<template>
    <div></div>
</template>

<script>
import socket_io_client from 'socket.io-client';
import protobuf from 'protobufjs';

import { getMissions } from 'store/getters';
import { setWamv, setParameters, setSettings, setMissions } from 'store/actions';

export default {
    vuex: {
        getters: {
            missions: getMissions
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
            socket: null,
            msgId: 0, //used to assign IDs to sent messages
            pending: {}, //contains data for each sent message for which a response is expected
                //pending[id] = {type, timer, initiator}
            MAX_MSG_ID: Math.pow(2,53), //this is probably unnecessary
            TIMEOUT: 1000,
            protoBuilder: null,
            protoPkg: null
        };
    },

    ready() {
        //load .proto files
        this.protoBuilder = protobuf.newBuilder();
        protobuf.loadProtoFile('assets/proto/Test.proto', () => {
            this.protoPkg = this.protoBuilder.build();
            this.initSocket();
        }, this.protoBuilder);
    },

    methods: {
        initSocket(){
            this.socket = socket_io_client('localhost:3000');
            this.socket.on('connect', () => {
                console.log('connected to server');
                //get parameters once at startup
                this.sendMsg('get_parameters', null, 'init');
                this.$once('server.get_parameters:failure', function(initiator){
                    if (initiator === 'init'){
                        this.$dispatch('app::create-snackbar', 'Failed to load parameters');
                    }
                    return true;
                });
                //get settings once at startup
                this.sendMsg('get_settings', null, 'init');
                this.$once('server.get_settings:failure', function(initiator){
                    if (initiator === 'init'){
                        this.$dispatch('app::create-snackbar', 'Failed to load settings');
                    }
                    return true;
                });
                //load missions once at startup
                this.sendMsg('load_missions', null, 'init');
                this.$once('server.load_missions:failure', function(initiator){
                    if (initiator === 'init'){
                        this.$dispatch('app::create-snackbar', 'Failed to load missions');
                    }
                    return true;
                });
            });
            this.socket.on('disconnect', () => {
                console.log('disconnected from server');
            });
            this.socket.on('Status', (data) => {
                //decode message
                var msg;
                try {
                    msg = this.protoPkg.Status.decode(data);
                } catch (e){
                    console.log('Unable to decode Status message');
                    return;
                }
                //update wamv
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
            });
            this.socket.on('Parameters', (data, id) => {
                //decode message
                var paramsMsg;
                try {
                    paramsMsg = this.protoPkg.Parameters.decode(data);
                } catch (e){
                    console.log('Unable to decode Parameters message');
                    return;
                }
                //set parameters
                if (id in this.pending){
                    let msg = this.pending[id];
                    delete this.pending[id];
                    clearTimeout(msg.timer);
                    //convert received parameters into an intermediate structure
                        //{section1: {subsection1: {param1: {type: t2, value: v1}}, ...}, ...}
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
                    //convert intermediate structure into one that is convenient for display
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
                    this.setParameters(newParams);
                    console.log('Parameters loaded.');
                    this.$dispatch('server.get_parameters:success', msg.initiator);
                }
            });
            this.socket.on('Settings', (data, id) => {
                //decode message
                var settingsMsg;
                try {
                    settingsMsg = this.protoPkg.Settings.decode(data);
                } catch (e){
                    console.log('Unable to decode Settings message');
                    return;
                }
                //set settings
                if (id in this.pending){
                    let msg = this.pending[id];
                    delete this.pending[id];
                    clearTimeout(msg.timer);
                    //convert received settings into an intermediate structure
                        //{section1: {setting1: value1}, ...}
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
                    //convert intermediate structure into one that is convenient for display
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
                    this.setSettings(newSettings);
                    console.log('Settings loaded.');
                    this.$dispatch('server.get_settings:success', msg.initiator);
                }
            });
            this.socket.on('Missions', (data, id) => {
                //decode message
                var missionsMsg;
                try {
                    missionsMsg = this.protoPkg.Missions.decode(data);
                } catch (e){
                    console.log('Unable to decode Missions message');
                    return;
                }
                //set missions
                if (id in this.pending){
                    let msg = this.pending[id];
                    delete this.pending[id];
                    clearTimeout(msg.timer);
                    //convert received missions into a certain structure
                    let newMissions = [];
                    for (let mission of missionsMsg.missions){
                        newMissions.push({
                            title: mission.title,
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
                    this.setMissions(newMissions);
                    console.log('Missions loaded.');
                    this.$dispatch('server.load_missions:success', msg.initiator);
                }
            });
            this.socket.on('Mission', (data, id) => {
                //decode message
                var missionMsg;
                try {
                    missionMsg = this.protoPkg.Mission.decode(data);
                } catch (e){
                    console.log('Unable to decode Mission message');
                    return;
                }
                //add mission to mission list
                if (id in this.pending){
                    let msg = this.pending[id];
                    delete this.pending[id];
                    clearTimeout(msg.timer);
                    //convert received mission into a certain structure, and append it to the list
                    this.missions.push({
                        title: missionMsg.title,
                        waypoints: missionMsg.waypoints.map((wp) => {
                            return {
                                title: wp.title,
                                type: this.waypointTypeString(wp.type),
                                position: {
                                    lat: wp.latitude,
                                    lng: wp.longitude
                                },
                                visible: true // TODO: remove this?
                            }
                        })
                    });
                    console.log('Mission downloaded.');
                    this.$dispatch('server.download_mission:success', msg.initiator);
                }
            });
            this.socket.on('Success', (data, id) => {
                //decode message
                var successMsg;
                try {
                    successMsg = this.protoPkg.Success.decode(data);
                } catch (e){
                    console.log('Unable to decode Success message');
                    return;
                }
                //
                console.log('received "Success" message');
                if (id in this.pending){
                    let msg = this.pending[id];
                    delete this.pending[id];
                    clearTimeout(msg.timer);
                    switch (msg.type){
                        case 'set_parameters': {console.log('Parameters set.');          break;}
                        case 'set_settings':   {console.log('Settings set.');            break;}
                        case 'save_missions':  {console.log('Missions saved.');          break;}
                        case 'upload_mission': {console.log('Mission uploaded.');        break;}
                        case 'arm':            {console.log('Vehicle armed.');           break;}
                        case 'disarm':         {console.log('Vehicle disarmed.');        break;}
                        case 'start_mission':  {console.log('Mission started.');         break;}
                        case 'stop_mission':   {console.log('Mission stopped.');         break;}
                        case 'resume_mission': {console.log('Mission resumed.');         break;}
                        case 'kill':           {console.log('Kill switch activated.');   break;}
                        case 'unkill':         {console.log('Kill switch deactivated.'); break;}
                    }
                    this.$dispatch('server.' + msg.type + ':success', msg.initiator);
                }
            });
            this.socket.on('Failure', (data, id) => {
                //decode message
                var failureMsg;
                try {
                    failureMsg = this.protoPkg.Failure.decode(data);
                } catch (e){
                    console.log('Unable to decode Failure message');
                    return;
                }
                //
                console.log('received "Failure" message');
                let errorMsg = failureMsg.msg;
                if (id in this.pending){
                    let msg = this.pending[id];
                    delete this.pending[id];
                    clearTimeout(msg.timer);
                    switch (msg.type){
                        case 'get_parameters':   {console.log('Unable to load parameters: '        + errorMsg); break;}
                        case 'set_parameters':   {console.log('Unable to set parameters: '         + errorMsg); break;}
                        case 'get_settings':     {console.log('Unable to load settings: '          + errorMsg); break;}
                        case 'set_settings':     {console.log('Unable to set settings: '           + errorMsg); break;}
                        case 'save_missions':    {console.log('Unable to save missions: '          + errorMsg); break;}
                        case 'load_missions':    {console.log('Unable to load missions: '          + errorMsg); break;}
                        case 'upload_mission':   {console.log('Unable to upload mission: '         + errorMsg); break;}
                        case 'download_mission': {console.log('Unable to download mission: '       + errorMsg); break;}
                        case 'arm':              {console.log('Unable to arm vehicle: '            + errorMsg); break;}
                        case 'disarm':           {console.log('Unable to disarm vehicle: '         + errorMsg); break;}
                        case 'start_mission':    {console.log('Unable to start mission: '          + errorMsg); break;}
                        case 'stop_mission':     {console.log('Unable to stop mission: '           + errorMsg); break;}
                        case 'resume_mission':   {console.log('Unable to resume mission: '         + errorMsg); break;}
                        case 'kill':             {console.log('Unable to activate kill switch: '   + errorMsg); break;}
                        case 'unkill':           {console.log('Unable to deactivate kill switch: ' + errorMsg); break;}
                    }
                    this.$dispatch('server.' + msg.type + ':failure', errorMsg, msg.initiator);
                }
            });
            this.socket.on('Attention', (data) => {
                //decode message
                var attentionMsg;
                try {
                    attentionMsg = this.protoPkg.Attention.decode(data);
                } catch (e){
                    console.log('Unable to decode Attention message');
                    return;
                }
                //
                //console.log('Attention: ' + msg);
                this.$dispatch('app::create-snackbar', attentionMsg.msg);
            });
        },
        sendMsg(msgType, data, initiator){
            this.pending[this.msgId] = {
                type: msgType,
                initiator: initiator,
                timer: setTimeout(() => {
                    delete this.pending[this.msgId];
                    console.log('Timeout reached for a "' + msgType + '" request');
                    this.$dispatch('server.' + msgType + ':failure', 'Timeout reached.', initiator);
                }, this.TIMEOUT)
            };
            switch (msgType){
                case 'get_parameters': {
                    let getMsg = new this.protoPkg.Get(this.protoPkg.Get.Type.PARAMETERS);
                    this.socket.emit('Get', getMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'set_parameters': {
                    let paramsMsg = new this.protoPkg.Parameters();
                    for (let param of data){
                        paramsMsg.add('parameters', new this.protoPkg.Parameters.Parameter(
                            param.section,
                            param.subsection,
                            param.title,
                            this.paramType(param.type),
                            param.value
                        ));
                    }
                    this.socket.emit('Parameters', paramsMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'get_settings': {
                    let getMsg = new this.protoPkg.Get(this.protoPkg.Get.Type.SETTINGS);
                    this.socket.emit('Get', getMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'set_settings': {
                    let settingsMsg = new this.protoPkg.Settings();
                    for (let setting of data){
                        settingsMsg.add('settings', new this.protoPkg.Settings.Setting(
                            setting.section, setting.title, setting.value
                        ));
                    }
                    this.socket.emit('Settings', settingsMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'load_missions': {
                    let getMsg = new this.protoPkg.Get(this.protoPkg.Get.Type.MISSIONS);
                    this.socket.emit('Get', getMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'save_missions': {
                    let missionsMsg = new this.protoPkg.Missions();
                    for (let mission of data){
                        let m = new this.protoPkg.Mission();
                        m.title = mission.title;
                        for (let waypoint of mission.waypoints){
                            m.add('waypoints', new this.protoPkg.Mission.Waypoint(
                                waypoint.title,
                                this.waypointType(waypoint.type),
                                waypoint.position.lat,
                                waypoint.position.lng
                            ));
                        }
                        missionsMsg.add('missions', m);
                    }
                    this.socket.emit('Missions', missionsMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'download_mission': {
                    let getMsg = new this.protoPkg.Get(this.protoPkg.Get.Type.MISSION);
                    this.socket.emit('Get', getMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'upload_mission': {
                    let missionMsg = new this.protoPkg.Mission();
                    missionMsg.title = data.title;
                    for (let waypoint of data.waypoints){
                        missionMsg.add('waypoints', new this.protoPkg.Mission.Waypoint(
                            waypoint.title,
                            this.waypointType(waypoint.type),
                            waypoint.position.lat,
                            waypoint.position.lng
                        ));
                    }
                    this.socket.emit('Mission', missionMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'arm': {
                    let cmdMsg = new this.protoPkg.Command(this.protoPkg.Command.Type.ARM);
                    this.socket.emit('Command', cmdMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'disarm': {
                    let cmdMsg = new this.protoPkg.Command(this.protoPkg.Command.Type.DISARM);
                    this.socket.emit('Command', cmdMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'start_mission': {
                    let cmdMsg = new this.protoPkg.Command(this.protoPkg.Command.Type.START);
                    this.socket.emit('Command', cmdMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'stop_mission': {
                    let cmdMsg = new this.protoPkg.Command(this.protoPkg.Command.Type.STOP);
                    this.socket.emit('Command', cmdMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'resume_mission': {
                    let cmdMsg = new this.protoPkg.Command(this.protoPkg.Command.Type.RESUME);
                    this.socket.emit('Command', cmdMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'kill': {
                    let cmdMsg = new this.protoPkg.Command(this.protoPkg.Command.Type.KILL);
                    this.socket.emit('Command', cmdMsg.toBuffer(), this.msgId);
                    break;
                }
                case 'unkill': {
                    let cmdMsg = new this.protoPkg.Command(this.protoPkg.Command.Type.UNKILL);
                    this.socket.emit('Command', cmdMsg.toBuffer(), this.msgId);
                    break;
                }
            }
            this.msgId++;
            if (this.msgId == this.MAX_MSG_ID){this.msgId = 0;} //this is probably unnecessary
        },
        // TODO: make the following methods unnecessary?
        modeString(mode){
            switch (mode){
                case this.protoPkg.Status.Mode.STOPPED: return 'idle';
                case this.protoPkg.Status.Mode.AUTO:    return 'auto';
                case this.protoPkg.Status.Mode.PAUSED:  return 'paused';
                case this.protoPkg.Status.Mode.KILLED:  return 'killed';
                default: throw new Error('Invalid mode type');
            }
        },
        paramTypeString(type){
            switch (type){
                case this.protoPkg.Parameters.Type.DOUBLE: return 'double';
                case this.protoPkg.Parameters.Type.VEC3:   return 'vec3';
                case this.protoPkg.Parameters.Type.MAT3:   return 'mat3';
                default: throw new Error('Invalid parameter type');
            }
        },
        paramType(str){
            switch (str){
                case 'double': return this.protoPkg.Parameters.Type.DOUBLE;
                case 'vec3':   return this.protoPkg.Parameters.Type.VEC3;
                case 'mat3':   return this.protoPkg.Parameters.Type.MAT3;
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
        'client::get_parameters'(initiator) {
            this.sendMsg('get_parameters', null, initiator);
        },

        'client::set_parameters'(params, initiator) {
            this.sendMsg('set_parameters', params, initiator);
        },

        'client::get_settings'(initiator) {
            this.sendMsg('get_settings', null, initiator);
        },

        'client::set_settings'(settings, initiator) {
            this.sendMsg('set_settings', settings, initiator);
        },

        'client::save_missions'(missions, initiator) {
            this.sendMsg('save_missions', missions, initiator);
        },

        'client::load_missions'(initiator) {
            this.sendMsg('load_missions', null, initiator);
        },

        'client::upload_mission'(mission, initiator) {
            this.sendMsg('upload_mission', mission, initiator);
        },

        'client::download_mission'(initiator) {
            this.sendMsg('download_mission', null, initiator);
        },

        'client::arm'(initiator) {
            this.sendMsg('arm', null, initiator);
        },

        'client::disarm'(initiator) {
            this.sendMsg('disarm', null, initiator);
        },

        'client::start_mission'(initiator) {
            this.sendMsg('start_mission', null, initiator);
        },

        'client::stop_mission'(initiator) {
            this.sendMsg('stop_mission', null, initiator);
        },

        'client::resume_mission'(initiator) {
            this.sendMsg('resume_mission', null, initiator);
        },

        'client::kill'(initiator) {
            this.sendMsg('kill', null, initiator);
        },

        'client::unkill'(initiator) {
            this.sendMsg('unkill', null, initiator);
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
