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

        <ui-snackbar-container position="left"></ui-snackbar-container>

        <gcs-edit-mission-modal :show.sync="showEditMissionModal"></gcs-edit-mission-modal>
    </div>

    <socket-io-manager></socket-io-manager>
</template>

<script>
import MapView from 'views/MapView.vue';
import ParamsView from 'views/ParamsView.vue';
import SettingsView from 'views/SettingsView.vue';
import GcsIndicators from 'components/GcsIndicators.vue';
import SocketIoManager from 'components/SocketIoManager.vue';
import GcsEditMissionModal from 'components/mission/GcsEditMissionModal.vue';

import ControllerManager from 'modules/controller-manager.js';

export default {
    data() {
        return {
            showEditMissionModal: false
        };
    },

    ready() {
        new ControllerManager(this.controllerEvent);
    },

    events: {
        'app::create-snackbar'(message, snackbar) {
            this.createSnackbar(message, snackbar);
        },

        'app::show-edit-mission-modal'() {
            this.showEditMissionModal = true;
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
        },

        'client::get_parameters'() {
            this.$broadcast('client::get_parameters');
        },

        'client::set_parameters'(params) {
            this.$broadcast('client::set_parameters', params);
        },

        'client::get_settings'() {
            this.$broadcast('client::get_settings');
        },

        'client::set_settings'(settings) {
            this.$broadcast('client::set_settings', settings);
        },

        'client::set_missions'(missions) {
            this.$broadcast('client::set_missions', missions);
        },

        'client::get_missions'() {
            this.$broadcast('client::get_missions');
        },

        'client::set_mission'(mission) {
            this.$broadcast('client::set_mission', mission);
        },

        'client::get_mission'() {
            this.$broadcast('client::get_mission');
        },

        'client::arm'() {
            this.$broadcast('client::arm');
        },

        'client::disarm'() {
            this.$broadcast('client::disarm');
        },

        'client::start_mission'() {
            this.$broadcast('client::start_mission');
        },

        'client::stop_mission'() {
            this.$broadcast('client::stop_mission');
        },

        'client::resume_mission'() {
            this.$broadcast('client::resume_mission');
        },

        'client::kill'() {
            this.$broadcast('client::kill');
        },

        'client::unkill'() {
            this.$broadcast('client::unkill');
        },

        'client::manual'() {
            this.$broadcast('client::manual');
        },

        'client::auto'() {
            this.$broadcast('client::auto');
        },

        'server::set_parameters_ack'(){
            this.$broadcast('server::set_parameters_ack');
        },

        'server::set_settings_ack'(){
            this.$broadcast('server::set_settings_ack');
        },

        'server::set_mission_ack'(){
            this.$broadcast('server::set_mission_ack');
        }
    },

    methods: {
        controllerEvent(event, data) {
            console.info(event, data);
            this.$broadcast('client::controller_event', data);
        },

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
        GcsIndicators,
        SocketIoManager,
        GcsEditMissionModal
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
