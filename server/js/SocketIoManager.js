/*
 *  Old client-server message protocol: (This is just for testing. The real protocol will be different.)
 *  Each socket.io message will have one of these types:
 *      - 'status'           -> sent to client, contains vehicle position, heading, etc
 *      - 'get_parameters'   -> sent to server/client, requests/contains vehicle parameters
 *      - 'set_parameters'   -> sent to server, requests that vehicle parameters be set
 *      - 'get_settings'     -> sent to server/client, requests/contains settings
 *      - 'set_settings'     -> sent to server, requests that settings be set
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
 *         section/subsection/parameter names may not contain '|' characters
 *     - For 'set_parameters', the data is an array of objects specifying parameters to set:
 *         [{section: section1, subsection: subsection1, title: title1, value: value1}, ...]
 *     - For 'get_settings':
 *         If sent from the client, no data is sent.
 *         If sent from the server, the data specifies settings:
 *             [{title: section1, settings: [{title: name1, value: value1}, ...]}, ...]
 *     - For 'set_settings', the data is an array of objects specifying settings to set:
 *         [{section: section1, title: title1, value: value1}, ...]
 *     - For 'save_missions', the data specifies a list of missions
 *         The data is an array of objects, each of the same form as with 'upload_mission'
 *     - For 'load_missions':
 *         If sent from the client, no data is sent.
 *         If sent from the server, the data specifies a list of missions.
 *             The data is an array of objects, each of the same form as with 'upload_mission'
 *     - For 'upload_mission', the data specifies a mission, and has this form:
 *         {
 *             title:       title1, //a string
 *             waypoints: [
 *                 {
 *                     title:   title1,   //a string
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
 *     - For 'failure', the data is an error message
 *     - For 'attention', the data is an informative message.
 *     - For other types, no data is sent.
 */

var socket_io = require('socket.io');
var fs = require('fs');
var protobuf = require('protobufjs');
var Vehicle = require('./vehicle.js');

module.exports = function(server){
    //create fake vehicle
    this.vehicle = new Vehicle();
    //load .proto messages
    this.protoBuilder = protobuf.loadProtoFile('./public/assets/proto/Test.proto');
    if (this.protoBuilder === null){
        throw new Error ('Unable to load proto messages');
    }
    this.protoPkg = this.protoBuilder.build();
    //missions list
    this.missions = new this.protoPkg.Missions(); //mission list stored on server
    this.missionsFile = './data/missions.json';
    //load missions from file
    fs.readFile(this.missionsFile, function(err, data){
        if (err){
            console.log('Unable to read missions file. Using empty missions list.');
        } else {
            try {
                this.missions = this.protoPkg.Missions.decode(data);
            } catch (e){
                console.log('Missions file is invalid. Using empty missions list.');
            }
        }
    }.bind(this));
    //save missions on shutdown
    this.saveMissionsCalled = false;
    this.saveMissions = function(){
        if (!this.saveMissionsCalled){
            fs.writeFileSync(this.missionsFile, this.missions.toBuffer());
            this.saveMissionsCalled = true;
        }
        process.exit();
    }.bind(this);
    process.on('exit', this.saveMissions);
    process.on('SIGINT', this.saveMissions);
    //handle messages
    this.io = socket_io(server);
    this.io.on('connection', function(socket){
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
        //periodically update fake vehicle // TODO: update independently of clients
        updateTimer = setInterval(function(){
            var msg = this.vehicle.update();
            if (msg !== null){
                socket.emit('Attention', msg);
            }
        }.bind(this), 50);
        //periodically send vehicle status information
        statusTimer = setInterval(function(){
            var msg = this.vehicle.getStatusData();
            socket.volatile.emit('Status', msg); //'volatile' allows the message to be dropped
            //console.log('sent status message to: ' + host);
        }.bind(this), 50);
        //handle other messages
        socket.on('Get', function(data, id){
            //decode message
            var msg;
            try {
                msg = this.protoPkg.Get.decode(data);
            } catch (e){
                console.log('Unable to decode Get message');
                socket.emit('Failure', (new this.protoPkg.Failure('Invalid message')).toBuffer(), id);
                return;
            }
            //respond
            switch (msg.type){
                case this.protoPkg.Get.Type.PARAMETERS: {
                    console.log('got a "Get" message requesting parameters');
                    var msg = this.vehicle.getParameters();
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Get.Type.SETTINGS: {
                    console.log('got a "Get" message requesting settings');
                    var msg = this.vehicle.getSettings();
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Get.Type.MISSION: {
                    console.log('got a "Get" message requesting the current mission');
                    var msg = this.vehicle.getMission();
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Get.Type.MISSIONS: {
                    console.log('got a "Get" message requesting the missions list');
                    socket.emit('Missions', this.missions.toBuffer(), id);
                    break;
                }
            }
        }.bind(this));
        socket.on('Parameters', function(data, id){
            console.log('Got "Parameters" message');
            var msg = this.vehicle.setParameters(data);
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('Settings', function(data, id){
            console.log('got "Settings" message');
            var msg = this.vehicle.setSettings(data);
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('Missions', function(data, id){
            //check message
            var missionsMsg;
            try {
                missionsMsg = this.protoPkg.Missions.decode(data);
            } catch (e){
                console.log('Unable to decode Missions message');
                socket.emit('Failure', (new this.protoPkg.Failure('Invalid message')).toBuffer(), id);
                return;
            }
            console.log('got "Missions" message');
            this.missions = missionsMsg;
            socket.emit('Success', (new this.protoPkg.Success()).toBuffer(), id);
        }.bind(this));
        socket.on('Mission', function(data, id){
            console.log('got "Mission" message');
            var msg = this.vehicle.setMission(data);
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('Command', function(data, id){
            //decode message
            var msg;
            try {
                msg = this.protoPkg.Command.decode(data);
            } catch (e){
                console.log('Unable to decode Command message');
                socket.emit('Failure', (new this.protoPkg.Failure('Invalid message')).toBuffer(), id);
                return;
            }
            //respond
            switch (msg.type){
                case this.protoPkg.Command.Type.ARM: {
                    console.log('Got "Command" message for arming');
                    var msg = this.vehicle.arm(true);
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Command.Type.DISARM: {
                    console.log('Got "Command" message for disarming');
                    var msg = this.vehicle.arm(false);
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Command.Type.START: {
                    console.log('Got "Command" message for starting');
                    var msg = this.vehicle.start(true);
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Command.Type.STOP: {
                    console.log('Got "Command" message for stopping');
                    var msg = this.vehicle.stop();
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Command.Type.RESUME: {
                    console.log('Got "Command" message for resuming');
                    var msg = this.vehicle.start(false);
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Command.Type.KILL: {
                    console.log('Got "Command" message for killing');
                    var msg = this.vehicle.kill(true);
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
                case this.protoPkg.Command.Type.UNKILL: {
                    console.log('Got "Command" message for unkilling');
                    var msg = this.vehicle.kill(false);
                    socket.emit(msg[0], msg[1], id);
                    break;
                }
            }
        }.bind(this));
    }.bind(this));
}
