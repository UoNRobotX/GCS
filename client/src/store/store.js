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
    parameters: {},
    messageState: {
        //constants for indicating state
        INITIAL: 0,
        WAITING: 1,
        SUCCESS: 2,
        FAILURE: 3,
        //for a message type T below, T[0] specifies a state, and T[1] specifies data
        //when a component wants to send a message of type T, T[0] is set to WAITING
            //T[1] is set to the request data, if any
        //when a server response is received, T[0] is set to SUCCESS, and T[1] to the response data
            //if the request failed, T[0] is instead set to FAILURE, and T[1] to the failure message
        get_parameters:   [0, null],
        set_parameter:    [0, null],
        save_missions:    [0, null],
        load_missions:    [0, null],
        upload_mission:   [0, null],
        download_mission: [0, null],
        arm:              [0, null],
        disarm:           [0, null],
        start_mission:    [0, null],
        stop_mission:     [0, null],
        resume_mission:   [0, null],
        kill:             [0, null],
        unkill:           [0, null]
    }
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

    SET_CURRENT_MISSION(state, mission) {
        state.missions.$set(state.currentMissionIndex, mission);
    },

    SET_PARAMETERS(state, parameters) {
        state.parameters = parameters;
    },

    SEND_GET_PARAMETERS(state) {
        state.messageState.get_parameters.$set(0, state.messageState.WAITING);
    },

    SUCCEED_GET_PARAMETERS(state, parameters) {
        state.messageState.get_parameters.$set(0, state.messageState.SUCCESS);
        state.messageState.get_parameters.$set(1, parameters);
    },

    FAIL_GET_PARAMETERS(state, msg) {
        state.messageState.get_parameters.$set(0, state.messageState.FAILURE);
        state.messageState.get_parameters.$set(1, msg);
    },

    SEND_SAVE_MISSIONS(state, missions) {
        state.messageState.save_missions.$set(0, state.messageState.WAITING);
        state.messageState.save_missions.$set(1, missions);
    },

    SUCCEED_SAVE_MISSIONS(state) {
        state.messageState.save_missions.$set(0, state.messageState.SUCCESS);
    },

    FAIL_SAVE_MISSIONS(state, msg) {
        state.messageState.save_missions.$set(0, state.messageState.FAILURE);
        state.messageState.save_missions.$set(1, msg);
    },

    SEND_LOAD_MISSIONS(state) {
        state.messageState.load_missions.$set(0, state.messageState.WAITING);
    },

    SUCCEED_LOAD_MISSIONS(state, missions) {
        state.messageState.load_missions.$set(0, state.messageState.SUCCESS);
        state.messageState.load_missions.$set(1, missions);
    },

    FAIL_LOAD_MISSIONS(state, msg) {
        state.messageState.load_missions.$set(0, state.messageState.FAILURE);
        state.messageState.load_missions.$set(1, msg);
    },

    SEND_UPLOAD_MISSION(state, mission) {
        state.messageState.upload_mission.$set(0, state.messageState.WAITING);
        state.messageState.upload_mission.$set(1, mission);
    },

    SUCCEED_UPLOAD_MISSION(state) {
        state.messageState.upload_mission.$set(0, state.messageState.SUCCESS);
    },

    FAIL_UPLOAD_MISSION(state, msg) {
        state.messageState.upload_mission.$set(0, state.messageState.FAILURE);
        state.messageState.upload_mission.$set(1, msg);
    },

    SEND_DOWNLOAD_MISSION(state) {
        state.messageState.download_mission.$set(0, state.messageState.WAITING);
    },

    SUCCEED_DOWNLOAD_MISSION(state, mission) {
        state.messageState.download_mission.$set(0, state.messageState.SUCCESS);
        state.messageState.download_mission.$set(1, mission);
    },

    FAIL_DOWNLOAD_MISSION(state, msg) {
        state.messageState.download_mission.$set(0, state.messageState.FAILURE);
        state.messageState.download_mission.$set(1, msg);
    },

    SEND_START_MISSION(state) {
        state.messageState.start_mission.$set(0, state.messageState.WAITING);
    },

    SUCCEED_START_MISSION(state) {
        state.messageState.start_mission.$set(0, state.messageState.SUCCESS);
    },

    FAIL_START_MISSION(state, msg) {
        state.messageState.start_mission.$set(0, state.messageState.FAILURE);
        state.messageState.start_mission.$set(1, msg);
    },

    SEND_STOP_MISSION(state) {
        state.messageState.stop_mission.$set(0, state.messageState.WAITING);
    },

    SUCCEED_STOP_MISSION(state) {
        state.messageState.stop_mission.$set(0, state.messageState.SUCCESS);
    },

    FAIL_STOP_MISSION(state, msg) {
        state.messageState.stop_mission.$set(0, state.messageState.FAILURE);
        state.messageState.stop_mission.$set(1, msg);
    },

    SEND_RESUME_MISSION(state) {
        state.messageState.resume_mission.$set(0, state.messageState.WAITING);
    },

    SUCCEED_RESUME_MISSION(state) {
        state.messageState.resume_mission.$set(0, state.messageState.SUCCESS);
    },

    FAIL_RESUME_MISSION(state, msg) {
        state.messageState.resume_mission.$set(0, state.messageState.FAILURE);
        state.messageState.resume_mission.$set(1, msg);
    },

    SEND_ARM(state) {
        state.messageState.arm.$set(0, state.messageState.WAITING);
    },

    SUCCEED_ARM(state) {
        state.messageState.arm.$set(0, state.messageState.SUCCESS);
    },

    FAIL_ARM(state, msg) {
        state.messageState.arm.$set(0, state.messageState.FAILURE);
        state.messageState.arm.$set(1, msg);
    },

    SEND_DISARM(state) {
        state.messageState.disarm.$set(0, state.messageState.WAITING);
    },

    SUCCEED_DISARM(state) {
        state.messageState.disarm.$set(0, state.messageState.SUCCESS);
    },

    FAIL_DISARM(state, msg) {
        state.messageState.disarm.$set(0, state.messageState.FAILURE);
        state.messageState.disarm.$set(1, msg);
    },

    SEND_KILL(state) {
        state.messageState.kill.$set(0, state.messageState.WAITING);
    },

    SUCCEED_KILL(state) {
        state.messageState.kill.$set(0, state.messageState.SUCCESS);
    },

    FAIL_KILL(state, msg) {
        state.messageState.kill.$set(0, state.messageState.FAILURE);
        state.messageState.kill.$set(1, msg);
    },

    SEND_UNKILL(state) {
        state.messageState.unkill.$set(0, state.messageState.WAITING);
    },

    SUCCEED_UNKILL(state) {
        state.messageState.unkill.$set(0, state.messageState.SUCCESS);
    },

    FAIL_UNKILL(state, msg) {
        state.messageState.unkill.$set(0, state.messageState.FAILURE);
        state.messageState.unkill.$set(1, msg);
    },
};

export default new Vuex.Store({
    state: initialState,
    mutations
});
