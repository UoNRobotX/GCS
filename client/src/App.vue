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
    <socket-io-manager></socket-io-manager>
</template>

<script>
import MapView from 'views/MapView.vue';
import ParamsView from 'views/ParamsView.vue';
import SettingsView from 'views/SettingsView.vue';
import GcsIndicators from 'components/GcsIndicators.vue';
import SocketIoManager from 'components/SocketIoManager.vue';

export default {
    data() {
        return {};
    },

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
        },

        'client::get_parameters'() {
            this.$broadcast('client::get_parameters');
        },

        'client::set_parameters'(parameterSettings) {
            this.$broadcast('client::set_parameters', parameterSettings);
        },

        'client::save_missions'(missions) {
            this.$broadcast('client::save_missions', missions);
        },

        'client::load_missions'() {
            this.$broadcast('client::load_missions');
        },

        'client::upload_mission'(mission) {
            this.$broadcast('client::upload_mission', mission);
        },

        'client::download_mission'() {
            this.$broadcast('client::download_mission');
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

        /*
        'server::get_parameters:success'(){
            this.$broadcast('server::get_parameters:success');
        },

        'server::get_parameters:failure'(){
            this.$broadcast('server::get_parameters:failure');
        },

        'server::get_parameters:timeout'(){
            this.$broadcast('server::get_parameters:timeout');
        },
        */

        'server::set_parameters:success'(){
            this.$broadcast('server::set_parameters:success');
        },

        /*
        'server::set_parameters:failure'(){
            this.$broadcast('server::set_parameters:failure');
        },

        'server::set_parameters:timeout'(){
            this.$broadcast('server::set_parameters:timeout');
        },

        'server::save_missions:success'(){
            this.$broadcast('server::save_missions:success');
        },

        'server::save_missions:failure'(){
            this.$broadcast('server::save_missions:failure');
        },

        'server::save_missions:timeout'(){
            this.$broadcast('server::save_missions:timeout');
        },

        'server::load_missions:success'(){
            this.$broadcast('server::load_missions:success');
        },

        'server::load_missions:failure'(){
            this.$broadcast('server::load_missions:failure');
        },

        'server::load_missions:timeout'(){
            this.$broadcast('server::load_missions:timeout');
        },

        'server::upload_mission:success'(){
            this.$broadcast('server::upload_mission:success');
        },

        'server::upload_mission:failure'(){
            this.$broadcast('server::upload_mission:failure');
        },

        'server::upload_mission:timeout'(){
            this.$broadcast('server::upload_mission:timeout');
        },

        'server::download_mission:success'(){
            this.$broadcast('server::download_mission:success');
        },

        'server::download_mission:failure'(){
            this.$broadcast('server::download_mission:failure');
        },

        'server::download_mission:timeout'(){
            this.$broadcast('server::download_mission:timeout');
        },

        'server::arm:success'(){
            this.$broadcast('server::arm:success');
        },

        'server::arm:failure'(){
            this.$broadcast('server::arm:failure');
        },

        'server::arm:timeout'(){
            this.$broadcast('server::arm:timeout');
        },

        'server::disarm:success'(){
            this.$broadcast('server::disarm:success');
        },

        'server::disarm:failure'(){
            this.$broadcast('server::disarm:failure');
        },

        'server::disarm:timeout'(){
            this.$broadcast('server::disarm:timeout');
        },

        'server::start_mission:success'(){
            this.$broadcast('server::start_mission:success');
        },

        'server::start_mission:failure'(){
            this.$broadcast('server::start_mission:failure');
        },

        'server::start_mission:timeout'(){
            this.$broadcast('server::start_mission:timeout');
        },

        'server::start_mission:success'(){
            this.$broadcast('server::start_mission:success');
        },

        'server::start_mission:failure'(){
            this.$broadcast('server::start_mission:failure');
        },

        'server::start_mission:timeout'(){
            this.$broadcast('server::start_mission:timeout');
        },

        'server::resume_mission:success'(){
            this.$broadcast('server::resume_mission:success');
        },

        'server::resume_mission:failure'(){
            this.$broadcast('server::resume_mission:failure');
        },

        'server::resume_mission:timeout'(){
            this.$broadcast('server::resume_mission:timeout');
        },

        'server::kill:success'(){
            this.$broadcast('server::kill:success');
        },

        'server::kill:failure'(){
            this.$broadcast('server::kill:failure');
        },

        'server::kill:timeout'(){
            this.$broadcast('server::kill:timeout');
        },

        'server::unkill:success'(){
            this.$broadcast('server::unkill:success');
        },

        'server::unkill:failure'(){
            this.$broadcast('server::unkill:failure');
        },

        'server::unkill:timeout'(){
            this.$broadcast('server::unkill:timeout');
        },
        */
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
        GcsIndicators,
        SocketIoManager
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
