<template>
    <div class="view map-view">
        <div id="map-sidebar">
            <planning-controls></planning-controls>
            <hr>
            <command-controls></command-controls>
        </div>
        <map-display v-on:click.capture="clickedMapDisplay"></map-display>
        <map-controls></map-controls>
    </div>
</template>

<script>
import PlanningControls from 'components/PlanningControls.vue';
import CommandControls from 'components/CommandControls.vue';
import MapDisplay from 'components/MapDisplay.vue';
import MapControls from 'components/MapControls.vue';

export default {
    data() {
        return {
            hidden: false,
        };
    },
    methods: {
        clickedMapDisplay(e){
            if (this.hidden){
                e.stopPropagation();
            }
        }
    },
    events: {
        'map-center-event': function(){
            this.$broadcast('map-center');
        },
        'map-zoom-in-event': function(){
            this.$broadcast('map-zoom-in');
        },
        'map-zoom-out-event': function(){
            this.$broadcast('map-zoom-out');
        },
        'map-type-event': function(value){
            this.$broadcast('map-type', value);
        },
        'map-up-event': function(){
            this.$broadcast('map-up');
        },
        'map-left-event': function(){
            this.$broadcast('map-left');
        },
        'map-right-event': function(){
            this.$broadcast('map-right');
        },
        'map-down-event': function(){
            this.$broadcast('map-down');
        },
        'clear-waypoints-event': function(){
            this.$broadcast('clear-waypoints');
        },
        'save-waypoints-event': function(){
            this.$broadcast('save-waypoints');
        },
        'load-waypoints-event': function(){
            this.$broadcast('load-waypoints');
        },
        'hide-waypoints-event': function(){
            this.$broadcast('hide-waypoints');
            this.hidden = true;
        },
        'show-waypoints-event': function(){
            this.$broadcast('show-waypoints');
            this.hidden = false;
        },
    },
    components: {
        PlanningControls,
        CommandControls,
        MapDisplay,
        MapControls,
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

#map-sidebar {
    background-color: #444;
    float: left;
    height: 100%;
    width: 5cm;
}
</style>
