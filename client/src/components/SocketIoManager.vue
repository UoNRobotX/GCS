<template>
    <div></div>
</template>

<script>
import socket_io_client from 'socket.io-client';

import { getMissions } from 'store/getters';
import { setWamv, setParameters, setMissions } from 'store/actions';

export default {
    vuex: {
        getters: {
            missions: getMissions
        },
        actions: {
            setWamv,
            setParameters,
            setMissions
        }
    },

    data() {
        return {
            socket: null,
            waitTimers: {
                get_parameters:   null,
                set_parameters:   null,
                save_missions:    null,
                load_missions:    null,
                upload_mission:   null,
                download_mission: null,
                arm:              null,
                disarm:           null,
                start_mission:    null,
                stop_mission:     null,
                resume_mission:   null,
                kill:             null,
                unkill:           null
            },
            TIMEOUT: 1000
        };
    },

    ready() {
        //initialise socket
        this.socket = socket_io_client('localhost:3000');
        this.socket.on('connect', () => {
            console.log('connected to server')
            //get parameters once at startup
            this.sendGetParameters();
            //load missions once at startup
            this.sendLoadMissions();
        });
        this.socket.on('disconnect', () => {
            console.log('disconnected from server');
        });
        this.socket.on('status', (data) => {
            //console.log('received "status" message');
            data.loaded = true;
            this.setWamv(data);
        });
        this.socket.on('get_parameters', (data) => {
            clearTimeout(this.waitTimers.get_parameters);
            if (this.waitTimers.get_parameters != null){
                this.waitTimers.get_parameters = null;
                this.setParameters(data);
                console.log('Parameters loaded.');
                this.$dispatch('server::get_parameters:success');
            }
        });
        this.socket.on('load_missions', (data) => {
            clearTimeout(this.waitTimers.load_missions);
            if (this.waitTimers.load_missions != null){
                this.waitTimers.load_missions = null;
                this.setMissions(data);
                console.log('Missions loaded.');
                this.$dispatch('server::load_missions:success');
            }
        });
        this.socket.on('download_mission', (data) => {
            clearTimeout(this.waitTimers.download_mission);
            if (this.waitTimers.download_mission != null){
                this.waitTimers.download_mission = null;
                this.missions.push(data);
                console.log('Mission downloaded.');
                this.$dispatch('server::download_mission:success');
            }
        });
        this.socket.on('success', (data) => {
            console.log('received "success" message');
            switch (data){
                case 'set_parameters': {
                    clearTimeout(this.waitTimers.set_parameters);
                    if (this.waitTimers.set_parameters != null){
                        this.waitTimers.set_parameters = null;
                        console.log('Parameters set.');
                        this.$dispatch('server::set_parameters:success');
                    }
                    break;
                }
                case 'save_missions': {
                    clearTimeout(this.waitTimers.save_missions);
                    if (this.waitTimers.save_missions != null){
                        this.waitTimers.save_missions = null;
                        console.log('Missions saved.');
                        this.$dispatch('server::save_missions:success');
                    }
                    break;
                }
                case 'upload_mission': {
                    clearTimeout(this.waitTimers.upload_mission);
                    if (this.waitTimers.upload_mission != null){
                        this.waitTimers.upload_mission = null;
                        console.log('Mission uploaded.');
                        this.$dispatch('server::upload_mission:success');
                    }
                    break;
                }
                case 'arm': {
                    clearTimeout(this.waitTimers.arm);
                    if (this.waitTimers.arm != null){
                        this.waitTimers.arm = null;
                        console.log('Vehicle armed.');
                        this.$dispatch('server::arm:success');
                    }
                    break;
                }
                case 'disarm': {
                    clearTimeout(this.waitTimers.disarm);
                    if (this.waitTimers.disarm != null){
                        this.waitTimers.disarm = null;
                        console.log('Vehicle disarmed.');
                        this.$dispatch('server::disarm:success');
                    }
                    break;
                }
                case 'start_mission': {
                    clearTimeout(this.waitTimers.start_mission);
                    if (this.waitTimers.start_mission != null){
                        this.waitTimers.start_mission = null;
                        console.log('Mission started.');
                        this.$dispatch('server::start_mission:success');
                    }
                    break;
                }
                case 'stop_mission': {
                    clearTimeout(this.waitTimers.stop_mission);
                    if (this.waitTimers.stop_mission != null){
                        this.waitTimers.stop_mission = null;
                        console.log('Mission stopped.');
                        this.$dispatch('server::stop_mission:success');
                    }
                    break;
                }
                case 'resume_mission': {
                    clearTimeout(this.waitTimers.resume_mission);
                    if (this.waitTimers.resume_mission != null){
                        this.waitTimers.resume_mission = null;
                        console.log('Mission resumed.');
                        this.$dispatch('server::resume_mission:success');
                    }
                    break;
                }
                case 'kill': {
                    clearTimeout(this.waitTimers.kill);
                    if (this.waitTimers.kill != null){
                        this.waitTimers.kill = null;
                        console.log('Kill switch activated.');
                        this.$dispatch('server::kill:success');
                    }
                    break;
                }
                case 'unkill': {
                    clearTimeout(this.waitTimers.unkill);
                    if (this.waitTimers.unkill != null){
                        this.waitTimers.unkill = null;
                        console.log('Kill switch deactivated.');
                        this.$dispatch('server::unkill:success');
                    }
                    break;
                }
            }
        });
        this.socket.on('failure', (data) => {
            console.log('received "failure" message');
            switch (data[0]){
                case 'get_parameters': {
                    clearTimeout(this.waitTimers.get_parameters);
                    if (this.waitTimers.get_parameters != null){
                        this.waitTimers.get_parameters = null;
                        console.log('Could not load parameters: ' + data[1]);
                        this.$dispatch('server::get_parameters:failure');
                    }
                    break;
                }
                case 'set_parameters': {
                    clearTimeout(this.waitTimers.set_parameters);
                    if (this.waitTimers.set_parameters != null){
                        this.waitTimers.set_parameters = null;
                        console.log('Could not set parameters: ' + data[1]);
                        this.$dispatch('server::set_parameters:failure');
                    }
                    break;
                }
                case 'save_missions': {
                    clearTimeout(this.waitTimers.save_missions);
                    if (this.waitTimers.save_missions != null){
                        this.waitTimers.save_missions = null;
                        console.log('Could not save missions: ' + data[1]);
                        this.$dispatch('server::save_missions:failure');
                    }
                    break;
                }
                case 'load_missions': {
                    clearTimeout(this.waitTimers.load_missions);
                    if (this.waitTimers.load_missions != null){
                        this.waitTimers.load_missions = null;
                        console.log('Could not load missions: ' + data[1]);
                        this.$dispatch('server::load_missions:failure');
                    }
                    break;
                }
                case 'upload_mission': {
                    clearTimeout(this.waitTimers.upload_mission);
                    if (this.waitTimers.upload_mission != null){
                        this.waitTimers.upload_mission = null;
                        console.log('Could not upload mission: ' + data[1]);
                        this.$dispatch('server::upload_mission:failure');
                    }
                    break;
                }
                case 'download_mission': {
                    clearTimeout(this.waitTimers.download_mission);
                    if (this.waitTimers.download_mission != null){
                        this.waitTimers.download_mission = null;
                        console.log('Could not download mission: ' + data[1]);
                        this.$dispatch('server::download_mission:failure');
                    }
                    break;
                }
                case 'arm': {
                    clearTimeout(this.waitTimers.arm);
                    if (this.waitTimers.arm != null){
                        this.waitTimers.arm = null;
                        console.log('Could not arm vehicle: ' + data[1]);
                        this.$dispatch('server::arm:failure');
                    }
                    break;
                }
                case 'disarm': {
                    clearTimeout(this.waitTimers.disarm);
                    if (this.waitTimers.disarm != null){
                        this.waitTimers.disarm = null;
                        console.log('Could not disarm vehicle: ' + data[1]);
                        this.$dispatch('server::disarm:failure');
                    }
                    break;
                }
                case 'start_mission': {
                    clearTimeout(this.waitTimers.start_mission);
                    if (this.waitTimers.start_mission != null){
                        this.waitTimers.start_mission = null;
                        console.log('Could not start mission: ' + data[1]);
                        this.$dispatch('server::start_mission:failure');
                    }
                    break;
                }
                case 'stop_mission': {
                    clearTimeout(this.waitTimers.stop_mission);
                    if (this.waitTimers.stop_mission != null){
                        this.waitTimers.stop_mission = null;
                        console.log('Could not stop mission: ' + data[1]);
                        this.$dispatch('server::stop_mission:failure');
                    }
                    break;
                }
                case 'resume_mission': {
                    clearTimeout(this.waitTimers.resume_mission);
                    if (this.waitTimers.resume_mission != null){
                        this.waitTimers.resume_mission = null;
                        console.log('Could not resume mission: ' + data[1]);
                        this.$dispatch('server::resume_mission:failure');
                    }
                    break;
                }
                case 'kill': {
                    clearTimeout(this.waitTimers.kill);
                    if (this.waitTimers.kill != null){
                        this.waitTimers.kill = null;
                        console.log('Could not activate kill switch: ' + data[1]);
                        this.$dispatch('server::kill:failure');
                    }
                    break;
                }
                case 'unkill': {
                    clearTimeout(this.waitTimers.unkill);
                    if (this.waitTimers.unkill != null){
                        this.waitTimers.unkill = null;
                        console.log('Could not deactivate kill switch: ' + data[1]);
                        this.$dispatch('server::unkill:failure');
                    }
                    break;
                }
            }
        });
        this.socket.on('attention', (data) => {
            console.log('Attention: ' + data);
        });
    },
    
    methods: {
        sendGetParameters(){
            if (this.waitTimers.get_parameters == null){
                this.socket.emit('get_parameters');
                this.waitTimers.get_parameters = setTimeout(() => {
                    this.waitTimers.get_parameters = null;
                    console.log('Unable to get parameters: timeout reached.');
                    this.$dispatch('server::get_parameters:timeout');
                }, this.TIMEOUT);
            }
        },
        sendSetParameters(parameterSettings){
            if (this.waitTimers.set_parameters == null){
                this.socket.emit('set_parameters', parameterSettings);
                this.waitTimers.set_parameters = setTimeout(() => {
                    this.waitTimers.set_parameters = null;
                    console.log('Unable to set parameters: timeout reached.');
                    this.$dispatch('server::set_parameters:timeout');
                }, this.TIMEOUT);
            }
        },
        sendSaveMissions(missions){
            if (this.waitTimers.save_missions == null){
                this.socket.emit('save_missions', missions);
                this.waitTimers.save_missions = setTimeout(() => {
                    this.waitTimers.save_missions = null;
                    console.log('Unable to save missions: timeout reached.');
                    this.$dispatch('server::save_missions:timeout');
                }, this.TIMEOUT);
            }
        },
        sendLoadMissions(){
            if (this.waitTimers.load_missions == null){
                this.socket.emit('load_missions');
                this.waitTimers.load_missions = setTimeout(() => {
                    this.waitTimers.load_missions = null;
                    console.log('Unable to load missions: timeout reached.');
                    this.$dispatch('server::load_missions:timeout');
                }, this.TIMEOUT);
            }
        },
        sendUploadMission(mission){
            if (this.waitTimers.upload_mission == null){
                this.socket.emit('upload_mission', mission);
                this.waitTimers.upload_mission = setTimeout(() => {
                    this.waitTimers.upload_mission = null;
                    console.log('Unable to upload mission: timeout reached.');
                    this.$dispatch('server::upload_mission:timeout');
                }, this.TIMEOUT);
            }
        },
        sendDownloadMission(){
            if (this.waitTimers.download_mission == null){
                this.socket.emit('download_mission');
                this.waitTimers.download_mission = setTimeout(() => {
                    this.waitTimers.download_mission = null;
                    console.log('Unable to download mission: timeout reached.');
                    this.$dispatch('server::download_mission:timeout');
                }, this.TIMEOUT);
            }
        },
        sendArm(){
            if (this.waitTimers.arm == null){
                this.socket.emit('arm');
                this.waitTimers.arm = setTimeout(() => {
                    this.waitTimers.arm = null;
                    console.log('Unable to arm vehicle: timeout reached.');
                    this.$dispatch('server::arm:timeout');
                }, this.TIMEOUT);
            }
        },
        sendDisarm(){
            if (this.waitTimers.disarm == null){
                this.socket.emit('disarm');
                this.waitTimers.disarm = setTimeout(() => {
                    this.waitTimers.disarm = null;
                    console.log('Unable to disarm vehicle: timeout reached.');
                    this.$dispatch('server::disarm:timeout');
                }, this.TIMEOUT);
            }
        },
        sendStartMission(){
            if (this.waitTimers.start_mission == null){
                this.socket.emit('start_mission');
                this.waitTimers.start_mission = setTimeout(() => {
                    this.waitTimers.start_mission = null;
                    console.log('Unable to start mission: timeout reached.');
                    this.$dispatch('server::start_mission:timeout');
                }, this.TIMEOUT);
            }
        },
        sendStopMission(){
            if (this.waitTimers.stop_mission == null){
                this.socket.emit('stop_mission');
                this.waitTimers.stop_mission = setTimeout(() => {
                    this.waitTimers.stop_mission = null;
                    console.log('Unable to stop mission: timeout reached.');
                    this.$dispatch('server::stop_mission:timeout');
                }, this.TIMEOUT);
            }
        },
        sendResumeMission(){
            if (this.waitTimers.resume_mission == null){
                this.socket.emit('resume_mission');
                this.waitTimers.resume_mission = setTimeout(() => {
                    this.waitTimers.resume_mission = null;
                    console.log('Unable to resume mission: timeout reached.');
                    this.$dispatch('server::resume_mission:timeout');
                }, this.TIMEOUT);
            }
        },
        sendKill(){
            if (this.waitTimers.kill == null){
                this.socket.emit('kill');
                this.waitTimers.kill = setTimeout(() => {
                    this.waitTimers.kill = null;
                    console.log('Unable to activate kill switch: timeout reached.');
                    this.$dispatch('server::kill:timeout');
                }, this.TIMEOUT);
            }
        },
        sendUnkill(){
            if (this.waitTimers.unkill == null){
                this.socket.emit('unkill');
                this.waitTimers.unkill = setTimeout(() => {
                    this.waitTimers.unkill = null;
                    console.log('Unable to deactivate kill switch: timeout reached.');
                    this.$dispatch('server::unkill:timeout');
                }, this.TIMEOUT);
            }
        }
    },
    
    events: {
        'client::get_parameters'() {
            this.sendGetParameters();
        },
        'client::set_parameters'(parameterSettings) {
            this.sendSetParameters(parameterSettings);
        },
        'client::save_missions'(missions) {
            this.sendSaveMissions(missions);
        },
        'client::load_missions'() {
            this.sendLoadMissions();
        },
        'client::upload_mission'(mission) {
            this.sendUploadMission(mission);
        },
        'client::download_mission'() {
            this.sendDownloadMission();
        },
        'client::arm'() {
            this.sendArm();
        },
        'client::disarm'() {
            this.sendDisarm();
        },
        'client::start_mission'() {
            this.sendStartMission();
        },
        'client::stop_mission'() {
            this.sendStopMission();
        },
        'client::resume_mission'() {
            this.sendResumeMission();
        },
        'client::kill'() {
            this.sendKill();
        },
        'client::unkill'() {
            this.sendUnkill();
        }
    }
}
</script>

<style lang="stylus">
@import '~styles/main';
</style>
