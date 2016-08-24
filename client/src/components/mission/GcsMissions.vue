<template>
	<div class="gcs-missions">
        <div class="sidebar-page">
            <div class="missions-list" v-if="currentView === 'index'">
                <ui-toolbar title="Missions" hide-nav-icon>
                    <div slot="actions">
                        <ui-icon-button
                            type="clear" icon="add" tooltip="Add mission"
                        ></ui-icon-button>

                        <!-- <ui-icon-button
                            type="clear" icon="file_upload" tooltip="Import missions from file"
                        ></ui-icon-button> -->

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
                        @click="selectMission(mission, index)"
                    ></gcs-mission-row>
                </div>
            </div>

            <component
                v-else :is="currentView" :mission="selectedMission" @go-back="showIndexView"
            ></component>
        </div>
    </div>
</template>

<script>
import GcsMission from 'mission/GcsMission.vue';
import GcsMissionRow from 'mission/GcsMissionRow.vue';

let missions = [
    {
        title: 'Mission 1',
        description: null,
        waypoints: []
    }, {
        title: 'Mission 2',
        description: 'A special description for this mission',
        waypoints: []
    }, {
        title: 'Mission 3',
        description: null,
        waypoints: [{
            title: null,
            type: 'normal',
            position: {
                lat: -32.8882,
                lng: 151.7080
            }
        }, {
            title: null,
            type: 'normal',
            position: {
                lat: -32.888091,
                lng: 151.7066267
            }
        }]
    }
];

export default {
    data() {
        return {
            missions,
            currentView: 'index',
            selectedMissionIndex: -1,
            overflowMenu: [
                { id: 'import', text: 'Import from file' },
                { id: 'export', text: 'Export to file' },
                { id: 'clear', text: 'Clear all' }
            ]
        };
    },

    computed: {
        selectedMission() {
            return this.missions[this.selectedMissionIndex];
        }
    },

    methods: {
        selectMission(mission, index) {
            this.selectedMissionIndex = index;
            this.currentView = 'gcs-mission';
        },

        showIndexView() {
            this.currentView = 'index';
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
