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
 * Set the flag indicating whether waypoints are visible
 */
export function setWaypointsVisible({ dispatch, state }, visible) {
    dispatch('SET_WAYPOINTS_VISIBLE', visible);
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
