<template>
    <div class="gcs-map-sidebar" v-show="showSidebar" transition="sidebar-collapse">
        <gcs-missions></gcs-missions>
    </div>
</template>

<script>
import GcsMissions from 'mission/GcsMissions.vue';

export default {
    props: {
        showSidebar: {
            type: Boolean,
            required: true
        }
    },

    components: {
        GcsMissions
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-map-sidebar {
    position: absolute;
    width: 360px;
    height: 100%;

    top: 0;
    left: 0;
    z-index: 1;

    overflow-y: auto;
    overflow-x: hidden;

    background-color: white;
    box-shadow: 0 0 4px alpha(black, 0.35), 0 2px 3px alpha(black, 0.2);
}

.sidebar-collapse-transition {
    transition: transform 0.2s ease;
    transform: translateX(0);
}

.sidebar-collapse-enter,
.sidebar-collapse-leave {
    transform: translateX(-360px);
}
</style>
