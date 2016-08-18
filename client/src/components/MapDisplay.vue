<template>
    <div id="map-display">
        <div id="map"></div>
        <canvas id="overlay"></canvas>
    </div>
</template>

<script>
import loadGoogleMapsAPI from 'load-google-maps-api';

//starting loading a map using the google maps API
    //the map object will be stored in the 'map' member of a 'mapData' object
    //this is done so that it can be referred to by a handler that the API calls when loaded
let mapData = {
    map: null,
    loadMap() {
        loadGoogleMapsAPI({
            v: 3,
            key: 'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA',
        }).then((googleMaps) => {
            let mapElement = document.getElementById('map');
            this.map = new googleMaps.Map(mapElement, {
                center: {lat: 21.308731, lng: -157.888815},
                zoom: 17,
                tilt: 0,
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                disableDefaultUI: true,
                disableDoubleClickZoom: true,
            });

            //also set overlay size
            let overlayElement = document.getElementById('overlay');
            overlayElement.width = mapElement.clientWidth;
            overlayElement.height = mapElement.clientHeight;

        }).catch((err) => {
            console.log('Unable to load map');
        });
    }
}
mapData.loadMap();

//when window is resized, resize overlay
window.addEventListener('resize', () => {
    let mapElement = document.getElementById('map');
    let overlayElement = document.getElementById('overlay');
    overlayElement.width = mapElement.clientWidth;
    overlayElement.height = mapElement.clientHeight;
});

export default {
    data() {
        return {
            mapData: mapData,
        };
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
    z-index: 0;
}

#overlay {
    position: absolute;
    top: 48px;
    left: 5cm;
    z-index: 1;
}
</style>
