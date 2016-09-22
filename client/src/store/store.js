import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const initialState = {
    map: null,
    mapEl: null,
    mapLoaded: false,
    waypointsVisible: true,
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
    settings: [], //[{title: t1, settings: [{title: t2, value: v1}, ...]}, ...]
    settingsLastUpdateTime: null,
    missions: [],
        //[{
        //    title: t1,
        //    origin: {lat: lat1, lng: lng1},
        //    waypoints: [
        //        {title: t2, type: t3, visible: v1, position: {lat: lat1, lng: lng1}}, ...]
        //}, ...]
    missionsLastUpdateTime: null,
    currentMissionIndex: -1,
    parameters: [],
        //[{
        //    title: t1,
        //    subSections: [{
        //        title: t2,
        //        params: [{title: t3, type: t4, value: v1}, ...]
        //    }, ...]
        //}, ...]
    parametersLastUpdateTime: null
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

    SET_WAYPOINTS_VISIBLE(state, visible) {
        state.waypointsVisible = visible;
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

    SET_SETTINGS(state, settings) {
        state.settingsLastUpdateTime = Date.now();
        state.settings = settings;
    },

    SET_MISSIONS(state, missions) {
        state.missionsLastUpdateTime = Date.now();
        state.missions = missions;
    },

    SET_CURRENT_MISSION_INDEX(state, index) {
        state.currentMissionIndex = index;
    },

    SET_CURRENT_MISSION_TITLE(state, title) {
        state.missions[state.currentMissionIndex].title = title;
    },

    SET_PARAMETERS(state, parameters) {
        state.parametersLastUpdateTime = Date.now();
        state.parameters = parameters;
    }
};

export default new Vuex.Store({
    state: initialState,
    mutations
});
