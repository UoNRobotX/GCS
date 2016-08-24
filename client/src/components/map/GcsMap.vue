<template>
    <div class="gcs-map" id="map" :class="{ 'gcs-map-edit-mode': mapEditing }"></div>
</template>

<script>
import copy from 'util/copy-object';
import loadGoogleMapsAPI from 'load-google-maps-api';

import { setMap, setMapEl, setMapLoaded } from 'store/actions';
import { getWamv, getSettings, getConfig, getMap, getMapEl, getMapLoaded, getMapEditing } from 'store/getters';

export default {
    vuex: {
        getters: {
            map: getMap,
            mapEl: getMapEl,
            mapLoaded: getMapLoaded,
            mapEditing: getMapEditing,
            wamv: getWamv,
            config: getConfig,
            settings: getSettings
        },

        actions: {
            setMap,
            setMapEl,
            setMapLoaded
        }
    },

    watch: {
        mapEditing() {
            if (this.mapEditing) {
                this.map.setOptions({ draggableCursor: 'crosshair' });
            } else {
                this.map.setOptions({ draggableCursor: 'move' });
            }
        }
    },

    ready() {
        this.setMapEl(document.getElementById('map'));

        loadGoogleMapsAPI(this.config.googleMaps)
            .then(this.initializeMap)
            .catch((error) => {
                console.log('Unable to load Google Maps API', error);
            });
    },


    events: {
        'map::pan-up'() {
            this.map.panBy(0, -1 * (this.mapEl.clientHeight / 4));
        },

        'map::pan-down'() {
            this.map.panBy(0, this.mapEl.clientHeight / 4);
        },

        'map::pan-left'() {
            this.map.panBy(-1 * (this.mapEl.clientWidth / 4), 0);
        },

        'map::pan-right'() {
            this.map.panBy(this.mapEl.clientWidth / 4, 0);
        },

        'map::pan-center'() {
            this.map.panTo(this.wamv.position);
        },

        'map::zoom-in'() {
            this.map.setZoom(this.map.getZoom() + 1);
        },

        'map::zoom-out'() {
            this.map.setZoom(this.map.getZoom() - 1);
        },

        'map::change-type'(newType) {
            this.map.setMapTypeId(google.maps.MapTypeId[newType]);
        }
    },

    methods: {
        initializeMap() {
            let mapConfig = copy(this.config.map);

            mapConfig.mapTypeId = google.maps.MapTypeId[this.settings.defaultMapType];

            let map = new google.maps.Map(this.mapEl, mapConfig);

            this.setupEvents(map);

            this.setMap(map);
            this.setMapLoaded(true);
        },

        setupEvents(map) {
            map.addListener('click', (e) => {
                this.$dispatch('map:click', e);
            });

            map.addListener('dblclick', (e) => {
                this.$dispatch('map:dblclick', e);
            });

            map.addListener('rightclick', (e) => {
                this.$dispatch('map:rightclick', e);
            });
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-map {
    width: 100%;
    height: 100%;
    z-index: 1;

    &.gcs-map-edit-mode {
        cursor: crosshair;
    }
}
</style>
