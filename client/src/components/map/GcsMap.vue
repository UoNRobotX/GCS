<template>
    <div class="gcs-map" id="map" :class="{ 'gcs-map-edit-mode': mapEditing }"></div>
</template>

<script>
import loadGoogleMapsAPI from 'load-google-maps-api';

import { setMap, setMapEl, setMapLoaded } from 'store/actions';
import { getWamv, getSettings, getSettingsLastUpdateTime, getMap, getMapEl, getMapLoaded, getMapEditing } from 'store/getters';

export default {
    vuex: {
        getters: {
            map: getMap,
            mapEl: getMapEl,
            mapLoaded: getMapLoaded,
            mapEditing: getMapEditing,
            wamv: getWamv,
            settings: getSettings,
            settingsLastUpdateTime: getSettingsLastUpdateTime
        },

        actions: {
            setMap,
            setMapEl,
            setMapLoaded
        }
    },

    watch: {
        mapEditing() {
            if (!this.mapLoaded){
                return;
            }

            if (this.mapEditing) {
                this.map.setOptions({ draggableCursor: 'crosshair' });
            } else {
                this.map.setOptions({ draggableCursor: 'move' });
            }
        },

        settingsLastUpdateTime(){
            if (this.mapLoaded){
                return;
            }

            this.setMapEl(document.getElementById('map'));

            let key = null;
            SearchKey:
            for (let section of this.settings){
                if (section.title === 'Map'){
                    for (let setting of section.settings){
                        if (setting.title === 'key'){
                            key = setting.value;
                            break SearchKey;
                        }
                    }
                }
            }

            if (key === null){
                console.log('Unable to find Google Maps key');
            } else {
                loadGoogleMapsAPI({key: key, v: 3})
                    .then(this.initializeMap)
                    .catch((error) => {
                        console.log('Unable to load Google Maps API', error);
                    });
            }
        }
    },

    events: {
        'map::pan-up'() {
            if (this.mapLoaded){
                this.map.panBy(0, -1 * (this.mapEl.clientHeight / 4));
            }
        },

        'map::pan-down'() {
            if (this.mapLoaded){
                this.map.panBy(0, this.mapEl.clientHeight / 4);
            }
        },

        'map::pan-left'() {
            if (this.mapLoaded){
                this.map.panBy(-1 * (this.mapEl.clientWidth / 4), 0);
            }
        },

        'map::pan-right'() {
            if (this.mapLoaded){
                this.map.panBy(this.mapEl.clientWidth / 4, 0);
            }
        },

        'map::pan-center'() {
            if (this.mapLoaded && this.wamv.loaded){
                this.map.panTo(this.wamv.position);
            }
        },

        'map::zoom-in'() {
            if (this.mapLoaded && this.wamv.loaded){
                this.map.setZoom(this.map.getZoom() + 1);
            }
        },

        'map::zoom-out'() {
            if (this.mapLoaded && this.wamv.loaded){
                this.map.setZoom(this.map.getZoom() - 1);
            }
        },

        'map::change-type'(newType) {
            if (this.mapLoaded && this.wamv.loaded){
                this.map.setMapTypeId(google.maps.MapTypeId[newType]);
            }
        }
    },

    methods: {
        initializeMap() {
            let lat = null, lng = null, zoom = null;
            for (let section of this.settings){
                if (section.title === 'Map'){
                    for (let setting of section.settings){
                        if (setting.title === 'lat'){
                            lat = setting.value;
                        } else if (setting.title === 'lng'){
                            lng = setting.value;
                        } else if (setting.title === 'zoom'){
                            zoom = setting.value;
                        }
                    }
                }
            }

            if (lat === null || lng === null || zoom === null){
                console.log('Could not find lng/lng/zoom setting');
            } else {
                let map = new google.maps.Map(this.mapEl, {
                    center: {
                        lat: parseFloat(lat),
                        lng: parseFloat(lng)
                    },
                    zoom: parseFloat(zoom),
                    mapTypeId: google.maps.MapTypeId.SATELLITE,
                    disableDefaultUI: true,
                    disableDoubleClickZoom: true,
                    tilt: 0
                });
                this.setupEvents(map);
                this.setMap(map);
                this.setMapLoaded(true);
            }
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
