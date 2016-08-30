<template>
    <div></div>
</template>

<script>
import socket_io_client from 'socket.io-client';

import {
    setWamv, setParameters,
    sendGetParameters, succeedGetParameters, failGetParameters,
    succeedSaveMissions, failSaveMissions,
    succeedLoadMissions, failLoadMissions
} from 'store/actions';
import {
    getMessageStateWaiting, getMessageStateSuccess, getMessageStateFailure,
    getGetParameterState, getGetParameterData,
    getSaveMissionsState, getSaveMissionsData,
    getLoadMissionsState, getLoadMissionsData
} from 'store/getters';

export default {
    vuex: {
        getters: {
            WAITING:           getMessageStateWaiting,
            SUCCESS:           getMessageStateSuccess,
            FAILURE:           getMessageStateFailure,
            getParameterState: getGetParameterState,
            getParameterData:  getGetParameterData,
            saveMissionsState: getSaveMissionsState,
            saveMissionsData:  getSaveMissionsData,
            loadMissionsState:   getLoadMissionsState,
            loadMissionsData:    getLoadMissionsData
        },
        actions: {
            setWamv,
            setParameters,
            sendGetParameters,
            succeedGetParameters,
            failGetParameters,
            succeedSaveMissions,
            failSaveMissions,
            succeedLoadMissions,
            failLoadMissions
        }
    },

    data() {
        return {
            socket: null //used for socket.io connection
        };
    },

    ready() {
        //initialise socket
        this.socket = socket_io_client('localhost:3000');
        this.socket.on('connect', () => {
            console.log('connected to server')
            //get parameters once at startup
            this.sendGetParameters();
            setTimeout(() => {
                if (this.getParameterState == this.WAITING){
                    this.failGetParameters('Timeout reached.');
                }
            }, 1000);
        });
        this.socket.on('disconnect', () => {
            console.log('disconnected from server');
        });
        this.socket.on('status', (data) => {
            console.log('received "status" message');
            data.loaded = true;
            this.setWamv(data);
        });
        this.socket.on('get_parameters', (data) => {
            console.log('received "get_parameters" message');
            if (this.getParameterState == this.WAITING){
                this.succeedGetParameters(data);
            }
        });
        this.socket.on('load_missions', (data) => {
            console.log('received "load_missions" message');
            if (this.loadMissionsState == this.WAITING){
                this.succeedLoadMissions(data);
            }
        });
        this.socket.on('download_mission', (data) => {
            console.log('received "download_mission" message:');
            console.log(data);
        });
        this.socket.on('success', (data) => {
            console.log('received "success" message');
            if (data == 'save_missions' && this.saveMissionsState == this.WAITING){
                this.succeedSaveMissions();
            }
        });
        this.socket.on('failure', (data) => {
            console.log('received "failure" message');
            switch (data[0]){
                case 'get_parameters': {
                    this.failGetParameters(data[1]);
                    break;
                }
                case 'save_missions': {
                    this.failSaveMissions(data[1]);
                    break;
                }
                case 'load_missions': {
                    this.failLoadMissions(data[1]);
                    break;
                }
            }
            console.log(data);
        });
        this.socket.on('attention', (data) => {
            console.log('received "attention" message');
            console.log(data);
        });
    },

    watch: {
        getParameterState(state, oldState){
            if (state != oldState){
                //handle get_parameter messages
                if (state == this.WAITING){ //send message
                    this.socket.emit('get_parameters');
                } else if (state == this.SUCCESS){ //successful response
                    this.setParameters(this.getParameterData);
                } else if (state == this.FAILURE){ //failure response
                    console.log('Unable to get parameters: ' + this.getParameterData);
                }
            }
        },

        saveMissionsState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('save_missions', this.saveMissionsData);
                }
            }
        },

        loadMissionsState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('load_missions');
                }
            }
        }
    }
}
</script>

<style lang="stylus">
@import '~styles/main';
</style>
