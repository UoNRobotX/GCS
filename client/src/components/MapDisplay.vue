<template>
    <div id="map-display">
        <div id="map"></div>
        <canvas id="overlay"></canvas>
    </div>
</template>

<script>
import loadGoogleMapsAPI from 'load-google-maps-api';
import THREE from 'three';
import MapData from 'js/mapData.js';
import OverlayData from 'js/overlayData.js';

let mapData = new MapData();
let overlayData = new OverlayData();

//starting loading the map and overlay
let loaded = loadGoogleMapsAPI({
    v: 3,
    key: 'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA',
}).then((googleMaps) => {
    mapData.load(googleMaps);
}, (err) => {
    console.log('Unable to load map');
}).then(() => {
    overlayData.load();
}).then(() => {
    let map = mapData.map;
    //add event listeners
    map.addListener('click', (e) => {
        console.log('click at: ' +
            e.latLng.lat() + ', ' + e.latLng.lng());
    });
    map.addListener('dblclick', (e) => {
        console.log('double click at: ' +
            e.latLng.lat() + ', ' + e.latLng.lng());
    });
    map.addListener('zoom_changed', () => {
        console.log('zoom change');
    });
    map.addListener('center_changed', () => {
        console.log('center change');
    });
});

export default {
    data() {
        return {
            mapData: mapData,
            overlayData: overlayData,
        };
    },
    events: {
        'map-center': function(){
            //center the map on the WAM-V
            let latLng = {lat: 21.308731, lng: -157.888815};
            this.mapData.map.panTo(latLng);
        },
        'map-zoom-in': function(){
            this.mapData.map.setZoom(this.mapData.map.getZoom()+1);
        },
        'map-zoom-out': function(){
            this.mapData.map.setZoom(this.mapData.map.getZoom()-1);
        },
        'map-type': function(value){
            this.mapData.map.setMapTypeId(google.maps.MapTypeId[value]);
        },
        'map-up': function(){
            let px = overlayData.element.height/4;
            this.mapData.map.panBy(0,-px);
        },
        'map-left': function(){
            let px = overlayData.element.width/4;
            this.mapData.map.panBy(-px,0);
        },
        'map-right': function(){
            let px = overlayData.element.width/4;
            this.mapData.map.panBy(px,0);
        },
        'map-down': function(){
            let px = overlayData.element.height/4;
            this.mapData.map.panBy(0,px);
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
