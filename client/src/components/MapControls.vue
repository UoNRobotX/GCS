<template>
    <div class="map-controls">
        <table class="map-controls-buttons1" cellpadding="0" cellspacing="0">
            <tr>
                <td colspan="2">
                    <button v-on:click="mapCenterEvent">Center</button>
                </td>
            </tr>
            <tr>
                <td>
                    <button v-on:click="mapZoomInEvent">Zoom In</button>
                </td>
                <td>
                    <button v-on:click="mapZoomOutEvent">Zoom Out</button>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <select v-on:change="mapTypeEvent">
                        <option value="SATELLITE"> Satellite Map </option>
                        <option value="ROADMAP">   Road Map      </option>
                        <option value="HYBRID">    Hybrid Map    </option>
                        <option value="TERRAIN">   Terrain Map   </option>
                    </select>
                </td>
            </tr>
        </table>
        <table class="map-controls-buttons2" cellpadding="0" cellspacing="0">
            <tr>
                <td></td>
                <td>
                    <button v-on:click="mapUpEvent">^</button>
                </td>
                <td></td>
            </tr>
            <tr>
                <td>
                    <button v-on:click="mapLeftEvent">&lt;</button>
                </td>
                <td></td>
                <td>
                    <button v-on:click="mapRightEvent">&gt;</button>
                </td>
            </tr>
            <tr>
                <td></td>
                <td>
                    <button v-on:click="mapDownEvent">v</button>
                </td>
                <td></td>
            </tr>
        </table>
    </div>
</template>

<script>
export default {
    data() {
        return {};
    },
    methods: {
        mapCenterEvent(){
            this.$dispatch('map-center-event');
        },
        mapZoomInEvent(){
            this.$dispatch('map-zoom-in-event');
        },
        mapZoomOutEvent(){
            this.$dispatch('map-zoom-out-event');
        },
        mapTypeEvent(event){
            this.$dispatch('map-type-event', event.target.value);
        },
        mapUpEvent(){
            this.$dispatch('map-up-event');
        },
        mapLeftEvent(){
            this.$dispatch('map-left-event');
        },
        mapRightEvent(){
            this.$dispatch('map-right-event');
        },
        mapDownEvent(){
            this.$dispatch('map-down-event');
        },
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.map-controls {
    background-color: #444;
    position: absolute;
    bottom: 5%;
    right: 5%;
    z-index: 3;
}

.map-controls-buttons1 {
    float: left;
    button, select {
        width: 100%;
    }
}

.map-controls-buttons2 {
    float: right;
    button {
        width: 100%;
    }
}
</style>
