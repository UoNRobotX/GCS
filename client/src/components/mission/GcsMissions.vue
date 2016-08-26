<template>
    <div class="gcs-missions">
        <div class="sidebar-page">
            <div class="missions-list" v-if="currentView === 'listing'">
                <ui-toolbar title="Missions" hide-nav-icon>
                    <div slot="actions">
                        <ui-icon-button
                            type="clear" icon="add" tooltip="Add mission"
                        ></ui-icon-button>

                        <ui-icon-button
                            type="clear" icon="more_vert" has-dropdown-menu
                            dropdown-position="bottom right" :menu-options="overflowMenu"
                        ></ui-icon-button>
                    </div>
                </ui-toolbar>

                <div class="sidebar-page-content">
                    <div class="blank-state" v-if="!missions.length">No missions</div>

                    <gcs-mission-row
                        v-for="(index, mission) in missions" :mission="mission"
                        @click="selectMission(index)"
                    ></gcs-mission-row>
                </div>
            </div>

            <component
                v-else :is="currentView" :mission="currentMission" @go-back="showListingView"
            ></component>
        </div>
    </div>
</template>

<script>
import GcsMission from 'mission/GcsMission.vue';
import GcsMissionRow from 'mission/GcsMissionRow.vue';

import { setCurrentMissionIndex } from 'store/actions';
import { getMissions, getCurrentMissionIndex } from 'store/getters';

export default {
    vuex: {
        getters: {
            missions: getMissions,
            currentMissionIndex: getCurrentMissionIndex
        },

        actions: {
            setCurrentMissionIndex
        }
    },

    data() {
        return {
            currentView: 'listing',
            overflowMenu: [
                { id: 'import', text: 'Import from file' },
                { id: 'export', text: 'Export to file' },
                { id: 'clear', text: 'Clear all' }
            ]
        };
    },

    computed: {
        currentMission() {
            return this.missions[this.currentMissionIndex];
        }
    },

    methods: {
        selectMission(index) {
            this.setCurrentMissionIndex(index);
            this.currentView = 'gcs-mission';
        },

        showListingView() {
            this.currentView = 'listing';
        }
    },

    components: {
        GcsMission,
        GcsMissionRow
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-missions,
.missions-list {
    height: 100%
    overflow: hidden;
}
</style>
