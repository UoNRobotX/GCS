<template>
    <div
        class="gcs-sidebar-controls"
        :style="{ transform: 'translateX(' + (showSidebar ? '376px' : '16px' + ')') }"
    >
        <ui-button
            :color="showSidebar ? 'primary' : 'default'" @click="toggleSidebar"
        >Missions</ui-button>

        <ui-button v-if="currentMissionIndex != -1" has-popover text="Commands">
            <div slot="popover" class="gcs-sidebar-controls-popover">
                <gcs-commands></gcs-commands>
            </div>
        </ui-button>
    </div>
</template>

<script>
import GcsCommands from 'map/GcsCommands.vue';
import { getCurrentMissionIndex } from 'store/getters';

export default {
    vuex: {
        getters: {
            currentMissionIndex: getCurrentMissionIndex
        }
    },

    props: {
        showSidebar: {
            type: Boolean,
            required: true
        }
    },

    methods: {
        toggleSidebar() {
            this.$dispatch('toggle-sidebar');
        }
    },

    components: {
        GcsCommands
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-sidebar-controls {
    display: flex;
    position: absolute;
    top: 16px;
    left: 0;
    z-index: 1;
    transition: transform 0.2s ease;
    transform: translateX(16px);
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 2px 5px 0 alpha(black, 0.2), 0 2px 10px 0 alpha(black, 0.16);

    .ui-button {
        border-radius: 0;
        border-right: 1px solid #CCC;
        height: 32px;

        .ui-button-dropdown-icon {
            font-size: 18px;
            margin-top: -2px;
        }

        &.color-default:not(.dropdown-open) {
            background-color: #fff;
        }

        &.color-primary {
            border-right: none;
        }

        &:last-child {
            border-right: none;
        }
    }
}
</style>
