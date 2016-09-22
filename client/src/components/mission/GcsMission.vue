<template>
    <div class="gcs-mission">
        <ui-toolbar :title="mission.title" hide-nav-icon show-brand :show-brand-divider="false">
            <div slot="brand">
                <ui-icon-button
                    @click="goBack" type="clear" icon="arrow_back" tooltip="Back to Missions"
                    tooltip-position="bottom left"
                ></ui-icon-button>
            </div>

            <div slot="actions">
                <ui-icon-button
                    type="clear" icon="file_upload" tooltip="Upload mission" @click="uploadMission"
                    :disabled="!waypointsVisible || waitUploadMission"
                ></ui-icon-button>

                <ui-icon-button
                    type="clear" :icon="waypointsVisible ? 'visibility' : 'visibility_off'"
                    @click="toggleWaypointVisibility"
                    :tooltip="waypointsVisible ? 'Hide waypoints' : 'Show waypoints'"
                ></ui-icon-button>

                <ui-icon-button
                    type="clear" icon="more_vert" has-dropdown-menu dropdown-position="bottom right"
                    :menu-options="overflowMenu" @menu-option-selected="overflowMenuOptionSelected"
                ></ui-icon-button>
            </div>
        </ui-toolbar>

        <div class="sidebar-page-content" v-el:page-content>
            <div class="row">
                <ui-textbox
                    class="column one-half" label="Origin Latitude" name="latitude"
                    :value.sync="mission.origin.lat" type="number" :step="0.00001"
                ></ui-textbox>
                <ui-textbox
                    class="column one-half" label="Origin Longitude" name="longitude"
                    :value.sync="mission.origin.lng" type="number" :step="0.00001"
                ></ui-textbox>
            </div>

            <gcs-origin
                :lat.sync="mission.origin.lat" :lng.sync="mission.origin.lng"
                :scale="5" :draggable="mapEditing"
            ></gcs-origin>

            <p
                class="no-waypoints" v-if="!mission.waypoints.length"
            >No waypoints for this mission. Click the map to add a waypoint.</p>

            <div v-else>
                <gcs-waypoint
                    v-for="(index, waypoint) in mission.waypoints" :index="index" :id="'waypoint-' + index"
                    :label="toLetter(index + 1)" :title.sync="waypoint.title" :waypoint-type="waypoint.type"
                    :lat.sync="waypoint.position.lat" :lng.sync="waypoint.position.lng"
                    :rotation="waypoint.rotation" :scale="10"
                    :draggable="mapEditing" :visible="waypointsVisible"
                    @delete="deleteWaypoint(index)"
                ></gcs-waypoint>

                <gcs-waypoint-link
                    v-for="(index, waypoint) in mission.waypoints" :index="index"
                    :start="waypoint.position"
                    :end="mission.waypoints[(index+1) % mission.waypoints.length].position;"
                    :visible="waypointsVisible"
                ></gcs-waypoint-link>
            </div>
        </div>
    </div>
</template>

<script>
import GcsWaypoint from 'markers/GcsWaypoint.vue';
import GcsWaypointLink from 'markers/GcsWaypointLink.vue';
import GcsOrigin from 'markers/GcsOrigin.vue';

import element from 'util/element-scroll';
import numberToLetter from 'util/number-to-letter';

import { getMapEditing, getMissions, getCurrentMissionIndex, getWayPointsVisible } from 'store/getters';
import { setWaypointsVisible } from 'store/actions';

export default {
    vuex: {
        getters: {
            mapEditing:          getMapEditing,
            missions:            getMissions,
            currentMissionIndex: getCurrentMissionIndex,
            waypointsVisible:    getWayPointsVisible
        },

        actions: {
            setWaypointsVisible
        }
    },

    props: {
        mission: {
            type: Object,
            required: true
        }
    },

    data() {
        return {
            overflowMenu: [
                { id: 'edit', text: 'Edit mission' },
                { id: 'clear_all', text: 'Clear all waypoints' }
            ],
            originValid: true,
            waitUploadMission: false
        };
    },

    ready() {
        this.setWaypointsVisible(true);
    },

    beforeDestroy() {
        this.setWaypointsVisible(false);
    },

    methods: {
        goBack() {
            this.$dispatch('go-back');
        },

        toLetter(number) {
            return numberToLetter(number);
        },

        toggleWaypointVisibility() {
            this.setWaypointsVisible(!this.waypointsVisible);
        },

        deleteWaypoint(index) {
            this.mission.waypoints.splice(index, 1);
        },

        clearWaypoints() {
            if (!this.waypointsVisible) {
                return;
            }

            this.mission.waypoints = [];
            this.setWaypointsVisible(true);
        },

        uploadMission() {
            if (this.mission.origin.lat <  -90 || this.mission.origin.lat >  90 ||
                this.mission.origin.lng < -180 || this.mission.origin.lng > 180){
                this.$dispatch('app::create-snackbar', 'Mission origin is out of range');
                return;
            }
            this.$dispatch('client::set_mission', this.missions[this.currentMissionIndex]);
        },

        overflowMenuOptionSelected(option) {
            if (option.id === 'edit') {
                this.$dispatch('app::show-edit-mission-modal');
            } else if (option.id === 'clear_all') {
                this.clearWaypoints();
            }
        }
    },

    events: {
        'map:click'(e) {
            if (!this.mapEditing) {
                return;
            }

            let lat = Number( parseFloat(e.latLng.lat()).toFixed(7) );
            let lng = Number( parseFloat(e.latLng.lng()).toFixed(7) );

            let newWaypoint = {
                title: '',
                type: 'go_to_point',
                visible: true,
                position: {
                    lat,
                    lng
                }
            };

            this.mission.waypoints.push(newWaypoint);

            // Scroll to bottom
            this.$nextTick(() => {
                element.scrollToEnd(this.$els.pageContent);
            });
        },

        'map:dblclick'(e) {
            console.log('Map double clicked', e);
        },

        'map:rightclick'(e) {
            console.log('Map right-clicked', e);
        },

        'waypoint:drag'(index, lat, lng){
            //update waypoint links
            this.$broadcast('waypointLink:drag_start', index, lat, lng);
            let nextIndex = (index > 0 ? index - 1 : this.mission.waypoints.length - 1);
            this.$broadcast('waypointLink:drag_end', nextIndex, lat, lng);
        },

        'waypointLink:click'(index, lat, lng){
            if (!this.mapEditing) {
                return;
            }
            //insert new waypoint
            let newWaypoint = {
                title: '',
                type: 'go_to_point',
                visible: true,
                position: {
                    lat,
                    lng
                }
            };
            this.mission.waypoints.splice(index+1, 0, newWaypoint);

            // Scroll to the newly inserted waypoint
            this.$nextTick(() => {
                element.scrollIntoView(
                    this.$el.querySelector('#waypoint-' + (index + 1)), this.$els.pageContent, 56
                );
            });
        }
    },

    components: {
        GcsWaypoint,
        GcsWaypointLink,
        GcsOrigin
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-mission {
    height: 100%;

    .row {
        margin-bottom: 4px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .ui-toolbar-brand {
        min-width: 0;
    }

    .no-waypoints {
        font-size: 0.9em;
        color: #777;
        padding: 16px;
        margin: 0;
    }
}
</style>
