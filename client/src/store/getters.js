export function getMap(state) {
    return state.map;
}

export function getMapEl(state) {
    return state.mapEl;
}

export function getMapLoaded(state) {
    return state.mapLoaded;
}

export function getWayPointsVisible(state){
    return state.waypointsVisible;
}

export function getMapEditing(state) {
    return state.mapLoaded && state.wamv.mode != 'auto' && state.waypointsVisible;
}

export function getWamv(state) {
    return state.wamv;
}

export function getSettings(state) {
    return state.settings;
}

export function getSettingsLastUpdateTime(state) {
    return state.settingsLastUpdateTime;
}

export function getMissions(state) {
    return state.missions;
}

export function getMissionsLastUpdateTime(state) {
    return state.missionsLastUpdateTime;
}

export function getCurrentMissionIndex(state) {
    return state.currentMissionIndex;
}

export function getCurrentMission(state) {
    return state.missions[state.currentMissionIndex];
}

export function getParameters(state) {
    return state.parameters;
}

export function getParametersLastUpdateTime(state) {
    return state.parametersLastUpdateTime;
}
