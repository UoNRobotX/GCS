var http = require('http');
var koa = require('koa');
var path = require('path');
var openUrl = require('openurl');
var serve = require('koa-static');
var socket_io = require('socket.io');
var fs = require('fs');
var path = require('path');
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
 *      - 'set_parameters'   -> sent to server, requests that vehicle parameters be set
 *      - 'save_missions'    -> sent to server, contains missions to be saved on the server
 *      - 'load_missions'    -> sent to server/client, requests/contains missions saved on the server
 *      - 'upload_mission'   -> sent to server, contains a mission to send to the vehicle
 *      - 'download_mission' -> sent to server/client, requests/contains the vehicle's current mission
 *      - 'arm'              -> sent to server, requests that the vehicle arm itself
 *      - 'disarm'           -> sent to server, requests that the vehicle disarm itself
 *      - 'start_mission'    -> sent to server, requests that the vehicle begin its mission
 *      - 'stop_mission'     -> sent to server, requests that the vehicle stop its mission
 *      - 'resume_mission'   -> sent to server, requests that the vehicle resume its mission
 *      - 'kill'             -> sent to server, requests that the kill switch be activated
 *      - 'unkill'           -> sent to server, requests that the kill switch be deactivated
 *      - 'success'          -> sent to client, indicates that a request was successfully handled
 *      - 'failure'          -> sent to client, indicates that a request could not be handled
 *      - 'attention'        -> sent to client, indicates that something important has happened
 *  When the client sends a message with type other than 'get_parameters',
 *      'load_missions', 'download_mission', 'success', 'failure', and 'attention',
 *      the server will send a 'success' or 'failure' to the client.
 *  For some types, data is sent:
 *      - For 'status', the data has this form:
 *          {
 *              position: {lat: lat1, lng: lng1},
 *              heading:  degrees1,
 *              speed:    kmph1,
 *              battery:  percentage1,
 *              armed:    boolean1,
 *              mode:     mode1, //this will be one of: 'idle', 'auto', 'paused', 'killed',
 *              signal:   percentage1
 *          }
 *     - For 'get_parameters':
 *         If sent from the client, no data is sent.
 *         If sent from the server, the data is an array that specifies parameters.
 *             The array contains objects that specify sections:
 *                 [{title: sectionTitle1, subSections: subsections1}, ...]
 *             'subsections1' is an array that contains objects that specify subsections:
 *                 [{title: subsectionTitle1, params: params1}, ...]
 *             'params1' is an array that contains objects that specify parameters:
 *                 [{title: parameterTitle1, type: type1, value value1}, ...]
 *             'type1' is 'double', 'vector3', or 'mat3'.
 *             'value1' is a string containing a number, or 3 numbers, or 9 numbers
 *                 eg: '100', '1,2,3', '1,2,3;4,5,6;7,8,9'
 *     - For 'set_parameters', the data is an array of objects specifying parameters to set:
 *         [{title: 'section1|subsection1|title1', value: value1}, ...]
 *     - For 'save_missions', the data specifies a list of missions
 *         The data is an array of objects, each of the same form as with 'upload_mission'
 *     - For 'load_missions':
 *         If sent from the client, no data is sent.
 *         If sent from the server, the data specifies a list of missions.
 *             The data is an array of objects, each of the same form as with 'upload_mission'
 *     - For 'upload_mission', the data specifies a mission, and has this form:
 *         {
 *             title:       title1, //a string, or null
 *             description: desc1,  //a string, or null
 *             waypoints: [
 *                 {
 *                     title:   title1,   //a string, or null
 *                     type:    type1,    //a string
 *                     visible: visible1, //a boolean
 *                     position: {
 *                         lat: lat1,
 *                         lng: lng1
 *                     }
 *                 },
 *                 ... //more waypoints
 *             ]
 *         }
 *     - For 'download_mission':
 *         If sent from the client, no data is sent.
 *         If sent from the server, the data has the same form as with 'upload_mission'
 *     - For 'success', the data is a string that
 *         holds the type of the message that was handled successfully.
 *     - For 'failure', the data is an array of 2 strings.
 *         The strings specify the type of the message that failed, and an informative message.
 *     - For 'attention', the data is an informative message.
 *     - For other types, no data is sent.
 */

//used to check if sent data corresponds to a mission
function isMission(data){
    if (typeof data != 'object' ||
        !data.hasOwnProperty('waypoints') ||
        !Array.isArray(data.waypoints)){
        return false;
    }
    for (var i = 0; i < data.waypoints.length; i++){
        var wp = data.waypoints[i];
        if (typeof wp != 'object' ||
            !wp.hasOwnProperty('position') ||
            typeof wp.position != 'object' ||
            !wp.position.hasOwnProperty('lat') ||
            typeof wp.position.lat != 'number' ||
            !wp.position.hasOwnProperty('lng') ||
            typeof wp.position.lng != 'number'){
            return false;
        }
    }
    return true;
}

//used to check if sent data corresponds to a mission list
function isMissionList(data){
    if (!Array.isArray(data)){
        return false;
    }
    for (var i = 0; i < data.length; i++){
        if (!isMission(data[i])){
            return false;
        }
    }
    return true;
}

//used to check if sent data corresponds to list of parameter settings
function isParameterList(data){
    if (!Array.isArray(data)){
        return false;
    }
    for (var i = 0; i < data.length; i++){
        var setting = data[i];
        if (typeof setting != 'object' ||
            !setting.hasOwnProperty('title') ||
            typeof setting.title != 'string' ||
            !setting.hasOwnProperty('value') ||
            typeof setting.value != 'string'){
            return false;
        }
    }
    return true;
}

var missions = []; //mission list stored on server
var missionsFile = path.join(__dirname, 'data/missions.json');

//load missions from file
fs.readFile(missionsFile, function(err, data){
    if (err){
        console.log('Unable to read missions file. Using empty missions list.');
    } else {
        try {
            var data = JSON.parse(data.toString());
            if (!isMissionList(data)){
                console.log('Missions file is invalid. Using empty missions list.');
            } else {
                missions = data;
            }
        } catch (e){
            console.log('Missions file content is invalid: ' + e.message);
            console.log('Using empty missions list');
        }
    }
});

//save missions on shutdown
var saveMissionsCalled = false;
function saveMissions(){
    if (!saveMissionsCalled){
        fs.writeFileSync(missionsFile, JSON.stringify(missions));
        saveMissionsCalled = true;
    }
    process.exit();
}
process.on('exit', saveMissions);
process.on('SIGINT', saveMissions);

//handle messages from clients
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
        var msg = vehicle.update();
        if (msg != null){
            socket.emit('attention', msg);
        }
    }, 50);
    //periodically send vehicle status information
    statusTimer = setInterval(function(){
        var data = vehicle.getStatusData();
        socket.volatile.emit('status', data); //'volatile' allows the message to be dropped
        //console.log('sent status message to: ' + host);
    }, 50);
    //handle other messages
    socket.on('get_parameters', function(){
        console.log('got "get_parameters" message');
        var data = vehicle.getParameters();
        if (typeof data == 'object'){
            socket.emit('get_parameters', data);
        } else {
            socket.emit('failure', ['get_parameters', data]);
        }
    });
    socket.on('set_parameters', function(data){
        console.log('got "set_parameters" message');
        //check data format
        if (!isParameterList(data)){
            socket.emit('failure', ['set_parameters', 'Message has invalid format.']);
        }
        //set parameter
        var msg = vehicle.setParameters(data);
        if (msg != null){
            socket.emit('failure', ['set_parameters', msg]);
        } else {
            socket.emit('success', 'set_parameters');
            //console.log(JSON.stringify(vehicle.getParameters()))
        }
    });
    socket.on('save_missions', function(data){
        console.log('got "save_missions" message');
        if (!isMissionList(data)){
            socket.emit('failure', ['save_missions', 'Invalid mission list data.']);
        } else {
            missions = data;
            socket.emit('success', 'save_missions');
        }
    });
    socket.on('load_missions', function(){
        console.log('got "load_missions" message');
        socket.emit('load_missions', missions);
    });
    socket.on('upload_mission', function(data){
        console.log('got "upload_mission" message');
        if (!isMission(data)){
            socket.emit('failure', ['upload_mission', 'Invalid mission data.']);
        } else {
            var msg = vehicle.setMission(data);
            if (msg == null){
                socket.emit('success', 'upload_mission');
            } else {
                socket.emit('failure', ['upload_mission', msg]);
            }
        }
    });
    socket.on('download_mission', function(){
        console.log('got "download_mission" message');
        var data = vehicle.getMission();
        if (typeof data == 'object'){
            socket.emit('download_mission', data);
        } else {
            socket.emit('failure', ['download_mission', data]);
        }
    });
    socket.on('arm', function(){
        console.log('got "arm" message');
        var msg = vehicle.arm();
        if (msg == null){
            socket.emit('success', 'arm');
        } else {
            socket.emit('failure', ['arm', msg]);
        }
    });
    socket.on('disarm', function(){
        console.log('got "disarm" message');
        msg = vehicle.disarm();
        if (msg == null){
            socket.emit('success', 'disarm');
        } else {
            socket.emit('failure', ['disarm', msg]);
        }
    });
    socket.on('start_mission', function(){
        console.log('got "start_mission" message');
        msg = vehicle.start(true);
        if (msg == null){
            socket.emit('success', 'start_mission');
        } else {
            socket.emit('failure', ['start_mission', msg]);
        }
    });
    socket.on('stop_mission', function(){
        console.log('got "stop_mission" message');
        msg = vehicle.stop();
        if (msg == null){
            socket.emit('success', 'stop_mission');
        } else {
            socket.emit('failure', ['stop_mission', msg]);
        }
    });
    socket.on('resume_mission', function(){
        console.log('got "resume_mission" message');
        msg = vehicle.start(false);
        if (msg == null){
            socket.emit('success', 'resume_mission');
        } else {
            socket.emit('failure', ['resume_mission', msg]);
        }
    });
    socket.on('kill', function(){
        console.log('got "kill" message');
        msg = vehicle.kill();
        if (msg == null){
            socket.emit('success', 'kill');
        } else {
            socket.emit('failure', ['kill', msg]);
        }
    });
    socket.on('unkill', function(){
        console.log('got "unkill" message');
        msg = vehicle.unkill();
        if (msg == null){
            socket.emit('success', 'unkill');
        } else {
            socket.emit('failure', ['unkill', msg]);
        }
    });
});

server.listen(3000);

openUrl.open('http://localhost:3000');
