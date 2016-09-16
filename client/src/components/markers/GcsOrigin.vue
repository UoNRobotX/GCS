<template>
    <div class="gcs-origin"></div>
</template>

<script>
import isMarker from 'mixins/is-marker';

export default {
    props: {
        lat: {
            type: Number
        },
        lng: {
            type: Number
        }
    },

    events: {
        drag(e) {
            this.lat = Number( parseFloat(e.latLng.lat()).toFixed(7) );
            this.lng = Number( parseFloat(e.latLng.lng()).toFixed(7) );
        }
    },

    methods: {
        getIcon(scale = this.scale, rotation = this.rotation) {
            return {
                path: google.maps.SymbolPath.CIRCLE,
                rotation: rotation,
                scale: scale,
                fillColor: 'orange',
                fillOpacity: 0.8,
                strokeColor: 'white',
                strokeWeight: 0
            };
        },
    },

    mixins: [
        isMarker
    ]
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-origin {
    display: none;
}
</style>
