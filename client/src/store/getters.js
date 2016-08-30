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

export function getConfig(state) {
    return state.config;
}

export function getSettings(state) {
    return state.settings;
}

export function getMissions(state) {
    return state.missions;
}

export function getCurrentMissionIndex(state) {
    return state.currentMissionIndex;
}

export function getParameters(state) {
    return state.parameters;
}

export function getMessageStateWaiting(state) {
    return state.messageState.WAITING;
}

export function getMessageStateSuccess(state) {
    return state.messageState.SUCCESS;
}

export function getMessageStateFailure(state) {
    return state.messageState.FAILURE;
}

export function getGetParameterState(state) {
    return state.messageState.get_parameters[0];
}

export function getGetParameterData(state) {
    return state.messageState.get_parameters[1];
}

export function getSaveMissionsState(state) {
    return state.messageState.save_missions[0];
}

export function getSaveMissionsData(state) {
    return state.messageState.save_missions[1];
}

export function getLoadMissionsState(state) {
    return state.messageState.load_missions[0];
}

export function getLoadMissionsData(state) {
    return state.messageState.load_missions[1];
}
