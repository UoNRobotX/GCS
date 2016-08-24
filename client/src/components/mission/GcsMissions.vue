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
            visible: true,
            position: {
                lat: -32.8882,
                lng: 151.7080
            }
        }, {
            title: null,
            type: 'normal',
            visible: true,
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
            currentView: 'listing',
            currentMissionIndex: -1,
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
            this.currentMissionIndex = index;
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
