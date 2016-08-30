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
    getUploadMissionState, getUploadMissionData
} from 'store/getters';
import {
    setWamvArmed,
    sendUploadMission, failUploadMission
} from 'store/actions';

export default {
    vuex: {
        getters: {
            wamv:                getWamv,
            missions:            getMissions,
            WAITING:             getMessageStateWaiting,
            SUCCESS:             getMessageStateSuccess,
            FAILURE:             getMessageStateFailure,
            currentMissionIndex: getCurrentMissionIndex,
            uploadMissionState:  getUploadMissionState,
            uploadMissionData:   getUploadMissionData
        },

        actions: {
            setArmed: setWamvArmed,
            sendUploadMission,
            failUploadMission
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
            // do the download
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
