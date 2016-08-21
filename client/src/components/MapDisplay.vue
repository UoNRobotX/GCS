<template>
    <div id="map-display">
        <div id="map"></div>
        <canvas id="overlay"></canvas>
    </div>
</template>

<script>
import loadGoogleMapsAPI from 'load-google-maps-api';
import THREE from 'three';
import MapDisplayData from 'js/mapDisplayData.js';

export default {
    data() {
        return {
            data: new MapDisplayData()
        };
    },
    ready(){
        //starting loading the map and overlay
        let loaded = loadGoogleMapsAPI({
            v: 3,
            key: 'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA',
        }).then((googleMaps) => {
            this.data.load(googleMaps);
        }, (err) => {
            console.log('Unable to load map');
        }).then(() => {
            //add event listeners
            this.data.map.addListener('click', (e) => {
                this.data.clicked(e.latLng.lat(), e.latLng.lng());
            });
            this.data.map.addListener('dblclick', (e) => {
                console.log('double click at: ' +
                    e.latLng.lat() + ', ' + e.latLng.lng());
            });
            this.data.map.addListener('zoom_changed', () => {
                this.data.updateScene();
            });
            this.data.map.addListener('center_changed', () => {
                this.data.updateScene();
            });
        });
    },
    events: {
        'map-center': function(){
            this.data.center();
        },
        'map-zoom-in': function(){
            this.data.zoom(true);
        },
        'map-zoom-out': function(){
            this.data.zoom(false);
        },
        'map-type': function(value){
            this.data.setMapType(value);
        },
        'map-up': function(){
            this.data.moveMap(0);
        },
        'map-left': function(){
            this.data.moveMap(1);
        },
        'map-right': function(){
            this.data.moveMap(2);
        },
        'map-down': function(){
            this.data.moveMap(3);
        },
        'clear-waypoints': function(){
            this.data.clearWaypoints();
        },
        'save-waypoints': function(){
            this.data.saveWaypoints();
        },
        'load-waypoints': function(contents){
            this.data.loadWaypoints(contents);
        },
        'hide-waypoints': function(){
            this.data.hideWaypoints();
        },
        'show-waypoints': function(){
            this.data.showWaypoints();
        },
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

#map-display {
    margin-left: 5cm;
    height: 100%;
}

#map {
    width: 100%;
    height: 100%;
    z-index: 1;
}

#overlay {
    position: absolute;
    top: 48px;
    left: 5cm;
    z-index: 2;
    pointer-events: none;
}
</style>
