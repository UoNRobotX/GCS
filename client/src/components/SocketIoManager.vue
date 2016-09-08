<template>
    <div></div>
</template>

<script>
import socket_io_client from 'socket.io-client';

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
            TIMEOUT: 1000
        };
    },

    ready() {
        //initialise socket
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
        this.socket.on('status', (data) => {
            //console.log('received "status" message');
            data.loaded = true;
            this.setWamv(data);
        });
        this.socket.on('get_parameters', (data, id) => {
            if (id in this.pending){
                let msg = this.pending[id];
                delete this.pending[id];
                clearTimeout(msg.timer);
                this.setParameters(data);
                console.log('Parameters loaded.');
                this.$dispatch('server.get_parameters:success', msg.initiator);
            }
        });
        this.socket.on('get_settings', (data, id) => {
            if (id in this.pending){
                let msg = this.pending[id];
                delete this.pending[id];
                clearTimeout(msg.timer);
                this.setSettings(data);
                console.log('Settings loaded.');
                this.$dispatch('server.get_settings:success', msg.initiator);
            }
        });
        this.socket.on('load_missions', (data, id) => {
            if (id in this.pending){
                let msg = this.pending[id];
                delete this.pending[id];
                clearTimeout(msg.timer);
                this.setMissions(data);
                console.log('Missions loaded.');
                this.$dispatch('server.load_missions:success', msg.initiator);
            }
        });
        this.socket.on('download_mission', (data, id) => {
            if (id in this.pending){
                let msg = this.pending[id];
                delete this.pending[id];
                clearTimeout(msg.timer);
                this.missions.push(data);
                console.log('Mission downloaded.');
                this.$dispatch('server.download_mission:success', msg.initiator);
            }
        });
        this.socket.on('success', (data, id) => {
            console.log('received "success" message');
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
        this.socket.on('failure', (errorMsg, id) => {
            console.log('received "failure" message');
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
        this.socket.on('attention', (msg) => {
            //console.log('Attention: ' + msg);
            this.$dispatch('app::create-snackbar', msg);
        });
    },

    methods: {
        sendMsg(msgType, data, initiator){
            this.pending[this.msgId] = {
                type: msgType,
                initiator: initiator,
                timer: setTimeout(() => {
                    delete this.pending[this.msgId];
                    console.log('Timeout reached for a "' + msgType + '" message');
                    this.$dispatch('server.' + msgType + ':failure', 'Timeout reached.', initiator);
                }, this.TIMEOUT)
            };
            this.socket.emit(msgType, data, this.msgId);
            this.msgId++;
            if (this.msgId == this.MAX_MSG_ID){this.msgId = 0;} //this is probably unnecessary
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
