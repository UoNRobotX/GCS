<template>
    <div class="gcs-app">
        <ui-tabs class="main-tab-container" background-color="dark" text-color="light" indicator-color="transparent">
            <ui-tab header="Map">
                <map-view></map-view>
            </ui-tab>

            <ui-tab header="Params">
                <params-view></params-view>
            </ui-tab>

            <ui-tab header="Settings">
                <settings-view></settings-view>
            </ui-tab>
        </ui-tabs>

        <indicators heading="45° NE" speed="24 KMPH" battery="100%" signal="100%"></indicators>
    </div>
</template>

<script>
import MapView from 'components/MapView.vue';
import ParamsView from 'components/ParamsView.vue';
import SettingsView from 'components/SettingsView.vue';
import Indicators from 'components/Indicators.vue';
import socket_io_client from 'socket.io-client';

//open socket.io connection for WAM-V data
let socket = socket_io_client('localhost:3000');
socket.on('connect', () => {
    console.log('connected to server')
});
socket.on('disconnect', () => {
    console.log('disconnected from server');
});
socket.on('status', (data) => {
    console.log('received "status" message:');
    console.log(data);
});
socket.on('download_mission', (data) => {
    console.log('received "download_mission" message:');
    console.log(data);
});
socket.on('command_ack', (data) => {
    console.log('received "command_ack" message');
});
socket.on('error', (data) => {
    console.log('received "error" message');
});

export default {
    data() {
        return {};
    },

    components: {
        MapView,
        ParamsView,
        SettingsView,
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

.view {
    border: none;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: #eee;
    height: calc(100vh - 48px);

    .page {
        margin: 0 auto;
        max-width: 960px;
        background-color: white;
        box-shadow: 0 1px 6px #999;
    }

    .page-header {
        margin: 0;
        padding: 16px 24px;
        border-bottom: 1px solid #EEE;
        font-weight: normal;
        font-size: 1.75em;
        line-height: 1;
    }

    .page-content {
        padding: 24px;
        min-height: 160px;
    }
}
</style>
