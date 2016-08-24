export function getMap(state) {
    return state.map;
}

export function getMapEl(state) {
    return state.mapEl;
}

export function getMapLoaded(state) {
    return state.mapLoaded;
}

export function getMapEditing(state) {
    return state.mapEditing;
}

export function getWamv(state) {
    return state.wamv;
}

export function getMissions(state) {
    return state.missions;
}

export function getCurrentMission(state) {
    return state.missions[state.currentMissionIndex];
}

export function getCurrentMissionIndex(state) {
    return state.currentMissionIndex;
}

export function getConfig(state) {
    return state.config;
}

export function getSettings(state) {
    return state.settings;
}
