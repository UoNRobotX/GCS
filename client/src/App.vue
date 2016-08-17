<template>
    <div class="gcs-app">
        <ui-tabs class="main-tab-container" background-color="dark" text-color="light" indicator-color="transparent">
            <ui-tab header="Map">
                <map-view></map-view>
            </ui-tab>

            <ui-tab header="Params">
                Params
            </ui-tab>

            <ui-tab header="Settings">
                Settings
            </ui-tab>
        </ui-tabs>

        <indicators heading="45° NE" speed="24 KMPH" battery="100%" signal="100%"></indicators>
    </div>
</template>

<script>
import MapView from 'components/MapView.vue';
import Indicators from 'components/Indicators.vue';

export default {
    data() {
        return {};
    },

    components: {
        MapView,
        Indicators
    }
};
</script>

<style lang="stylus">
@import '~keen-ui/dist/keen-ui.css';
@import '~styles/_variables';

body,
.gcs-app {
    margin: 0;
    width: 100vw;
    height: 100vh;
    font-family: $font-stack;
}

.main-tab-container {
    margin: 0;
    padding: 0;

    .ui-tabs-body {
        padding: 0;
        border: none;
        overflow: hidden;
        height: calc(100vh - 48px);
    }

    .ui-tabs-header.background-color-dark {
        background-color: #333;
    }

    .ui-tabs-header.background-color-dark .ui-tab-header-item.active {
        background-color: #222;
    }

    .ui-tabs-header-items.text-color-light {
        color: $light-secondary;
    }
}
</style>
