<template>
    <div class="gcs-commands">
        <div class="row">
            <ui-button @click="uploadMission">Upload Mission</ui-button>
        </div>

        <div class="row">
            <ui-button>Start</ui-button>
        </div>

        <div class="row" v-if:"this.wamv != null">
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
import { getWamv } from 'store/getters';
import { setWamvArmed } from 'store/actions';

export default {
    vuex: {
        getters: {
            wamv: getWamv
        },

        actions: {
            setArmed: setWamvArmed
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
            // do the upload
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
