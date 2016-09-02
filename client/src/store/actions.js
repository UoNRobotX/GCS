import assign from 'deep-assign';

/**
 * Set the Google Maps instance
 */
export function setMap({ dispatch, state }, map) {
    dispatch('SET_MAP', map);
}

/**
 * Set the element the map is rendered into
 */
export function setMapEl({ dispatch, state }, mapEl) {
    dispatch('SET_MAP_EL', mapEl);
}

/**
 * Set the map loaded flag
 */
export function setMapLoaded({ dispatch, state }, loaded) {
    dispatch('SET_MAP_LOADED', loaded);
}

/**
 * Set the editing flag
 */
export function setMapEditing({ dispatch, state }, editing) {
    dispatch('SET_MAP_EDITING', editing);
}

/**
 * Set the WamV
 */
export function setWamv({ dispatch, state }, wamv) {
    dispatch('SET_WAMV', wamv);
}

/**
 * Set the WamV armed
 */
export function setWamvArmed({ dispatch, state }, armed) {
    dispatch('SET_WAMV_ARMED', armed);
}

/**
 * Set the WamV moving
 */
export function setWamvMode({ dispatch, state }, mode) {
    dispatch('SET_WAMV_MODE', mode);
}

/**
 * Initialize the app settings and set it on the global
 * state
 */
export function initSettings({ dispatch }) {
    // TODO: fetch settings for server
    //
    // api.settings.init()
    //     .then(function(settings) {
    //         dispatch('INIT_SETTINGS', clean(settings));
    //     })
    //     .catch(function(error) {
    //         console.error('[store/actions]: Error fetching settings', error);
    //     });
}

/**
 * Update a setting on the server and on the global state
 *
 * @param  {String} key - The key of the setting to update
 * @param  {*} value    - The new value for the setting
 */
export function updateSetting({ dispatch, state }, key, value) {
    let settings = assign({}, state.settings);
    settings[key] = value;

    dispatch('UPDATE_SETTINGS', settings);

    // send to server
}

/**
 * Set the missions
 */
export function setMissions({ dispatch, state }, missions) {
    dispatch('SET_MISSIONS', missions);
}

/**
 * Set the current mission index
 */
export function setCurrentMissionIndex({ dispatch, state }, index) {
    dispatch('SET_CURRENT_MISSION_INDEX', index);
}

/**
 * Set the parameters
 */
export function setParameters({ dispatch, state }, parameters) {
    dispatch('SET_PARAMETERS', parameters);
}

/**
 * Send get_parameters message
 */
export function sendGetParameters({ dispatch, state }) {
    dispatch('SEND_GET_PARAMETERS');
}

/**
 * Indicate a successful response to a get_parameters message
 */
export function succeedGetParameters({ dispatch, state }, parameters) {
    dispatch('SUCCEED_GET_PARAMETERS', parameters);
}

/**
 * Indicate failure of a get_parameters message
 */
export function failGetParameters({ dispatch, state }, msg) {
    dispatch('FAIL_GET_PARAMETERS', msg);
}

/**
 * Send set_parameters message
 */
export function sendSetParameters({ dispatch, state }, parameterSettings) {
    dispatch('SEND_SET_PARAMETERS', parameterSettings);
}

/**
 * Indicate a successful response to a set_parameters message
 */
export function succeedSetParameters({ dispatch, state }) {
    dispatch('SUCCEED_SET_PARAMETERS');
}

/**
 * Indicate failure of a set_parameters message
 */
export function failSetParameters({ dispatch, state }, msg) {
    dispatch('FAIL_SET_PARAMETERS', msg);
}

/**
 * Send save_missions message
 */
export function sendSaveMissions({ dispatch, state }, missions) {
    dispatch('SEND_SAVE_MISSIONS', missions);
}

/**
 * Indicate a successful response to a save_missions message
 */
export function succeedSaveMissions({ dispatch, state }) {
    dispatch('SUCCEED_SAVE_MISSIONS');
}

/**
 * Indicate failure of a save_missions message
 */
export function failSaveMissions({ dispatch, state }, msg) {
    dispatch('FAIL_SAVE_MISSIONS', msg);
}

/**
 * Send load_missions message
 */
export function sendLoadMissions({ dispatch, state }) {
    dispatch('SEND_LOAD_MISSIONS');
}

/**
 * Indicate a successful response to a load_missions message
 */
export function succeedLoadMissions({ dispatch, state }, missions) {
    dispatch('SUCCEED_LOAD_MISSIONS', missions);
}

/**
 * Indicate failure of a load_missions message
 */
export function failLoadMissions({ dispatch, state }, msg) {
    dispatch('FAIL_LOAD_MISSIONS', msg);
}

/**
 * Send upload_mission message
 */
export function sendUploadMission({ dispatch, state }, mission) {
    dispatch('SEND_UPLOAD_MISSION', mission);
}

/**
 * Indicate a successful response to a upload_mission message
 */
export function succeedUploadMission({ dispatch, state }) {
    dispatch('SUCCEED_UPLOAD_MISSION');
}

/**
 * Indicate failure of a upload_mission message
 */
export function failUploadMission({ dispatch, state }, msg) {
    dispatch('FAIL_UPLOAD_MISSION', msg);
}

/**
 * Send download_mission message
 */
export function sendDownloadMission({ dispatch, state }) {
    dispatch('SEND_DOWNLOAD_MISSION');
}

/**
 * Indicate a successful response to a download_mission message
 */
export function succeedDownloadMission({ dispatch, state }, mission) {
    dispatch('SUCCEED_DOWNLOAD_MISSION', mission);
}

/**
 * Indicate failure of a download_mission message
 */
export function failDownloadMission({ dispatch, state }, msg) {
    dispatch('FAIL_DOWNLOAD_MISSION', msg);
}

/**
 * Send start_mission message
 */
export function sendStartMission({ dispatch, state }) {
    dispatch('SEND_START_MISSION');
}

/**
 * Indicate a successful response to a start_mission message
 */
export function succeedStartMission({ dispatch, state }) {
    dispatch('SUCCEED_START_MISSION');
}

/**
 * Indicate failure of a start_mission message
 */
export function failStartMission({ dispatch, state }, msg) {
    dispatch('FAIL_START_MISSION', msg);
}

/**
 * Send stop_mission message
 */
export function sendStopMission({ dispatch, state }) {
    dispatch('SEND_STOP_MISSION');
}

/**
 * Indicate a successful response to a stop_mission message
 */
export function succeedStopMission({ dispatch, state }) {
    dispatch('SUCCEED_STOP_MISSION');
}

/**
 * Indicate failure of a stop_mission message
 */
export function failStopMission({ dispatch, state }, msg) {
    dispatch('FAIL_STOP_MISSION', msg);
}

/**
 * Send resume_mission message
 */
export function sendResumeMission({ dispatch, state }) {
    dispatch('SEND_RESUME_MISSION');
}

/**
 * Indicate a successful response to a resume_mission message
 */
export function succeedResumeMission({ dispatch, state }) {
    dispatch('SUCCEED_RESUME_MISSION');
}

/**
 * Indicate failure of a resume_mission message
 */
export function failResumeMission({ dispatch, state }, msg) {
    dispatch('FAIL_RESUME_MISSION', msg);
}

/**
 * Send arm message
 */
export function sendArm({ dispatch, state }) {
    dispatch('SEND_ARM');
}

/**
 * Indicate a successful response to an arm message
 */
export function succeedArm({ dispatch, state }) {
    dispatch('SUCCEED_ARM');
}

/**
 * Indicate failure of an arm message
 */
export function failArm({ dispatch, state }, msg) {
    dispatch('FAIL_ARM', msg);
}

/**
 * Send disarm message
 */
export function sendDisarm({ dispatch, state }) {
    dispatch('SEND_DISARM');
}

/**
 * Indicate a successful response to a disarm message
 */
export function succeedDisarm({ dispatch, state }) {
    dispatch('SUCCEED_DISARM');
}

/**
 * Indicate failure of a disarm message
 */
export function failDisarm({ dispatch, state }, msg) {
    dispatch('FAIL_DISARM', msg);
}

/**
 * Send kill message
 */
export function sendKill({ dispatch, state }) {
    dispatch('SEND_KILL');
}

/**
 * Indicate a successful response to a kill message
 */
export function succeedKill({ dispatch, state }) {
    dispatch('SUCCEED_KILL');
}

/**
 * Indicate failure of a kill message
 */
export function failKill({ dispatch, state }, msg) {
    dispatch('FAIL_KILL', msg);
}

/**
 * Send unkill message
 */
export function sendUnkill({ dispatch, state }) {
    dispatch('SEND_UNKILL');
}

/**
 * Indicate a successful response to a unkill message
 */
export function succeedUnkill({ dispatch, state }) {
    dispatch('SUCCEED_UNKILL');
}

/**
 * Indicate failure of a unkill message
 */
export function failUnkill({ dispatch, state }, msg) {
    dispatch('FAIL_UNKILL', msg);
}
