<template>
    <div class="view map-view">
        <div id="map-sidebar">
            <div class="button-set">
                <div>
                    <ui-button color="primary">Add</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Delete</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Clear</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Save</ui-button>
                    <ui-button color="primary">Load</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Hide</ui-button>
                </div>
            </div>
            <hr>
            <div class="button-set">
                <div>
                    <ui-button color="primary">Upload Mission</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Arm</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Start</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Kill Switch</ui-button>
                </div>
            </div>
        </div>
        <div id="map"></div>
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
            this.map = new googleMaps.Map(document.getElementById('map'), {
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
            waypoints: [],
            hidden: false,
        };
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

#map-sidebar {
    background-color: #444;
    float: left;
    height: 100%;
    > .button-set > div {
        padding-top: 10px;
        padding-left: 10px;
        padding-right: 10px;
        &:last-child {
            padding-bottom: 10px;
        }
    }
}

#map {
    height: 100%;
}
</style>
