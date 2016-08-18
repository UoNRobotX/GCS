<template>
    <div id="map"></div>
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
            });
        }).catch((err) => {
            console.log('Unable to load map');
        });
    }
}
mapData.loadMap();

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

#map {
    height: 100%;
}
</style>
