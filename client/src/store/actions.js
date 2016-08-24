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
 * Set the WamV position
 */
export function updateWamvPosition({ dispatch, state }, position) {
    let newPosition = assign({}, state.wamv.position, position);

    dispatch('UPDATE_WAMV_POSITION', newPosition);
}

/**
 * Set the WamV heading
 */
export function setWamvHeading({ dispatch, state }, heading) {
    dispatch('SET_WAMV_HEADING', heading);
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
export function setWamvMoving({ dispatch, state }, moving) {
    dispatch('SET_WAMV_MOVING', moving);
}

/**
 * Set the WamV speed
 */
export function setWamvSpeed({ dispatch, state }, speed) {
    dispatch('SET_WAMV_SPEED', speed);
}

/**
 * Set the WamV battery
 */
export function setWamvBattery({ dispatch, state }, battery) {
    dispatch('SET_WAMV_BATTERY', battery);
}

/**
 * Set the WamV signal
 */
export function setWamvSignal({ dispatch, state }, signal) {
    dispatch('SET_WAMV_SIGNAL', signal);
}

/**
 * Set the list of missions
 */
export function setMissions({ dispatch, state }, missions) {
    dispatch('SET_MISSIONS', missions);
}

/**
 * Set the the current mission index
 */
export function setCurrentMissionIndex({ dispatch, state }, index) {
    dispatch('SET_CURRENT_MISSION_INDEX', index);
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
