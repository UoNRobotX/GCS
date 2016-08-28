<template>
    <div class="gcs-app">
        <ui-tabs
            class="main-tab-container" background-color="dark" text-color="light"
            indicator-color="transparent"
        >
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

        <gcs-indicators></gcs-indicators>

        <ui-snackbar-container position="center"></ui-snackbar-container>
    </div>
</template>

<script>
import MapView from 'views/MapView.vue';
import ParamsView from 'views/ParamsView.vue';
import SettingsView from 'views/SettingsView.vue';
import GcsIndicators from 'components/GcsIndicators.vue';
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
socket.on('get_parameters', (data) => {
    console.log('received "get_parameters" message:');
    console.log(data);
});
socket.on('load_missions', (data) => {
    console.log('received "load_missions" message:');
    console.log(data);
});
socket.on('download_mission', (data) => {
    console.log('received "download_mission" message:');
    console.log(data);
});
socket.on('success', (data) => {
    console.log('received "success" message');
});
socket.on('failure', (data) => {
    console.log('received "failure" message');
    console.log(data);
});
socket.on('attention', (data) => {
    console.log('received "attention" message');
    console.log(data);
});

export default {
    events: {
        'app::create-snackbar'(message, snackbar) {
            this.createSnackbar(message, snackbar);
        },

        'map::pan-up'() {
            this.$broadcast('map::pan-up');
        },

        'map::pan-down'() {
            this.$broadcast('map::pan-down');
        },

        'map::pan-left'() {
            this.$broadcast('map::pan-left');
        },

        'map::pan-right'() {
            this.$broadcast('map::pan-right');
        },

        'map::pan-center'() {
            this.$broadcast('map::pan-center');
        },

        'map::zoom-in'() {
            this.$broadcast('map::zoom-in');
        },

        'map::zoom-out'() {
            this.$broadcast('map::zoom-out');
        },

        'map::change-type'(newType) {
            this.$broadcast('map::change-type', newType);
        },

        'map:click'(e) {
            this.$broadcast('map:click', e);
        },

        'map:dblclick'(e) {
            this.$broadcast('map:dblclick', e);
        },

        'map:rightclick'(e) {
            this.$broadcast('map:rightclick', e);
        }
    },

    methods: {
        createSnackbar(message, snackbar) {
            snackbar = snackbar || {
                message
            };

            this.$broadcast('ui-snackbar::create', snackbar);
        }
    },

    components: {
        MapView,
        ParamsView,
        SettingsView,
        GcsIndicators
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
