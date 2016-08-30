<template>
    <div></div>
</template>

<script>
import socket_io_client from 'socket.io-client';

import {
    setWamv, setParameters,
    sendGetParameters, succeedGetParameters, failGetParameters,
    succeedSaveMissions, failSaveMissions,
    succeedLoadMissions, failLoadMissions,
    succeedUploadMission, failUploadMission,
    succeedDownloadMission, failDownloadMission,
    succeedStartMission, failStartMission,
    succeedStopMission, failStopMission,
    succeedResumeMission, failResumeMission,
    succeedArm, failArm,
    succeedDisarm, failDisarm
} from 'store/actions';
import {
    getMessageStateWaiting, getMessageStateSuccess, getMessageStateFailure,
    getGetParameterState, getGetParameterData,
    getSaveMissionsState, getSaveMissionsData,
    getLoadMissionsState, getLoadMissionsData,
    getUploadMissionState, getUploadMissionData,
    getDownloadMissionState, getDownloadMissionData,
    getStartMissionState, getStartMissionData,
    getStopMissionState, getStopMissionData,
    getResumeMissionState, getResumeMissionData,
    getArmState, getArmData,
    getDisarmState, getDisarmData
} from 'store/getters';

export default {
    vuex: {
        getters: {
            WAITING:              getMessageStateWaiting,
            SUCCESS:              getMessageStateSuccess,
            FAILURE:              getMessageStateFailure,
            getParameterState:    getGetParameterState,
            getParameterData:     getGetParameterData,
            saveMissionsState:    getSaveMissionsState,
            saveMissionsData:     getSaveMissionsData,
            loadMissionsState:    getLoadMissionsState,
            loadMissionsData:     getLoadMissionsData,
            uploadMissionState:   getUploadMissionState,
            uploadMissionData:    getUploadMissionData,
            downloadMissionState: getDownloadMissionState,
            downloadMissionData:  getDownloadMissionData,
            startMissionState:    getStartMissionState,
            startMissionData:     getStartMissionData,
            stopMissionState:     getStopMissionState,
            stopMissionData:      getStopMissionData,
            resumeMissionState:   getResumeMissionState,
            resumeMissionData:    getResumeMissionData,
            armState:             getArmState,
            armData:              getArmData,
            disarmState:          getDisarmState,
            disarmData:           getDisarmData
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
            failLoadMissions,
            succeedUploadMission,
            failUploadMission,
            succeedDownloadMission,
            failDownloadMission,
            succeedStartMission,
            failStartMission,
            succeedStopMission,
            failStopMission,
            succeedResumeMission,
            failResumeMission,
            succeedArm,
            failArm,
            succeedDisarm,
            failDisarm
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
            if (this.downloadMissionState == this.WAITING){
                this.succeedDownloadMission(data);
            }
        });
        this.socket.on('success', (data) => {
            console.log('received "success" message');
            if (data == 'save_missions' && this.saveMissionsState == this.WAITING){
                this.succeedSaveMissions();
            } else if (data == 'upload_mission' && this.uploadMissionState == this.WAITING){
                this.succeedUploadMission();
            } else if (data == 'start_mission' && this.startMissionState == this.WAITING){
                this.succeedStartMission();
            } else if (data == 'stop_mission' && this.stopMissionState == this.WAITING){
                this.succeedStopMission();
            } else if (data == 'resume_mission' && this.resumeMissionState == this.WAITING){
                this.succeedResumeMission();
            } else if (data == 'arm' && this.armState == this.WAITING){
                this.succeedArm();
            } else if (data == 'disarm' && this.disarmState == this.WAITING){
                this.succeedDisarm();
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
                case 'upload_mission': {
                    this.failUploadMission(data[1]);
                    break;
                }
                case 'download_mission': {
                    this.failDownloadMission(data[1]);
                    break;
                }
                case 'start_mission': {
                    this.failStartMission(data[1]);
                    break;
                }
                case 'stop_mission': {
                    this.failStopMission(data[1]);
                    break;
                }
                case 'resume_mission': {
                    this.failResumeMission(data[1]);
                    break;
                }
                case 'arm': {
                    this.failArm(data[1]);
                    break;
                }
                case 'disarm': {
                    this.failDisarm(data[1]);
                    break;
                }
            }
        });
        this.socket.on('attention', (data) => {
            console.log('Attention: ' + data);
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
        },

        uploadMissionState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('upload_mission', this.uploadMissionData);
                }
            }
        },

        downloadMissionState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('download_mission');
                }
            }
        },

        startMissionState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('start_mission');
                }
            }
        },

        stopMissionState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('stop_mission');
                }
            }
        },

        resumeMissionState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('resume_mission');
                }
            }
        },

        armState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('arm');
                }
            }
        },

        disarmState(state, oldState){
            if (state != oldState){
                if (state == this.WAITING){
                    this.socket.emit('disarm');
                }
            }
        }
    }
}
</script>

<style lang="stylus">
@import '~styles/main';
</style>
