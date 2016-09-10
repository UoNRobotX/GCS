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

        'client::set_missions'(missions, initiator) {
            this.$broadcast('client::set_missions', missions, initiator);
        },

        'client::get_missions'(initiator) {
            this.$broadcast('client::get_missions', initiator);
        },

        'client::set_mission'(mission, initiator) {
            this.$broadcast('client::set_mission', mission, initiator);
        },

        'client::get_mission'(initiator) {
            this.$broadcast('client::get_mission', initiator);
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

        'server.get_parameters:failure'(msg, initiator){
            this.$broadcast('server.get_parameters:failure', msg, initiator);
        },

        'server.set_parameters:success'(initiator){
            this.$broadcast('server.set_parameters:success', initiator);
        },

        'server.set_parameters:failure'(msg, initiator){
            this.$broadcast('server.set_parameters:failure', msg, initiator);
        },

        'server.get_settings:success'(initiator){
            this.$broadcast('server.get_settings:success', initiator);
        },

        'server.get_settings:failure'(msg, initiator){
            this.$broadcast('server.get_settings:failure', msg, initiator);
        },

        'server.set_settings:success'(initiator){
            this.$broadcast('server.set_settings:success', initiator);
        },

        'server.set_settings:failure'(msg, initiator){
            this.$broadcast('server.set_settings:failure', msg, initiator);
        },

        'server.set_missions:success'(initiator){
            this.$broadcast('server.set_missions:success', initiator);
        },

        'server.set_missions:failure'(msg, initiator){
            this.$broadcast('server.set_missions:failure', msg, initiator);
        },

        'server.get_missions:success'(initiator){
            this.$broadcast('server.get_missions:success', initiator);
        },

        'server.get_missions:failure'(msg, initiator){
            this.$broadcast('server.get_missions:failure', msg, initiator);
        },

        'server.set_mission:success'(initiator){
            this.$broadcast('server.set_mission:success', initiator);
        },

        'server.set_mission:failure'(msg, initiator){
            this.$broadcast('server.set_mission:failure', msg, initiator);
        },

        'server.get_mission:success'(initiator){
            this.$broadcast('server.get_mission:success', initiator);
        },

        'server.get_mission:failure'(msg, initiator){
            this.$broadcast('server.get_mission:failure', msg, initiator);
        },

        'server.arm:success'(initiator){
            this.$broadcast('server.arm:success', initiator);
        },

        'server.arm:failure'(msg, initiator){
            this.$broadcast('server.arm:failure', msg, initiator);
        },

        'server.disarm:success'(initiator){
            this.$broadcast('server.disarm:success', initiator);
        },

        'server.disarm:failure'(msg, initiator){
            this.$broadcast('server.disarm:failure', msg, initiator);
        },

        'server.start_mission:success'(initiator){
            this.$broadcast('server.start_mission:success', initiator);
        },

        'server.start_mission:failure'(msg, initiator){
            this.$broadcast('server.start_mission:failure', msg, initiator);
        },

        'server.stop_mission:success'(initiator){
            this.$broadcast('server.stop_mission:success', initiator);
        },

        'server.stop_mission:failure'(msg, initiator){
            this.$broadcast('server.stop_mission:failure', msg, initiator);
        },

        'server.resume_mission:success'(initiator){
            this.$broadcast('server.resume_mission:success', initiator);
        },

        'server.resume_mission:failure'(msg, initiator){
            this.$broadcast('server.resume_mission:failure', msg, initiator);
        },

        'server.kill:success'(initiator){
            this.$broadcast('server.kill:success', initiator);
        },

        'server.kill:failure'(msg, initiator){
            this.$broadcast('server.kill:failure', msg, initiator);
        },

        'server.unkill:success'(initiator){
            this.$broadcast('server.unkill:success', initiator);
        },

        'server.unkill:failure'(msg, initiator){
            this.$broadcast('server.unkill:failure', msg, initiator);
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
        GcsIndicators,
        SocketIoManager,
        GcsEditMissionModal
    }
};
</script>

<style lang="stylus">
@import '~styles/main';
</style>
