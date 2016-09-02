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
        loaded: false,
        position: {lat: -32.8883338, lng: 151.7075279},
        heading:  0,
        speed:    0,
        battery:  100,
        armed:    false,
        mode:     'idle',
        signal:   100
    },
    config: config,
    settings: config.settings,
    settingsLoaded: false,
    missions: [],
    currentMissionIndex: -1,
    parameters: []
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

    SET_WAMV(state, wamv) {
        state.wamv = wamv;
    },

    SET_WAMV_ARMED(state, armed) {
        state.wamv.armed = armed;
    },

    SET_WAMV_MODE(state, mode) {
        state.wamv.mode = mode;
    },

    INIT_SETTINGS(state, settings) {
        state.settings = settings;
        state.settingsLoaded = true;
    },

    UPDATE_SETTINGS(state, settings) {
        state.settings = settings;
    },

    SET_MISSIONS(state, missions) {
        state.missions = missions;
    },

    SET_CURRENT_MISSION_INDEX(state, index) {
        state.currentMissionIndex = index;
    },

    SET_PARAMETERS(state, parameters) {
        state.parameters = parameters;
    }
};

export default new Vuex.Store({
    state: initialState,
    mutations
});
