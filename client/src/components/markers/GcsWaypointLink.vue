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
        start: {
            type: Object,
            required: true
        },
        end: {
            type: Object,
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

        start(){
            if (this.link){
                this.link.getPath().setAt(0, new google.maps.LatLng(this.start.lat, this.start.lng));
            }
        },

        end(){
            if (this.link){
                this.link.getPath().setAt(1, new google.maps.LatLng(this.end.lat, this.end.lng));
            }
        }
    },

    methods: {
        initializeLink() {
            this.link = new google.maps.Polyline({
                path: [this.start, this.end],
                strokeColor: this.strokeColor.normal,
                strokeOpacity: 1,
                strokeWeight: 3,
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
    },

    events: {
        'waypointLink:drag_start'(index, lat, lng){
            if (this.index == index){
                this.start = {lat: lat, lng: lng};
            } else {
                return true;
            }
        },
        'waypointLink:drag_end'(index, lat, lng){
            if (this.index == index){
                this.end = {lat: lat, lng: lng};
            } else {
                return true;
            }
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
