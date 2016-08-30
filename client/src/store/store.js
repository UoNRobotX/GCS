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
    wamv: null,
    config: config,
    settings: config.settings,
    settingsLoaded: false,
    missions: [
        {
            title: 'Mission 1',
            description: null,
            waypoints: []
        }, {
            title: 'Mission 2',
            description: 'A special description for this mission',
            waypoints: []
        }, {
            title: 'Mission 3',
            description: null,
            waypoints: [{
                title: null,
                type: 'normal',
                visible: true,
                position: {
                    lat: -32.8882,
                    lng: 151.7080
                }
            }, {
                title: null,
                type: 'normal',
                visible: true,
                position: {
                    lat: -32.888091,
                    lng: 151.7066267
                }
            }]
        }
    ],
    currentMissionIndex: -1,
    parameters: {}
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
    },
};

export default new Vuex.Store({
    state: initialState,
    mutations
});
