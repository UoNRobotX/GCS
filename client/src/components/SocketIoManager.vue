<template>
    <div></div>
</template>

<script>
import socket_io_client from 'socket.io-client';

import { getMissions } from 'store/getters';
import { setWamv, setParameters, setMissions } from 'store/actions';

export default {
    vuex: {
        getters: {
            missions: getMissions
        },
        actions: {
            setWamv,
            setParameters,
            setMissions
        }
    },

    data() {
        return {
            socket: null,
            waitTimers: {
                //each property contains a timer for an in-progress request
                get_parameters:   null,
                set_parameters:   null,
                save_missions:    null,
                load_missions:    null,
                upload_mission:   null,
                download_mission: null,
                arm:              null,
                disarm:           null,
                start_mission:    null,
                stop_mission:     null,
                resume_mission:   null,
                kill:             null,
                unkill:           null
            },
            initiators: {
                //each property contains a string optionally specified by whoever initiated a request
                get_parameters:   null,
                set_parameters:   null,
                save_missions:    null,
                load_missions:    null,
                upload_mission:   null,
                download_mission: null,
                arm:              null,
                disarm:           null,
                start_mission:    null,
                stop_mission:     null,
                resume_mission:   null,
                kill:             null,
                unkill:           null
            },
            TIMEOUT: 1000
        };
    },

    ready() {
        //initialise socket
        this.socket = socket_io_client('localhost:3000');
        this.socket.on('connect', () => {
            console.log('connected to server');
            //get parameters once at startup
            this.sendGetParameters('init');
            this.$once('server.get_parameters:failure', function(initiator){
                if (initiator === 'init'){
                    this.$dispatch('app::create-snackbar', 'Failed to load parameters');
                }
                return true;
            });
            //load missions once at startup
            this.sendLoadMissions('init');
            this.$once('server.get_parameters:timeout', function(initiator){
                if (initiator === 'init'){
                    this.$dispatch('app::create-snackbar', 'Failed to load parameters due to timeout');
                }
                return true;
            });
        });
        this.socket.on('disconnect', () => {
            console.log('disconnected from server');
        });
        this.socket.on('status', (data) => {
            //console.log('received "status" message');
            data.loaded = true;
            this.setWamv(data);
        });
        this.socket.on('get_parameters', (data) => {
            clearTimeout(this.waitTimers.get_parameters);
            if (this.waitTimers.get_parameters != null){
                this.waitTimers.get_parameters = null;
                this.setParameters(data);
                console.log('Parameters loaded.');
                this.$dispatch('server.get_parameters:success', this.initiators.get_parameters);
            }
        });
        this.socket.on('load_missions', (data) => {
            clearTimeout(this.waitTimers.load_missions);
            if (this.waitTimers.load_missions != null){
                this.waitTimers.load_missions = null;
                this.setMissions(data);
                console.log('Missions loaded.');
                this.$dispatch('server.load_missions:success', this.initiators.load_missions);
            }
        });
        this.socket.on('download_mission', (data) => {
            clearTimeout(this.waitTimers.download_mission);
            if (this.waitTimers.download_mission != null){
                this.waitTimers.download_mission = null;
                this.missions.push(data);
                console.log('Mission downloaded.');
                this.$dispatch('server.download_mission:success', this.initiators.download_mission);
            }
        });
        this.socket.on('success', (msgType) => {
            console.log('received "success" message');
            clearTimeout(this.waitTimers[msgType]);
            if (this.waitTimers[msgType] != null){
                this.waitTimers[msgType] = null;
                switch (msgType){
                    case 'set_parameters': {console.log('Parameters set.');          break;}
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
                this.$dispatch('server.' + msgType + ':success', this.initiators[msgType]);
            }
        });
        this.socket.on('failure', (data) => {
            console.log('received "failure" message');
            var msgType = data[0], errorMsg = data[1];
            clearTimeout(this.waitTimers[msgType]);
            if (this.waitTimers[msgType] != null){
                this.waitTimers[msgType] = null;
                switch (msgType){
                    case 'get_parameters':   {console.log('Unable to load parameters: '        + errorMsg); break;}
                    case 'set_parameters':   {console.log('Unable to set parameters: '         + errorMsg); break;}
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
                this.$dispatch('server.' + msgType + ':failure', this.initiators[msgType]);
            }
        });
        this.socket.on('attention', (data) => {
            console.log('Attention: ' + data);
        });
    },

    methods: {
        sendGetParameters(initiator){
            if (this.waitTimers.get_parameters == null){
                this.initiators.get_parameters = initiator;
                this.socket.emit('get_parameters');
                this.waitTimers.get_parameters = setTimeout(() => {
                    this.waitTimers.get_parameters = null;
                    console.log('Unable to get parameters: timeout reached.');
                    this.$dispatch('server.get_parameters:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendSetParameters(parameterSettings, initiator){
            if (this.waitTimers.set_parameters == null){
                this.initiators.set_parameters = initiator;
                this.socket.emit('set_parameters', parameterSettings);
                this.waitTimers.set_parameters = setTimeout(() => {
                    this.waitTimers.set_parameters = null;
                    console.log('Unable to set parameters: timeout reached.');
                    this.$dispatch('server.set_parameters:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendSaveMissions(missions, initiator){
            if (this.waitTimers.save_missions == null){
                this.initiators.save_missions = initiator;
                this.socket.emit('save_missions', missions);
                this.waitTimers.save_missions = setTimeout(() => {
                    this.waitTimers.save_missions = null;
                    console.log('Unable to save missions: timeout reached.');
                    this.$dispatch('server.save_missions:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendLoadMissions(initiator){
            if (this.waitTimers.load_missions == null){
                this.initiators.load_missions = initiator;
                this.socket.emit('load_missions');
                this.waitTimers.load_missions = setTimeout(() => {
                    this.waitTimers.load_missions = null;
                    console.log('Unable to load missions: timeout reached.');
                    this.$dispatch('server.load_missions:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendUploadMission(mission, initiator){
            if (this.waitTimers.upload_mission == null){
                this.initiators.upload_mission = initiator;
                this.socket.emit('upload_mission', mission);
                this.waitTimers.upload_mission = setTimeout(() => {
                    this.waitTimers.upload_mission = null;
                    console.log('Unable to upload mission: timeout reached.');
                    this.$dispatch('server.upload_mission:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendDownloadMission(initiator){
            if (this.waitTimers.download_mission == null){
                this.initiators.download_mission = initiator;
                this.socket.emit('download_mission');
                this.waitTimers.download_mission = setTimeout(() => {
                    this.waitTimers.download_mission = null;
                    console.log('Unable to download mission: timeout reached.');
                    this.$dispatch('server.download_mission:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendArm(initiator){
            if (this.waitTimers.arm == null){
                this.initiators.arm = initiator;
                this.socket.emit('arm');
                this.waitTimers.arm = setTimeout(() => {
                    this.waitTimers.arm = null;
                    console.log('Unable to arm vehicle: timeout reached.');
                    this.$dispatch('server.arm:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendDisarm(initiator){
            if (this.waitTimers.disarm == null){
                this.initiators.disarm = initiator;
                this.socket.emit('disarm');
                this.waitTimers.disarm = setTimeout(() => {
                    this.waitTimers.disarm = null;
                    console.log('Unable to disarm vehicle: timeout reached.');
                    this.$dispatch('server.disarm:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendStartMission(initiator){
            if (this.waitTimers.start_mission == null){
                this.initiators.start_mission = initiator;
                this.socket.emit('start_mission');
                this.waitTimers.start_mission = setTimeout(() => {
                    this.waitTimers.start_mission = null;
                    console.log('Unable to start mission: timeout reached.');
                    this.$dispatch('server.start_mission:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendStopMission(initiator){
            if (this.waitTimers.stop_mission == null){
                this.initiators.stop_mission = initiator;
                this.socket.emit('stop_mission');
                this.waitTimers.stop_mission = setTimeout(() => {
                    this.waitTimers.stop_mission = null;
                    console.log('Unable to stop mission: timeout reached.');
                    this.$dispatch('server.stop_mission:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendResumeMission(initiator){
            if (this.waitTimers.resume_mission == null){
                this.initiators.resume_mission = initiator;
                this.socket.emit('resume_mission');
                this.waitTimers.resume_mission = setTimeout(() => {
                    this.waitTimers.resume_mission = null;
                    console.log('Unable to resume mission: timeout reached.');
                    this.$dispatch('server.resume_mission:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendKill(initiator){
            if (this.waitTimers.kill == null){
                this.initiators.kill = initiator;
                this.socket.emit('kill');
                this.waitTimers.kill = setTimeout(() => {
                    this.waitTimers.kill = null;
                    console.log('Unable to activate kill switch: timeout reached.');
                    this.$dispatch('server.kill:timeout', initiator);
                }, this.TIMEOUT);
            }
        },

        sendUnkill(initiator){
            if (this.waitTimers.unkill == null){
                this.initiators.unkill = initiator;
                this.socket.emit('unkill');
                this.waitTimers.unkill = setTimeout(() => {
                    this.waitTimers.unkill = null;
                    console.log('Unable to deactivate kill switch: timeout reached.');
                    this.$dispatch('server.unkill:timeout', initiator);
                }, this.TIMEOUT);
            }
        }
    },

    events: {
        'client::get_parameters'(initiator) {
            this.sendGetParameters(initiator);
        },

        'client::set_parameters'(parameterSettings, initiator) {
            this.sendSetParameters(parameterSettings, initiator);
        },

        'client::save_missions'(missions, initiator) {
            this.sendSaveMissions(missions, initiator);
        },

        'client::load_missions'(initiator) {
            this.sendLoadMissions(initiator);
        },

        'client::upload_mission'(mission, initiator) {
            this.sendUploadMission(mission, initiator);
        },

        'client::download_mission'(initiator) {
            this.sendDownloadMission(initiator);
        },

        'client::arm'(initiator) {
            this.sendArm(initiator);
        },

        'client::disarm'(initiator) {
            this.sendDisarm(initiator);
        },

        'client::start_mission'(initiator) {
            this.sendStartMission(initiator);
        },

        'client::stop_mission'(initiator) {
            this.sendStopMission(initiator);
        },

        'client::resume_mission'(initiator) {
            this.sendResumeMission(initiator);
        },

        'client::kill'(initiator) {
            this.sendKill(initiator);
        },

        'client::unkill'(initiator) {
            this.sendUnkill(initiator);
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
