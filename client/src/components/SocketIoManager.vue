<template>
    <div></div>
</template>

<script>
import socket_io_client from 'socket.io-client';

import { setWamv, setParameters } from 'store/actions';

export default {
    vuex: {
        actions: {
            setWamv: setWamv,
            setParameters: setParameters
        }
    },

    data() {
        return {
            socket: null //used for socket.io connection
        };
    },

    ready() {
        //initialise socket
        this.socket = socket_io_client('localhost:3000');
        this.socket.on('connect', () => {
            console.log('connected to server')
            //get parameters once at startup
            this.socket.emit('get_parameters');
        });
        this.socket.on('disconnect', () => {
            console.log('disconnected from server');
        });
        this.socket.on('status', (data) => {
            console.log('received "status" message:');
            this.setWamv(data);
        });
        this.socket.on('get_parameters', (data) => {
            console.log('received "get_parameters" message:');
            this.setParameters(data);
        });
        this.socket.on('load_missions', (data) => {
            console.log('received "load_missions" message:');
            console.log(data);
        });
        this.socket.on('download_mission', (data) => {
            console.log('received "download_mission" message:');
            console.log(data);
        });
        this.socket.on('success', (data) => {
            console.log('received "success" message');
        });
        this.socket.on('failure', (data) => {
            console.log('received "failure" message');
            console.log(data);
        });
        this.socket.on('attention', (data) => {
            console.log('received "attention" message');
            console.log(data);
        });
    },
}
</script>

<style lang="stylus">
@import '~styles/main';
</style>
