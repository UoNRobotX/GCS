<template>
    <div class="gcs-commands">
        <div class="row">
            <ui-button @click="uploadMission">Upload Mission</ui-button>
        </div>

        <div class="row">
            <ui-button @click="downloadMission">Download Mission</ui-button>
        </div>

        <div class="row">
            <ui-button>Start</ui-button>
        </div>

        <div class="row" v-if="wamv.loaded">
            <div class="column one-half"> {{ isArmed ? 'Armed' : 'Disarmed' }}</div>
            <div class="column one-half">
                <ui-switch :value.sync="isArmed"></ui-switch>
            </div>
        </div>

        <div class="row">
            <ui-button color="danger">Kill</ui-button>
        </div>
    </div>
</template>

<script>
import {
    getWamv, getMissions, getCurrentMissionIndex,
    getMessageStateWaiting, getMessageStateSuccess, getMessageStateFailure,
    getUploadMissionState, getUploadMissionData,
    getDownloadMissionState, getDownloadMissionData
} from 'store/getters';
import {
    setWamvArmed, setCurrentMission,
    sendUploadMission, failUploadMission,
    sendDownloadMission, failDownloadMission
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
            downloadMissionData:  getDownloadMissionData
        },

        actions: {
            setArmed: setWamvArmed,
            setCurrentMission,
            sendUploadMission,
            failUploadMission,
            sendDownloadMission,
            failDownloadMission
        }
    },

    computed: {
        isArmed: {
            get() {
                return this.wamv.armed;
            },

            set(value) {
                this.setArmed(value);
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
