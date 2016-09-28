<template>
    <div class="gcs-waypoint-link"></div>
</template>

<script>
import { getMap, getMapLoaded } from 'store/getters';

export default {
    vuex: {
        getters: {
            map: getMap,
            mapLoaded: getMapLoaded
        }
    },

    props: {
        index: {
            type: Number,
            required: true
        },

        startLat: {
            type: Number,
            required: true
        },

        startLng: {
            type: Number,
            required: true
        },

        endLat: {
            type: Number,
            required: true
        },

        endLng: {
            type: Number,
            required: true
        },

        visible: {
            type: Boolean,
            default: true
        }
    },

    data() {
        return {
            link: null,
            strokeColor: {normal: 'black', hover: 'green'}
        };
    },

    ready() {
        if (this.mapLoaded) {
            this.initializeLink();
        }
    },

    beforeDestroy() {
        this.link.setMap(null);
        this.link = null;
    },

    watch: {
        mapLoaded(newVal, oldVal) {
            if (!oldVal && newVal && !this.link) {
                this.initializeLink();
            }
        },

        map() {
            if (this.link) {
                this.link.setMap(this.map);
            }
        },

        startLat(){
            if (this.link){
                this.link.getPath().setAt(0, new google.maps.LatLng(this.startLat, this.startLng));
            }
        },

        startLng(){
            if (this.link){
                this.link.getPath().setAt(0, new google.maps.LatLng(this.startLat, this.startLng));
            }
        },

        endLat(){
            if (this.link){
                this.link.getPath().setAt(1, new google.maps.LatLng(this.endLat, this.endLng));
            }
        },

        endLng(){
            if (this.link){
                this.link.getPath().setAt(1, new google.maps.LatLng(this.endLat, this.endLng));
            }
        },

        visible(){
            if (this.link){
                this.link.setVisible(this.visible);
            }
        }
    },

    methods: {
        initializeLink() {
            this.link = new google.maps.Polyline({
                path: [
                    {lat: this.startLat, lng: this.startLng},
                    {lat: this.endLat, lng: this.endLng}
                ],
                strokeColor: this.strokeColor.normal,
                strokeOpacity: 1,
                strokeWeight: 5,
                visible: this.visible,
                map: this.map
            });
            this.link.addListener('click', (e) => {
                let lat = Number( parseFloat(e.latLng.lat()).toFixed(7) );
                let lng = Number( parseFloat(e.latLng.lng()).toFixed(7) );
                this.$dispatch('waypointLink:click', this.index, lat, lng);
            });
            this.link.addListener('mouseover', () => {
                if (this.link){
                    this.link.setOptions({strokeColor: this.strokeColor.hover});
                }
            });
            this.link.addListener('mouseout', () => {
                if (this.link){
                    this.link.setOptions({strokeColor: this.strokeColor.normal});
                }
            });
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-waypoint-link {
    display: none;
}
</style>
