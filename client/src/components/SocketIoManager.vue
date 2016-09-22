<template>
    <div></div>
</template>

<script>
//this component manages communication with the server via a socket
//it allows for other components to initiate a request to the server, and react to responses
//these are the requests that can be initiated:
    //status, get_parameters, set_parameters, get_settings, set_settings,
    //set_missions, get_missions, set_mission, get_mission,
    //arm, disarm, start_mission, stop_mission, resume_mission, kill, unkill,
//a component initiates a request r1 by dispatching an event client::r1
    //the event goes up to App.vue, then down to this component
    //this components sends a corresponding message to the server
    //when a response is received, or none is received after a certain timeout:
        //this component dispatches a server.r1:success or server.r1:failure event
        //the event goes up to App.vue, then broadcasted to components
            //a component can use this to react to a response

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
            pending: null, //describes a sent message      //{type, initiator, timer}
            queued: [],    //describes messages to be sent //[{type, initiator, timer}, ...]
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
                this.sendMsg('get_missions', null, 'init');
                this.$once('server.get_missions:failure', function(initiator){
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
                let msg;
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
            this.socket.on('GetParametersResponse', (data) => {
                //check if expected
                if (this.pending === null || this.pending.type !== 'get_parameters'){
                    console.log('Unexpected GetParametersResponse message');
                    return;
                }
                //decode message
                let paramsMsg;
                try {
                    paramsMsg = this.protoPkg.GetParametersResponse.decode(data);
                } catch (e){
                    console.log('Unable to decode GetParametersResponse message');
                    return;
                }
                //check timestamp
                if (Date.now() - paramsMsg.timestamp >= this.TIMEOUT){
                    return;
                }
                //clear timeout
                clearTimeout(this.pending.timer);
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
                //set parameters
                this.setParameters(newParams);
                console.log('Parameters loaded.');
                this.$dispatch('server.get_parameters:success', this.pending.initiator);
                //remove pending message info, and send a queued message if any
                this.pending = null;
                this.sendMsg(null);
            });
            this.socket.on('GetSettingsResponse', (data) => {
                //check if expected
                if (this.pending === null || this.pending.type !== 'get_settings'){
                    console.log('Unexpected GetSettingsResponse message');
                    return;
                }
                //decode message
                let settingsMsg;
                try {
                    settingsMsg = this.protoPkg.GetSettingsResponse.decode(data);
                } catch (e){
                    console.log('Unable to decode GetSettingsResponse message');
                    return;
                }
                //check timestamp
                if (Date.now() - settingsMsg.timestamp >= this.TIMEOUT){
                    return;
                }
                //clear timeout
                clearTimeout(this.pending.timer);
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
                //set settings
                this.setSettings(newSettings);
                console.log('Settings loaded.');
                this.$dispatch('server.get_settings:success', this.pending.initiator);
                //remove pending message info, and send a queued message if any
                this.pending = null;
                this.sendMsg(null);
            });
            this.socket.on('GetMissionsResponse', (data) => {
                //check if expected
                if (this.pending === null || this.pending.type !== 'get_missions'){
                    console.log('Unexpected GetMissionsResponse message');
                    return;
                }
                //decode message
                let missionsMsg;
                try {
                    missionsMsg = this.protoPkg.GetMissionsResponse.decode(data);
                } catch (e){
                    console.log('Unable to decode GetMissionsResponse message');
                    return;
                }
                //check timestamp
                if (Date.now() - missionsMsg.timestamp >= this.TIMEOUT){
                    return;
                }
                //clear timeout
                clearTimeout(this.pending.timer);
                //convert received missions into a certain structure
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
                //set missions
                this.setMissions(newMissions);
                console.log('Missions loaded.');
                this.$dispatch('server.get_missions:success', this.pending.initiator);
                //remove pending message info, and send a queued message if any
                this.pending = null;
                this.sendMsg(null);
            });
            this.socket.on('GetMissionResponse', (data) => {
                //check if expected
                if (this.pending === null || this.pending.type !== 'get_mission'){
                    console.log('Unexpected GetMissionResponse message');
                    return;
                }
                //decode message
                let missionMsg;
                try {
                    missionMsg = this.protoPkg.GetMissionResponse.decode(data).mission;
                } catch (e){
                    console.log('Unable to decode GetMissionResponse message');
                    return;
                }
                //check timestamp
                if (Date.now() - missionMsg.timestamp >= this.TIMEOUT){
                    return;
                }
                //clear timeout
                clearTimeout(this.pending.timer);
                //convert received mission into a certain structure, and append it to the list
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
                        }
                    })
                });
                console.log('Mission downloaded.');
                this.$dispatch('server.get_mission:success', this.pending.initiator);
                //remove pending message info, and send a queued message if any
                this.pending = null;
                this.sendMsg(null);
            });
            this.socket.on('Success', (data) => {
                //check if expected
                if (this.pending === null){
                    console.log('Unexpected Success message');
                    return;
                }
                //decode message
                let successMsg;
                try {
                    successMsg = this.protoPkg.Success.decode(data);
                } catch (e){
                    console.log('Unable to decode Success message');
                    return;
                }
                //check timestamp
                if (Date.now() - successMsg.timestamp >= this.TIMEOUT){
                    return;
                }
                //clear timeout
                clearTimeout(this.pending.timer);
                //indicate success
                switch (this.pending.type){
                    case 'set_parameters': {console.log('Parameters set.');             break;}
                    case 'set_settings':   {console.log('Settings set.');               break;}
                    case 'set_missions':   {console.log('Missions saved.');             break;}
                    case 'set_mission':    {console.log('Mission uploaded.');           break;}
                    case 'arm':            {console.log('Vehicle armed.');              break;}
                    case 'disarm':         {console.log('Vehicle disarmed.');           break;}
                    case 'start_mission':  {console.log('Mission started.');            break;}
                    case 'stop_mission':   {console.log('Mission stopped.');            break;}
                    case 'resume_mission': {console.log('Mission resumed.');            break;}
                    case 'kill':           {console.log('Kill switch activated.');      break;}
                    case 'unkill':         {console.log('Kill switch deactivated.');    break;}
                    default:               {console.log('Unexpected Success Message');  return;}
                }
                this.$dispatch('server.' + this.pending.type + ':success', this.pending.initiator);
                //remove pending message info, and send a queued message if any
                this.pending = null;
                this.sendMsg(null);
            });
            this.socket.on('Failure', (data) => {
                //check if expected
                if (this.pending === null){
                    console.log('Unexpected Failure message');
                    return;
                }
                //decode message
                let failureMsg;
                try {
                    failureMsg = this.protoPkg.Failure.decode(data);
                } catch (e){
                    console.log('Unable to decode Failure message');
                    return;
                }
                //check timestamp
                if (Date.now() - failureMsg.timestamp >= this.TIMEOUT){
                    return;
                }
                //clear timeout
                clearTimeout(this.pending.timer);
                //indicate failure
                let errorMsg = 'Unable to ';
                switch (this.pending.type){
                    case 'get_parameters':   {errorMsg += 'load parameters: ';            break;}
                    case 'set_parameters':   {errorMsg += 'set parameters: ';             break;}
                    case 'get_settings':     {errorMsg += 'load settings: ';              break;}
                    case 'set_settings':     {errorMsg += 'set settings: ';               break;}
                    case 'set_missions':     {errorMsg += 'save missions: ';              break;}
                    case 'get_missions':     {errorMsg += 'load missions: ';              break;}
                    case 'set_mission':      {errorMsg += 'upload mission: ';             break;}
                    case 'get_mission':      {errorMsg += 'download mission: ';           break;}
                    case 'arm':              {errorMsg += 'arm vehicle: ';                break;}
                    case 'disarm':           {errorMsg += 'disarm vehicle: ';             break;}
                    case 'start_mission':    {errorMsg += 'start mission: ';              break;}
                    case 'stop_mission':     {errorMsg += 'stop mission: ';               break;}
                    case 'resume_mission':   {errorMsg += 'resume mission: ';             break;}
                    case 'kill':             {errorMsg += 'activate kill switch: ';       break;}
                    case 'unkill':           {errorMsg += 'deactivate kill switch: ';     break;}
                    default:                 {console.log('Unexpected Failure Message'); return;}
                }
                errorMsg += failureMsg.msg;
                console.log(errorMsg);
                this.$dispatch('server.' + this.pending.type + ':failure', failureMsg.msg, this.pending.initiator);
                //remove pending message info, and send a queued message if any
                this.pending = null;
                this.sendMsg(null);
            });
            this.socket.on('Attention', (data) => {
                //decode message
                let attentionMsg;
                try {
                    attentionMsg = this.protoPkg.Attention.decode(data);
                } catch (e){
                    console.log('Unable to decode Attention message');
                    return;
                }
                //display message
                //console.log('Attention: ' + msg);
                this.$dispatch('app::create-snackbar', attentionMsg.msg);
            });
        },
        sendMsg(msgType, data, initiator){
            //queue message
            if (msgType !== null){
                this.queued.push({
                    type:      msgType,
                    initiator: initiator,
                    timer:     null
                });
            }
            //if not waiting for a response, and a message is queued, send it
            if (this.pending === null && this.queued.length > 0){
                this.pending = this.queued.shift();
                //start timeout timer
                this.pending.timer = setTimeout(() => {
                    console.log('Timeout reached for a "' + this.pending.type + '" request');
                    this.$dispatch('server.' + this.pending.type + ':failure', 'Timeout reached.', initiator);
                    this.pending = null;
                    this.sendMsg(null);
                }, this.TIMEOUT);
                //send message
                let timestamp = Date.now();
                switch (this.pending.type){
                    case 'get_parameters': {
                        this.socket.emit(
                            'GetParameters',
                            (new this.protoPkg.GetParameters(timestamp)).toBuffer()
                        );
                        break;
                    }
                    case 'set_parameters': {
                        //'data' should have this form:
                            //[{section: s1, subsection: s2, title: t1, value: v1}, ...]
                        let paramsMsg = new this.protoPkg.SetParameters();
                        paramsMsg.timestamp = timestamp;
                        for (let param of data){
                            paramsMsg.add('parameters', new this.protoPkg.Parameter(
                                param.section,
                                param.subsection,
                                param.title,
                                this.paramType(param.type),
                                param.value
                            ));
                        }
                        this.socket.emit('SetParameters', paramsMsg.toBuffer());
                        break;
                    }
                    case 'get_settings': {
                        this.socket.emit(
                            'GetSettings',
                            (new this.protoPkg.GetSettings(timestamp)).toBuffer()
                        );
                        break;
                    }
                    case 'set_settings': {
                        //'data' should have this form:
                            //[{section: s1, title: t1, value: v1}, ...]
                        let settingsMsg = new this.protoPkg.SetSettings();
                        settingsMsg.timestamp = timestamp;
                        for (let setting of data){
                            settingsMsg.add('settings', new this.protoPkg.Setting(
                                setting.section, setting.title, setting.value
                            ));
                        }
                        this.socket.emit('SetSettings', settingsMsg.toBuffer());
                        break;
                    }
                    case 'get_mission': {
                        this.socket.emit(
                            'GetMission',
                            (new this.protoPkg.GetMission(timestamp)).toBuffer()
                        );
                        break;
                    }
                    case 'set_mission': {
                        //see elements of 'missions' in store.js for expected 'data' format
                        let setMissionMsg = new this.protoPkg.SetMission(
                            timestamp,
                            new this.protoPkg.Mission()
                        );
                        setMissionMsg.mission.title = data.title;
                        setMissionMsg.mission.originLatitude = data.origin.lat;
                        setMissionMsg.mission.originLongitude = data.origin.lng;
                        for (let waypoint of data.waypoints){
                            setMissionMsg.mission.add('waypoints', new this.protoPkg.Mission.Waypoint(
                                waypoint.title,
                                this.waypointType(waypoint.type),
                                waypoint.position.lat,
                                waypoint.position.lng
                            ));
                        }
                        this.socket.emit('SetMission', setMissionMsg.toBuffer());
                        break;
                    }
                    case 'get_missions': {
                        this.socket.emit(
                            'GetMissions',
                            (new this.protoPkg.GetMissions(timestamp)).toBuffer()
                        );
                        break;
                    }
                    case 'set_missions': {
                        //see 'missions' in store.js for expected 'data' format
                        let setMissionsMsg = new this.protoPkg.SetMissions();
                        setMissionsMsg.timestamp = timestamp;
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
                            setMissionsMsg.add('missions', m);
                        }
                        this.socket.emit('SetMissions', setMissionsMsg.toBuffer());
                        break;
                    }
                    case 'arm': {
                        let cmdMsg = new this.protoPkg.Command(
                            timestamp,
                            this.protoPkg.Command.Type.ARM
                        );
                        this.socket.emit('Command', cmdMsg.toBuffer());
                        break;
                    }
                    case 'disarm': {
                        let cmdMsg = new this.protoPkg.Command(
                            timestamp,
                            this.protoPkg.Command.Type.DISARM
                        );
                        this.socket.emit('Command', cmdMsg.toBuffer());
                        break;
                    }
                    case 'start_mission': {
                        let cmdMsg = new this.protoPkg.Command(
                            timestamp,
                            this.protoPkg.Command.Type.START
                        );
                        this.socket.emit('Command', cmdMsg.toBuffer());
                        break;
                    }
                    case 'stop_mission': {
                        let cmdMsg = new this.protoPkg.Command(
                            timestamp,
                            this.protoPkg.Command.Type.STOP
                        );
                        this.socket.emit('Command', cmdMsg.toBuffer());
                        break;
                    }
                    case 'resume_mission': {
                        let cmdMsg = new this.protoPkg.Command(
                            timestamp,
                            this.protoPkg.Command.Type.RESUME
                        );
                        this.socket.emit('Command', cmdMsg.toBuffer());
                        break;
                    }
                    case 'kill': {
                        let cmdMsg = new this.protoPkg.Command(
                            timestamp,
                            this.protoPkg.Command.Type.KILL
                        );
                        this.socket.emit('Command', cmdMsg.toBuffer());
                        break;
                    }
                    case 'unkill': {
                        let cmdMsg = new this.protoPkg.Command(
                            timestamp,
                            this.protoPkg.Command.Type.UNKILL
                        );
                        this.socket.emit('Command', cmdMsg.toBuffer());
                        break;
                    }
                }
            }
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

        'client::set_missions'(missions, initiator) {
            this.sendMsg('set_missions', missions, initiator);
        },

        'client::get_missions'(initiator) {
            this.sendMsg('get_missions', null, initiator);
        },

        'client::set_mission'(mission, initiator) {
            this.sendMsg('set_mission', mission, initiator);
        },

        'client::get_mission'(initiator) {
            this.sendMsg('get_mission', null, initiator);
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
