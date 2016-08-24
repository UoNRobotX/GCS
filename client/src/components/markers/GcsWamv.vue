<template>
    <div class="gcs-wamv"></div>
</template>

<script>
import isMarker from 'mixins/is-marker';

export default {
    events: {
        click(e) {
            console.log('Wamv clicked', e);
        },

        initialized() {
            window.wamv = this;
        }
    },

    methods: {
        getIcon(scale = this.scale, rotation = this.rotation) {
            return {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                rotation: rotation,
                scale: scale,
                fillColor: 'red',
                fillOpacity: 0.8,
                strokeColor: 'white',
                strokeWeight: 2
            };
        }
    },

    mixins: [
        isMarker
    ]
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-wamv {
    display: none;
}
</style>
