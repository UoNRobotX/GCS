import Vue from 'vue';
import Vuex from 'vuex';
import config from 'app/config';

// TODO: get settings from server and add to state

Vue.use(Vuex);

const initialState = {
    map: null,
    mapEl: null,
    mapLoaded: false,
    mapEditing: false,
    wamv: {
        position: {
            lat: -32.8883338,
            lng: 151.7075279
        },
        heading: 0,
        armed: true,
        moving: true,
        speed: 24,
        battery: 1,
        signal: 1
    },
    missions: [],
    currentMissionIndex: -1,
    config: config,
    settings: config.settings,
    settingsLoaded: false
};

const mutations = {
    SET_MAP(state, map) {
        state.map = map;
    },

    SET_MAP_EL(state, mapEl) {
        state.mapEl = mapEl;
    },

    SET_MAP_LOADED(state, loaded) {
        state.mapLoaded = loaded;
    },

    SET_MAP_EDITING(state, editing) {
        state.mapEditing = editing;
    },

    UPDATE_WAMV_POSITION(state, position) {
        state.wamv.position = position;
    },

    SET_WAMV_HEADING(state, heading) {
        state.wamv.heading = heading;
    },

    SET_WAMV_ARMED(state, armed) {
        state.wamv.armed = armed;
    },

    SET_WAMV_MOVING(state, moving) {
        state.wamv.moving = moving;
    },

    SET_WAMV_SPEED(state, speed) {
        state.wamv.speed = speed;
    },

    SET_WAMV_BATTERY(state, battery) {
        state.wamv.battery = battery;
    },

    SET_WAMV_SIGNAL(state, signal) {
        state.wamv.signal = signal;
    },

    SET_MISSIONS(state, missions) {
        state.missions = missions;
    },

    SET_CURRENT_MISSION_INDEX(state, index) {
        state.currentMissionIndex = index;
    },

    INIT_SETTINGS(state, settings) {
        state.settings = settings;
        state.settingsLoaded = true;
    },

    UPDATE_SETTINGS(state, settings) {
        state.settings = settings;
    }
};

export default new Vuex.Store({
    state: initialState,
    mutations
});
