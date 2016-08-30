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

export function getCurrentMission(state) {
    return state.missions[state.currentMissionIndex];
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

export function getUploadMissionState(state) {
    return state.messageState.upload_mission[0];
}

export function getUploadMissionData(state) {
    return state.messageState.upload_mission[1];
}

export function getDownloadMissionState(state) {
    return state.messageState.download_mission[0];
}

export function getDownloadMissionData(state) {
    return state.messageState.download_mission[1];
}

export function getStartMissionState(state) {
    return state.messageState.start_mission[0];
}

export function getStartMissionData(state) {
    return state.messageState.start_mission[1];
}

export function getStopMissionState(state) {
    return state.messageState.stop_mission[0];
}

export function getStopMissionData(state) {
    return state.messageState.stop_mission[1];
}

export function getResumeMissionState(state) {
    return state.messageState.resume_mission[0];
}

export function getResumeMissionData(state) {
    return state.messageState.resume_mission[1];
}

export function getArmState(state) {
    return state.messageState.arm[0];
}

export function getArmData(state) {
    return state.messageState.arm[1];
}

export function getDisarmState(state) {
    return state.messageState.disarm[0];
}

export function getDisarmData(state) {
    return state.messageState.disarm[1];
}
