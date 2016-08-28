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
                    type="clear" icon="clear_all" tooltip="Clear all" @click="clearWaypoints"
                ></ui-icon-button>

                <ui-icon-button
                    type="clear" :icon="waypointsVisible ? 'visibility' : 'visibility_off'"
                    @click="toggleWaypointVisibility"
                    :tooltip="waypointsVisible ? 'Hide waypoints' : 'Show waypoints'"
                ></ui-icon-button>

                <ui-icon-button
                    type="clear" icon="more_vert" has-dropdown-menu dropdown-position="bottom right"
                    :menu-options="overflowMenu"
                ></ui-icon-button>
            </div>
        </ui-toolbar>

        <div class="sidebar-page-content" v-el:page-content>
            <p
                class="no-waypoints" v-if="!mission.waypoints.length"
            >No waypoints for this mission. Click the map to add a waypoint.</p>

            <component v-else>
                <gcs-waypoint
                    v-for="(index, waypoint) in mission.waypoints" :index="index"
                    :label="toLetter(index + 1)" :title="waypoint.title" :type="waypoint.type"
                    :lat="waypoint.position.lat" :lng="waypoint.position.lng" :visible="waypoint.visible"
                    :rotation="waypoint.rotation" :scale="10" draggable
                    @delete="deleteWaypoint(index)"
                ></gcs-waypoint>
                <gcs-waypoint-link
                    v-for="(index, waypoint) in mission.waypoints"
                    :index="index"
                    :start="waypoint.position"
                    :end="mission.waypoints[(index+1) % mission.waypoints.length].position;"
                ></gcs-waypoint-link>
            </component>
        </div>
    </div>
</template>

<script>
import GcsWaypoint from 'markers/GcsWaypoint.vue';
import GcsWaypointLink from 'markers/GcsWaypointLink.vue';

import element from 'util/element-scroll';
import numberToLetter from 'util/number-to-letter';

import { setMapEditing } from 'store/actions';
import { getMapEditing } from 'store/getters';

export default {
    vuex: {
        getters: {
            mapEditing: getMapEditing
        },

        actions: {
            setMapEditing
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
            waypointsVisible: true,
            overflowMenu: [
                { id: 'edit', text: 'Edit mission' },
                { id: 'delete', text: 'Delete mission' }
            ]
        };
    },

    ready() {
        this.setMapEditing(true);
    },

    beforeDestroy() {
        this.setMapEditing(false);
    },

    events: {
        'map:click'(e) {
            if (!this.mapEditing) {
                return;
            }

            let lat = Number( parseFloat(e.latLng.lat()).toFixed(7) );
            let lng = Number( parseFloat(e.latLng.lng()).toFixed(7) );

            let newWaypoint = {
                title: null,
                type: 'normal',
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
            //update waypoint positions
            this.mission.waypoints[index].position.lat = lat;
            this.mission.waypoints[index].position.lng = lng;
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
                title: null,
                type: 'normal',
                visible: true,
                position: {
                    lat,
                    lng
                }
            };
            this.mission.waypoints.splice(index+1, 0, newWaypoint);
            // TODO: scroll to new waypoint?
        }
    },

    methods: {
        goBack() {
            this.$dispatch('go-back');
        },

        toLetter(number) {
            return numberToLetter(number);
        },

        toggleWaypointVisibility() {
            this.waypointsVisible = !this.waypointsVisible;

            this.mission.waypoints = this.mission.waypoints.map((waypoint) => {
                waypoint.visible = this.waypointsVisible;

                return waypoint;
            });

            this.setMapEditing(this.waypointsVisible);
        },

        deleteWaypoint(index) {
            this.mission.waypoints.splice(index, 1);
        },

        clearWaypoints() {
            this.mission.waypoints = [];

            this.waypointsVisible = true;
            this.setMapEditing(true);
        }
    },

    components: {
        GcsWaypoint,
        GcsWaypointLink
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
