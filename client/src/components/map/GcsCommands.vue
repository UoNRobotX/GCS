<template>
    <div class="gcs-commands">
        <div class="row">
            <ui-button @click="uploadMission">Upload Mission</ui-button>
        </div>

        <div class="row">
            <ui-button @click="downloadMission">Download Mission</ui-button>
        </div>

        <div class="row">
            <ui-button
                v-if="wamv.mode == 'idle' || wamv.mode == 'paused'"
                @click="startMission"
            >Start</ui-button>
            <ui-button
                v-if="wamv.mode == 'paused'"
                @click="resumeMission"
            >Resume</ui-button>
            <ui-button
                v-if="wamv.mode == 'auto'"
                @click="stopMission"
            >Stop</ui-button>
        </div>

        <div class="row" v-if="wamv.loaded">
            <div class="column one-half"> {{ isArmed ? 'Armed' : 'Disarmed' }}</div>
            <div class="column one-half">
                <ui-switch :value.sync="isArmed"></ui-switch>
            </div>
        </div>

        <div class="row">
            <ui-button color="danger"
                v-if="wamv.mode != 'killed'" @click="kill"
            >Kill</ui-button>
            <ui-button
                v-if="wamv.mode == 'killed'" @click="unkill"
            >Unkill</ui-button>
        </div>
    </div>
</template>

<script>
import {
    getWamv, getMissions, getCurrentMissionIndex,
    getMessageStateWaiting, getMessageStateSuccess, getMessageStateFailure,
    getUploadMissionState, getUploadMissionData,
    getDownloadMissionState, getDownloadMissionData,
    getStartMissionState, getStartMissionData,
    getStopMissionState, getStopMissionData,
    getResumeMissionState, getResumeMissionData,
    getArmState, getArmData,
    getDisarmState, getDisarmData,
    getKillState, getKillData,
    getUnkillState, getUnkillData
} from 'store/getters';
import {
    setWamvArmed, setCurrentMission,
    sendUploadMission, failUploadMission,
    sendDownloadMission, failDownloadMission,
    sendStartMission, failStartMission,
    sendStopMission, failStopMission,
    sendResumeMission, failResumeMission,
    sendArm, failArm,
    sendDisarm, failDisarm,
    sendKill, failKill,
    sendUnkill, failUnkill
} from 'store/actions';

export default {
    vuex: {
        getters: {
            wamv:                 getWamv,
            missions:             getMissions,
            WAITING:              getMessageStateWaiting,
            SUCCESS:              getMessageStateSuccess,
            FAILURE:              getMessageStateFailure,
            currentMissionIndex:  getCurrentMissionIndex,
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
            disarmData:           getDisarmData,
            killState:            getKillState,
            killData:             getKillData,
            unkillState:          getUnkillState,
            unkillData:           getUnkillData,
        },

        actions: {
            setArmed: setWamvArmed,
            setCurrentMission,
            sendUploadMission,
            failUploadMission,
            sendDownloadMission,
            failDownloadMission,
            sendStartMission,
            failStartMission,
            sendStopMission,
            failStopMission,
            sendResumeMission,
            failResumeMission,
            sendArm,
            failArm,
            sendDisarm,
            failDisarm,
            sendKill,
            failKill,
            sendUnkill,
            failUnkill
        }
    },

    computed: {
        // TODO: ui-switch doesn't represent state when set() fails
        isArmed: {
            get() {
                return this.wamv.armed;
            },

            set(arm) {
                if (arm){
                    this.sendArm();
                    setTimeout(() => {
                        if (this.armState == this.WAITING){
                            this.failArm('Timeout reached.');
                        }
                    }, 1000);
                } else {
                    this.sendDisarm();
                    setTimeout(() => {
                        if (this.disarmState == this.WAITING){
                            this.failDisarm('Timeout reached.');
                        }
                    }, 1000);
                }
            }
        }
    },

    methods: {
        uploadMission() {
            let mission = this.missions[this.currentMissionIndex];
            this.sendUploadMission(mission);
            setTimeout(() => {
                if (this.uploadMissionState == this.WAITING){
                    this.failUploadMission('Timeout reached.');
                }
            }, 1000);
        },
        downloadMission() {
            this.sendDownloadMission();
            setTimeout(() => {
                if (this.downloadMissionState == this.WAITING){
                    this.failDownloadMission('Timeout reached.');
                }
            }, 1000);
        },
        startMission(){
            this.sendStartMission();
            setTimeout(() => {
                if (this.startMissionState == this.WAITING){
                    this.failStartMission('Timeout reached.');
                }
            }, 1000);
        },
        stopMission(){
            this.sendStopMission();
            setTimeout(() => {
                if (this.stopMissionState == this.WAITING){
                    this.failStopMission('Timeout reached.');
                }
            }, 1000);
        },
        resumeMission(){
            this.sendResumeMission();
            setTimeout(() => {
                if (this.resumeMissionState == this.WAITING){
                    this.failResumeMission('Timeout reached.');
                }
            }, 1000);
        },
        kill(){
            this.sendKill();
            setTimeout(() => {
                if (this.killState == this.WAITING){
                    this.failKill('Timeout reached.');
                }
            }, 1000);
        },
        unkill(){
            this.sendUnkill();
            setTimeout(() => {
                if (this.unkillState == this.WAITING){
                    this.failUnkill('Timeout reached.');
                }
            }, 1000);
        }
    },

    watch: {
        uploadMissionState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){ //successful response
                    console.log('Mission uploaded.');
                } else if (state == this.FAILURE){ //failure response
                    console.log('Unable to upload mission: ' + this.uploadMissionData);
                }
            }
        },
        downloadMissionState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Mission downloaded.');
                    this.setCurrentMission(this.downloadMissionData);
                } else if (state == this.FAILURE){
                    console.log('Unable to download mission: ' + this.downloadMissionData);
                }
            }
        },
        startMissionState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Mission started.');
                } else if (state == this.FAILURE){
                    console.log('Unable to start mission: ' + this.startMissionData);
                }
            }
        },
        stopMissionState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Mission stopped.');
                } else if (state == this.FAILURE){
                    console.log('Unable to stop mission: ' + this.stopMissionData);
                }
            }
        },
        resumeMissionState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Mission resumed.');
                } else if (state == this.FAILURE){
                    console.log('Unable to resume mission: ' + this.resumeMissionData);
                }
            }
        },
        armState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Vehicle armed.');
                } else if (state == this.FAILURE){
                    console.log('Unable to arm vehicle: ' + this.armData);
                }
            }
        },
        disarmState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Vehicle disarmed.');
                } else if (state == this.FAILURE){
                    console.log('Unable to disarm vehicle: ' + this.disarmData);
                }
            }
        },
        killState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Kill switch activated.');
                } else if (state == this.FAILURE){
                    console.log('Unable to activate kill switch: ' + this.killData);
                }
            }
        },
        unkillState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Kill switch deactivated.');
                } else if (state == this.FAILURE){
                    console.log('Unable to deactivate kill switch: ' + this.unkillData);
                }
            }
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-commands {
    min-width: 100px;

    .row {
        margin-bottom: 8px;

        &:last-child {
            margin-bottom: 0;
        }
    }
}
</style>
