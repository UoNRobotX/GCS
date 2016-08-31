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

    <!-- <socket-io-manager></socket-io-manager> -->
</template>

<script>
import uuid from 'util/uuid';
import socket_io_client from 'socket.io-client';

import MapView from 'views/MapView.vue';
import ParamsView from 'views/ParamsView.vue';
import SettingsView from 'views/SettingsView.vue';
import GcsIndicators from 'components/GcsIndicators.vue';
// import SocketIoManager from 'components/SocketIoManager.vue';

import { setWamv, setParameters, setMissions, setCurrentMission } from 'store/actions';

export default {
    vuex: {
        actions: {
            setWamv,
            setParameters,
            setMissions,
            setCurrentMission
        }
    },

    data() {
        return {
            socket: null,
            sentMessageIds: [],
            timedoutMessageIds: [],
            timeouts: {}
        };
    },

    ready() {
        this.setupSocket();
    },

    events: {
        'send-to-server'(messageType, data) {
            let messageId = uuid.generate();

            this.socket.emit(messageType, data, messageId);
            this.sentMessageIds.push(messageId);

            this.timeouts[messageId] = window.setTimeout(() => {
                this.timedoutMessageIds.push(messageId);
                this.$broadcast('server-message-timeout', messageType);

                console.log('Timeout reached for message', messageType);
                window.clearTimeout(this.timeouts[messageId]);
            }, 1000);
        },

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
        },

        setupSocket() {
            // Initialise socket
            this.socket = socket_io_client('localhost:3000');

            this.socket.on('connect', this.onConnect);
            this.socket.on('disconnect', this.onDisconnect);
            this.socket.on('status',this.onStatus);
            this.socket.on('get_parameters', this.onParameterReceived);
            this.socket.on('load_missions', this.onMissionsReceived);
            this.socket.on('download_mission', this.onCurrentMissionReceived);
            this.socket.on('success', this.onSuccess);
            this.socket.on('failure', this.onFailure);
            this.socket.on('attention', this.onAttention);
        },

        onConnect() {
            console.log('connected to server');

            //get parameters once at startup
            this.$emit('send-to-server', 'get_parameters');

            //load missions once at startup
            this.$emit('send-to-server', 'load_missions');
        },

        onDisconnect() {
            console.log('disconnected from server');
        },

        onSuccess(messageType, messageId) {
            // clear timeout for the message
            // broadcast to components
            // remove from sentMessages
            if (this.timedoutMessageIds.indexOf(messageId) !== -1) {
                this.$broadcast('server-message-success', messageType);

                this.cleanUp(messageId);
            }

            console.log('received "success" message');
        },

        onFailure(messageType, messageId) {
            if (this.timedoutMessageIds.indexOf(messageId) !== -1) {
                this.$broadcast('server-message-failure', messageType);

                this.cleanUp(messageId);
            }

            console.log('received "failure" message');
        },

        onStatus(data) {
            //console.log('received "status" message');
            data.loaded = true;
            this.setWamv(data);
        },

        onParameterReceived(data, messageId) {
            console.log('received "get_parameters" message', messageId);
            this.setParameters(data);

            this.cleanUp(messageId);
        },

        onMissionsReceived(data, messageId) {
            console.log('received "load_missions" message');
            this.setMissions(data);

            this.cleanUp(messageId);
        },

        onCurrentMissionReceived(data, messageId) {
            console.log('received "download_mission" message:');
            this.setCurrentMission(data);

            this.cleanUp(messageId);
        },

        onAttention(data, messageId) {
            console.log('Attention: ' + data);
            this.cleanUp(messageId);
        },

        cleanUp(messageId) {
            console.log('Timeouts', this.timeouts);
            console.log('Clearing timeout',this.timeouts[messageId]);

            window.clearTimeout(this.timeouts[messageId]);
            this.sentMessageIds.$remove(messageId);
        }
    },

    components: {
        MapView,
        ParamsView,
        SettingsView,
        GcsIndicators
        // SocketIoManager
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
