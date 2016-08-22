var http = require('http');
var koa = require('koa');
var path = require('path');
var openUrl = require('openurl');
var serve = require('koa-static');
var socket_io = require('socket.io');
var Vehicle = require('./js/vehicle.js');

var app = koa();

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

var server = http.createServer(app.callback());

/*
 *  Message protocol: (This is just for testing. The real protocol will be different.)
 *  Each socket.io message will have one of these types:
 *      - 'status'           -> to client, contains vehicle location, heading, etc
 *      - 'upload_mission'   -> to server, contains a mission the vehicle is to use
 *      - 'download_mission' -> to server/client, requests/contains the vehicle's current mission
 *      - 'arm'              -> to server, requests that the vehicle arm itself
 *      - 'disarm'           -> to server, requests that the vehicle disarm itself
 *      - 'start_mission'    -> to server, requests that the vehicle begin its mission
 *      - 'stop_mission'     -> to server, requests that the vehicle stop its mission
 *      - 'pause_mission'    -> to server, requests that the vehicle pause its mission
 *      - 'resume_mission'   -> to server, requests that the vehicle resume its mission
 *      - 'command_ack'      -> to client, indicates that the last command was received
 *      - 'error'            -> to client, indicates that the last command was invalid
 *  The data for each type is as follows:
 *      - For 'status', the data has this form: {
 *                location: {lat: lat1, lng: lng1},
 *                heading:  degrees1,
 *                speed:    metersPerSec1,
 *                battery:  percentage1,
 *                armed:    boolean1,
 *                mode:     mode1, //this will be one of: 'idle', 'auto', 'paused',
 *            }
 *     - For 'upload_mission', the data is an array of objects
 *         Each object specifies a waypoint, and has this form:
 *             {lat: lat1, lng: lng1}
 *     - For 'download_mission':
 *         If sent from the client, the data is null.
 *         If sent from the server, the data is an array of waypoints, like with 'upload_mission'
 *     - For 'error', the data is an error message string
 *     - For other types, the data is null
 */

//use socket.io to periodically send WAM-V data
var io = socket_io(server);
io.on('connection', function(socket){
    var timer = null; //used for testing
    //when a connection is opened, print a message
    var host = socket.client.request.headers.host;
    console.log('connected to: ' + host);
    //when a connection closes, print a message
    socket.on('disconnect', function(){
        clearInterval(timer);
        console.log('disconnected from: ' + host);
    });
    //periodically send vehicle status information
    var timer = setInterval(function(){
        var data = Vehicle.getStatusData();
        socket.volatile.emit('status', data); //'volatile' allows the message to be dropped
        console.log('sent status message to: ' + host);
    }, 3000);
    //handle other messages
    socket.on('upload_mission', function(){
        console.log('got "upload mission" message');
    });
    socket.on('download_mission', function(){
        console.log('got "download mission" message');
    });
    socket.on('arm', function(){
        console.log('got "arm" message');
    });
    socket.on('disarm', function(){
        console.log('got "disarm" message');
    });
    socket.on('start mission', function(){
        console.log('got "start mission" message');
    });
    socket.on('stop mission', function(){
        console.log('got "stop mission" message');
    });
    socket.on('pause mission', function(){
        console.log('got "pause mission" message');
    });
    socket.on('resume mission', function(){
        console.log('got "resume mission" message');
    });
});

server.listen(3000);

openUrl.open('http://localhost:3000');
