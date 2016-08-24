<template>
    <div class="view map-view">
        <gcs-map></gcs-map>
        <gcs-map-controls></gcs-map-controls>
        <gcs-map-sidebar :show-sidebar="showSidebar"></gcs-map-sidebar>

        <gcs-sidebar-controls
            :show-sidebar="showSidebar" @toggle-sidebar="toggleSidebar"
        ></gcs-sidebar-controls>

        <gcs-wamv :lat="wamv.position.lat" :lng="wamv.position.lng"></gcs-wamv>
    </div>
</template>

<script>
import GcsMap from 'map/GcsMap.vue';
import GcsMapControls from 'map/GcsMapControls.vue';
import GcsMapSidebar from 'map/GcsMapSidebar.vue';
import GcsSidebarControls from 'map/GcsSidebarControls.vue';
import GcsWamv from 'markers/GcsWamv.vue';

import { getWamv } from 'store/getters';

export default {
    vuex: {
        getters: {
            wamv: getWamv
        }
    },

    data() {
        return {
            showSidebar: true
        };
    },

    methods: {
        toggleSidebar() {
            this.showSidebar = !this.showSidebar;
        }
    },

    components: {
        GcsMap,
        GcsWamv,
        GcsMapControls,
        GcsMapSidebar,
        GcsSidebarControls
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.view.map-view {
    position: relative;
}
</style>
