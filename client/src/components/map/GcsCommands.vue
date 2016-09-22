<template>
    <div class="gcs-commands">
        <ui-button v-if="wamv.mode === 'paused'"
            @click="startMission" :disabled="waitToggleMission"
        >Restart</ui-button>

        <ui-button
            @click="toggleMission" :text="startButtonText"
            :disabled="wamv.mode === 'killed' || waitToggleMission"
        ></ui-button>

        <ui-button
            color="danger" :text="wamv.mode === 'killed' ? 'Unkill' : 'Kill'"
            @click="toggleKill" :disabled="waitToggleKill"
        ></ui-button>

        <div class="armed-toggle" v-if="wamv.loaded">
            <ui-switch
                :value.sync="isArmed" :label="isArmed ? 'Armed' : 'Disarmed'" label-left
                :disabled="wamv.mode === 'auto'"
            ></ui-switch>
        </div>
    </div>
</template>

<script>
import { getWamv } from 'store/getters';

export default {
    vuex: {
        getters: {
            wamv: getWamv
        }
    },

    data(){
        return {
            waitToggleMission: false,
            waitToggleKill: false
        };
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
                    this.$dispatch('client::arm');
                } else {
                    this.$dispatch('client::disarm');
                }
            }
        }
    },

    methods: {
        toggleMission() {
            if (this.wamv.mode === 'idle') {
                this.$dispatch('client::start_mission');
            } else if (this.wamv.mode === 'paused') {
                this.$dispatch('client::resume_mission');
            } else if (this.wamv.mode === 'auto') {
                this.$dispatch('client::stop_mission');
            }
        },

        startMission(){
            this.$dispatch('client::start_mission');
        },

        toggleKill() {
            this.$dispatch(this.wamv.mode === 'killed' ? 'client::unkill' : 'client::kill');
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
