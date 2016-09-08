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

export default {
    data() {
        return {
            showEditMissionModal: false
        };
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

        'client::get_parameters'(initiator) {
            this.$broadcast('client::get_parameters', initiator);
        },

        'client::set_parameters'(params, initiator) {
            this.$broadcast('client::set_parameters', params, initiator);
        },

        'client::get_settings'(initiator) {
            this.$broadcast('client::get_settings', initiator);
        },

        'client::set_settings'(settings, initiator) {
            this.$broadcast('client::set_settings', settings, initiator);
        },

        'client::save_missions'(missions, initiator) {
            this.$broadcast('client::save_missions', missions, initiator);
        },

        'client::load_missions'(initiator) {
            this.$broadcast('client::load_missions', initiator);
        },

        'client::upload_mission'(mission, initiator) {
            this.$broadcast('client::upload_mission', mission, initiator);
        },

        'client::download_mission'(initiator) {
            this.$broadcast('client::download_mission', initiator);
        },

        'client::arm'(initiator) {
            this.$broadcast('client::arm', initiator);
        },

        'client::disarm'(initiator) {
            this.$broadcast('client::disarm', initiator);
        },

        'client::start_mission'(initiator) {
            this.$broadcast('client::start_mission', initiator);
        },

        'client::stop_mission'(initiator) {
            this.$broadcast('client::stop_mission', initiator);
        },

        'client::resume_mission'(initiator) {
            this.$broadcast('client::resume_mission', initiator);
        },

        'client::kill'(initiator) {
            this.$broadcast('client::kill', initiator);
        },

        'client::unkill'(initiator) {
            this.$broadcast('client::unkill', initiator);
        },

        'server.get_parameters:success'(initiator){
            this.$broadcast('server.get_parameters:success', initiator);
        },

        'server.get_parameters:failure'(initiator){
            this.$broadcast('server.get_parameters:failure', initiator);
        },

        'server.get_parameters:timeout'(initiator){
            this.$broadcast('server.get_parameters:timeout', initiator);
        },

        'server.set_parameters:success'(initiator){
            this.$broadcast('server.set_parameters:success', initiator);
        },

        'server.set_parameters:failure'(initiator){
            this.$broadcast('server.set_parameters:failure', initiator);
        },

        'server.set_parameters:timeout'(initiator){
            this.$broadcast('server.set_parameters:timeout', initiator);
        },

        'server.get_settings:success'(initiator){
            this.$broadcast('server.get_settings:success', initiator);
        },

        'server.get_settings:failure'(initiator){
            this.$broadcast('server.get_settings:failure', initiator);
        },

        'server.get_settings:timeout'(initiator){
            this.$broadcast('server.get_settings:timeout', initiator);
        },

        'server.set_settings:success'(initiator){
            this.$broadcast('server.set_settings:success', initiator);
        },

        'server.set_settings:failure'(initiator){
            this.$broadcast('server.set_settings:failure', initiator);
        },

        'server.set_settings:timeout'(initiator){
            this.$broadcast('server.set_settings:timeout', initiator);
        },

        'server.save_missions:success'(initiator){
            this.$broadcast('server.save_missions:success', initiator);
        },

        'server.save_missions:failure'(initiator){
            this.$broadcast('server.save_missions:failure', initiator);
        },

        'server.save_missions:timeout'(initiator){
            this.$broadcast('server.save_missions:timeout', initiator);
        },

        'server.load_missions:success'(initiator){
            this.$broadcast('server.load_missions:success', initiator);
        },

        'server.load_missions:failure'(initiator){
            this.$broadcast('server.load_missions:failure', initiator);
        },

        'server.load_missions:timeout'(initiator){
            this.$broadcast('server.load_missions:timeout', initiator);
        },

        'server.upload_mission:success'(initiator){
            this.$broadcast('server.upload_mission:success', initiator);
        },

        'server.upload_mission:failure'(initiator){
            this.$broadcast('server.upload_mission:failure', initiator);
        },

        'server.upload_mission:timeout'(initiator){
            this.$broadcast('server.upload_mission:timeout', initiator);
        },

        'server.download_mission:success'(initiator){
            this.$broadcast('server.download_mission:success', initiator);
        },

        'server.download_mission:failure'(initiator){
            this.$broadcast('server.download_mission:failure', initiator);
        },

        'server.download_mission:timeout'(initiator){
            this.$broadcast('server.download_mission:timeout', initiator);
        },

        'server.arm:success'(initiator){
            this.$broadcast('server.arm:success', initiator);
        },

        'server.arm:failure'(initiator){
            this.$broadcast('server.arm:failure', initiator);
        },

        'server.arm:timeout'(initiator){
            this.$broadcast('server.arm:timeout', initiator);
        },

        'server.disarm:success'(initiator){
            this.$broadcast('server.disarm:success', initiator);
        },

        'server.disarm:failure'(initiator){
            this.$broadcast('server.disarm:failure', initiator);
        },

        'server.disarm:timeout'(initiator){
            this.$broadcast('server.disarm:timeout', initiator);
        },

        'server.start_mission:success'(initiator){
            this.$broadcast('server.start_mission:success', initiator);
        },

        'server.start_mission:failure'(initiator){
            this.$broadcast('server.start_mission:failure', initiator);
        },

        'server.start_mission:timeout'(initiator){
            this.$broadcast('server.start_mission:timeout', initiator);
        },

        'server.start_mission:success'(initiator){
            this.$broadcast('server.start_mission:success', initiator);
        },

        'server.start_mission:failure'(initiator){
            this.$broadcast('server.start_mission:failure', initiator);
        },

        'server.start_mission:timeout'(initiator){
            this.$broadcast('server.start_mission:timeout', initiator);
        },

        'server.resume_mission:success'(initiator){
            this.$broadcast('server.resume_mission:success', initiator);
        },

        'server.resume_mission:failure'(initiator){
            this.$broadcast('server.resume_mission:failure', initiator);
        },

        'server.resume_mission:timeout'(initiator){
            this.$broadcast('server.resume_mission:timeout', initiator);
        },

        'server.kill:success'(initiator){
            this.$broadcast('server.kill:success', initiator);
        },

        'server.kill:failure'(initiator){
            this.$broadcast('server.kill:failure', initiator);
        },

        'server.kill:timeout'(initiator){
            this.$broadcast('server.kill:timeout', initiator);
        },

        'server.unkill:success'(initiator){
            this.$broadcast('server.unkill:success', initiator);
        },

        'server.unkill:failure'(initiator){
            this.$broadcast('server.unkill:failure', initiator);
        },

        'server.unkill:timeout'(initiator){
            this.$broadcast('server.unkill:timeout', initiator);
        },
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
        SocketIoManager,
        GcsEditMissionModal
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
