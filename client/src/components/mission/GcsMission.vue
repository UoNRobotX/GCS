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
                <ui-icon-button type="clear" icon="clear_all" tooltip="Clear all"></ui-icon-button>

                <ui-icon-button
                    type="clear" :icon="waypointsVisible ? 'visibility' : 'visibility_off'"
                    @click="toggleWaypointVisibility" :tooltip="waypointsVisible ? 'Hide waypoints' : 'Show waypoints'"
                ></ui-icon-button>

                <ui-icon-button
                    type="clear" icon="more_vert" has-dropdown-menu dropdown-position="bottom right"
                    :menu-options="overflowMenu"
                ></ui-icon-button>
            </div>
        </ui-toolbar>

        <div class="sidebar-page-content" v-el:page-content>
            <gcs-waypoint
                v-for="(index, waypoint) in mission.waypoints" :index="index"
                :label="toLetter(index + 1)" :title="waypoint.title" :type="waypoint.type"
                :lat="waypoint.position.lat" :lng="waypoint.position.lng" :visible="waypoint.visible"
                :rotation="waypoint.rotation" :scale="waypoint.scale" draggable
            ></gcs-waypoint>
        </div>
    </div>
</template>

<script>
import GcsWaypoint from 'markers/GcsWaypoint.vue';

import element from 'util/element-scroll';
import numberToLetter from 'util/number-to-letter';

import { setMapEditing } from 'store/actions';

export default {
    vuex: {
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
            let lat = Number( parseFloat(e.latLng.lat()).toFixed(7) );
            let lng = Number( parseFloat(e.latLng.lng()).toFixed(7) );

            let newWaypoint = {
                title: null,
                type: 'normal',
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

            // TODO: Actually hide/show the waypoints
        }
    },

    components: {
        GcsWaypoint
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
}
</style>