<template>
    <div class="gcs-commands">
        <ui-button
            @click="toggleMission" :text="startButtonText" :disabled="wamv.mode === 'killed'"
        ></ui-button>

        <ui-button v-if="wamv.mode == 'auto'" @click="stopMission">Stop</ui-button>

        <ui-button
            color="danger" :text="wamv.mode === 'killed' ? 'Revive' : 'Kill'" @click="toggleKill"
        ></ui-button>

        <div class="armed-toggle" v-if="wamv.loaded">
            <ui-switch
                :value.sync="isArmed" :label="isArmed ? 'Armed' : 'Disarmed'" label-left
            ></ui-switch>
        </div>
    </div>
</template>

<script>
import {
    getWamv, getMissions, getCurrentMissionIndex,
    getMessageStateWaiting, getMessageStateSuccess, getMessageStateFailure,
    getStartMissionState, getStartMissionData,
    getStopMissionState, getStopMissionData,
    getResumeMissionState, getResumeMissionData,
    getArmState, getArmData,
    getDisarmState, getDisarmData,
    getKillState, getKillData,
    getUnkillState, getUnkillData
} from 'store/getters';
import {
    setWamvArmed,
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
            currentMissionIndex:  getCurrentMissionIndex,
            WAITING:              getMessageStateWaiting,
            SUCCESS:              getMessageStateSuccess,
            FAILURE:              getMessageStateFailure,
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
            unkillData:           getUnkillData
        },

        actions: {
            setArmed: setWamvArmed,
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
        startButtonText() {
            switch (this.wamv.mode) {
                case 'idle':
                case 'killed':
                    return 'Start';
                case 'paused':
                    return 'Resume';
                case 'auto':
                    return 'Pause';
                default:
                    return '';
            }
        },

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
        toggleMission() {
            if (this.wamv.mode === 'idle') {
                this.startMission();
            } else if (this.wamv.mode === 'paused') {
                this.resumeMission();
            } else if (this.wamv.mode === 'auto') {
                this.stopMission();
            }
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

        toggleKill() {
            if (this.wamv.mode !== 'killed') {
                this.kill();
            }

            if (this.wamv.mode === 'killed') {
                this.unkill();
            }
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
    position: absolute;
    right: 12px;
    top: 16px;
    z-index: 1;

    padding: 8px;
    display: flex;
    min-width: 300px;
    border-radius: 2px;
    background-color: white; // alpha(white, 0.9);
    box-shadow: 0 2px 5px 0 alpha(black, 0.2), 0 2px 10px 0 alpha(black, 0.16);

    .armed-toggle {
        display: flex;
        width: 118px;
        justify-content: flex-end;
        border-left: 1px solid #DDD;
        padding-left: 8px;
        margin-left: 4px;

        .ui-switch-label-text {
            margin-right: 8px;
        }
    }

    .ui-button {
        height: 32px;
        margin-right: 8px;
        line-height: 1;
    }
}
</style>
