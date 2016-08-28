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

//create server
var server = http.createServer(app.callback());
//create fake WAM-V
var vehicle = new Vehicle();

/*
 *  Client-server message protocol: (This is just for testing. The real protocol will be different.)
 *  Each socket.io message will have one of these types:
 *      - 'status'           -> sent to client, contains vehicle position, heading, etc
 *      - 'get_parameters'   -> sent to server/client, requests/contains vehicle parameters
 *      - 'set_parameter'    -> sent to server, requests that a vehicle parameter be set
 *      - 'save_missions'    -> sent to server, contains missions to be saved on the server
 *      - 'load_missions'    -> sent to server/client, requests/contains missions saved on the server
 *      - 'upload_mission'   -> sent to server, contains a mission to send to the vehicle
 *      - 'download_mission' -> sent to server/client, requests/contains the vehicle's current mission
 *      - 'arm'              -> sent to server, requests that the vehicle arm itself
 *      - 'disarm'           -> sent to server, requests that the vehicle disarm itself
 *      - 'start_mission'    -> sent to server, requests that the vehicle begin its mission
 *      - 'stop_mission'     -> sent to server, requests that the vehicle stop its mission
 *      - 'pause_mission'    -> sent to server, requests that the vehicle pause its mission
 *      - 'resume_mission'   -> sent to server, requests that the vehicle resume its mission
 *      - 'kill_switch'      -> sent to server, requests that the kill switch be activated
 *      - 'success'          -> sent to client, indicates that a request was successfully handled
 *      - 'failure'          -> sent to client, indicates that a request could not be handled
 *      - 'attention'        -> sent to client, indicates that something important has happened
 *  For some types, data is sent:
 *      - For 'status', the data has this form:
 *          {
 *              position: {lat: lat1, lng: lng1},
 *              heading:  degrees1,
 *              speed:    kmph1,
 *              battery:  percentage1,
 *              armed:    boolean1,
 *              mode:     mode1, //this will be one of: 'idle', 'auto', 'paused',
 *          }
 *     - For 'get_parameters':
 *         If sent from the client, no data is sent.
 *         If sent from the server, the data is an object.
 *             Each of the object's properties specifies a parameter or parameter group.
 *             Each property can have one of these forms:
 *                 parameterName1: {type: 'boolean', value: b1}
 *                 parameterName1: {type: 'double',  value: n1}
 *                 parameterName1: {type: 'vector3', value: [x1, y1, z1]}
 *                 parameterName1: {type: 'mat3',    value: [x11,x12,x13, x21,x22,x23, x31,x32,x33]}
 *                 parameterGroupName1: parameters1 //parameters1 has the same form as the data object
 *             Parameter names may not contain a '|' (these are used by 'set_parameter').
 *     - For 'set_parameter', the data has this form: {name: parameterName1, value: value1}
 *         A parameter in a group can be named using '|', eg: 'Group1|Subgroup1|ParameterName1'
 *     - For 'save_missions', the data specifies a list of missions
 *         The data is an array of objects, each of the same form as with 'upload_mission'
 *     - For 'load_missions':
 *         If sent from the client, no data is sent.
 *         If sent from the server, the data specifies a list of missions.
 *             The data is an array of objects, each of the same form as with 'upload_mission'
 *     - For 'upload_mission', the data has this form:
 *         {
 *             title:       title1, //a string, or null
 *             description: desc1,  //a string, or null
 *             waypoints: [
 *                 {
 *                     title:       title1, //a string, or null
 *                     description: description1, //a string, or null
 *                     position: {
 *                         lat: lat1,
 *                         lng: lng1
 *                     }
 *                 },
 *                 .. //more waypoints
 *             ]
 *         }
 *     - For 'download_mission':
 *         If sent from the client, no data is sent.
 *         If sent from the server, the data has the same form as with 'upload_mission'
 *     - For 'failure' and 'attention', the data is a string
 *     - For other types, no data is sent.
 */

//use socket.io to periodically send WAM-V data
var io = socket_io(server);
io.on('connection', function(socket){
    var statusTimer, updateTimer; //used for fake WAM-V
    //print a message
    var host = socket.client.request.headers.host;
    console.log('connected to: ' + host);
    //when a connection closes, print a message
    socket.on('disconnect', function(){
        clearInterval(statusTimer);
        clearInterval(updateTimer);
        console.log('disconnected from: ' + host);
    });
    //periodically update fake vehicle
    updateTimer = setInterval(function(){
        vehicle.update();
    }, 300);
    //periodically send vehicle status information
    statusTimer = setInterval(function(){
        var data = vehicle.getStatusData();
        socket.volatile.emit('status', data); //'volatile' allows the message to be dropped
        console.log('sent status message to: ' + host);
    }, 3000);
    //handle other messages
    socket.on('get_parameters', function(){
        console.log('got "get_parameters" message');
        socket.emit('get_parameters', vehicle.getParameters());
    });
    socket.on('set_parameter', function(data){
        console.log('got "set_parameter" message');
        //check data format
        if (typeof data != 'object' || 
            !data.hasOwnProperty('name') || 
            !data.hasOwnProperty('value') ||
            typeof data.name != 'string'){
            socket.emit('failure', 'message has invalid format');
        }
        //set parameter
        var msg = vehicle.setParameter(data.name, data.value);
        if (msg != null){
            socket.emit('failure', msg);
        } else {
            socket.emit('success');
        }
    });
    socket.on('save_missions', function(data){
        console.log('got "save_missions" message');
        console.log(data);
    });
    socket.on('load_missions', function(){
        console.log('got "load_missions" message');
    });
    socket.on('upload_mission', function(data){
        console.log('got "upload_mission" message');
        console.log(data);
    });
    socket.on('download_mission', function(){
        console.log('got "download_mission" message');
    });
    socket.on('arm', function(){
        console.log('got "arm" message');
    });
    socket.on('disarm', function(){
        console.log('got "disarm" message');
    });
    socket.on('start_mission', function(){
        console.log('got "start_mission" message');
    });
    socket.on('stop_mission', function(){
        console.log('got "stop_mission" message');
    });
    socket.on('pause_mission', function(){
        console.log('got "pause_mission" message');
    });
    socket.on('resume_mission', function(){
        console.log('got "resume_mission" message');
    });
    socket.on('kill_switch', function(){
        console.log('got "kill_switch" message');
    });
});

server.listen(3000);

openUrl.open('http://localhost:3000');
