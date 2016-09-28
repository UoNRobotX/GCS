<template>
    <div class="gcs-commands">
        <ui-button v-if="wamv.mode === 'paused'"
            @click="startMission"
        >Restart</ui-button>

        <ui-button v-if="wamv.mode !== 'manual'"
            @click="toggleMission" :text="startButtonText"
            :disabled="wamv.mode === 'killed'"
        ></ui-button>

        <ui-button v-if="wamv.mode !== 'manual'"
            color="danger" :text="wamv.mode === 'killed' ? 'Unkill' : 'Kill'"
            @click="toggleKill"
        ></ui-button>

        <ui-button
            :text="modeButtonText"
            has-dropdown-menu dropdown-position="bottom right" :menu-options="overflowMenu"
            @menu-option-selected="menuOptionSelected"
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
            overflowMenu: [
                { id: 'auto',   text: 'Auto'  },
                { id: 'manual', text: 'Manual'}
            ],
            toggleMissionFailureTimer: null,
            TIMEOUT: 1000
        };
    },

    computed: {
        modeButtonText() {
            if (this.wamv.mode === 'manual') {
                return 'Mode: M';
            } else {
                return 'Mode: A';
            }
        },

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
                this.startMission();
            } else if (this.wamv.mode === 'paused') {
                this.$dispatch('client::resume_mission');
                clearTimeout(this.toggleMissionFailureTimer);
                this.toggleMissionFailureTimer = setTimeout(() => {
                    if (this.wamv.mode !== 'auto'){
                        this.$dispatch('app::create-snackbar', 'Resuming seems to have failed (Possible reasons: not armed, no battery, ...)');
                    }
                }, this.TIMEOUT);
            } else if (this.wamv.mode === 'auto') {
                this.$dispatch('client::stop_mission');
            }
        },

        startMission(){
            this.$dispatch('client::start_mission');
            clearTimeout(this.toggleMissionFailureTimer);
            this.toggleMissionFailureTimer = setTimeout(() => {
                if (this.wamv.mode !== 'auto'){
                    this.$dispatch('app::create-snackbar', 'Starting seems to have failed (Possible reasons: no uploaded mission, not armed, ...)');
                }
            }, this.TIMEOUT);
        },

        toggleKill() {
            this.$dispatch(this.wamv.mode === 'killed' ? 'client::unkill' : 'client::kill');
        },

        menuOptionSelected(option){
            switch (option.id){
                case 'auto':
                    if (this.wamv.mode !== 'manual'){
                        this.$dispatch('app::create-snackbar', 'Already in automatic mode');
                        return;
                    }
                    this.$dispatch('client::auto');
                    break;
                case 'manual':
                    if (this.wamv.mode === 'manual'){
                        this.$dispatch('app::create-snackbar', 'Already in manual mode');
                        return;
                    }
                    this.$dispatch('client::manual');
                    break;
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
    min-width: 200px;
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

    .ui-button-dropdown-icon {
        font-size: 18px;
        margin-top: -2px;
    }
}
</style>
