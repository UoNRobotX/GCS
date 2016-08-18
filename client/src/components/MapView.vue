<template>
    <div class="view map-view">
        <div id="map-sidebar">
            <planning-controls></planning-controls>
            <hr>
            <command-controls></command-controls>
        </div>
        <map-display></map-display>
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
            waypoints: [],
            hidden: false,
        };
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
}
</style>
