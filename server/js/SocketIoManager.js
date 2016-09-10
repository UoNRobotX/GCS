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
    this.missions = new this.protoPkg.SetMissions(); //mission list stored on server
    this.missionsFile = './data/missions.json';
    //load missions from file
    fs.readFile(this.missionsFile, function(err, data){
        if (err){
            console.log('Unable to read missions file. Using empty missions list.');
        } else {
            try {
                this.missions = this.protoPkg.SetMissions.decode(data);
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
        socket.on('GetParameters', function(data, id){
            console.log('got a "GetParameters" message');
            var msg = this.vehicle.getParameters();
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('GetSettings', function(data, id){
            console.log('got a "GetSettings" message');
            var msg = this.vehicle.getSettings();
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('GetMission', function(data, id){
            console.log('got a "GetMission" message');
            var msg = this.vehicle.getMission();
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('GetMissions', function(data, id){
            console.log('got a "GetMissions" message');
            socket.emit('GetMissionsResponse', this.missions.toBuffer(), id);
        }.bind(this));
        socket.on('SetParameters', function(data, id){
            console.log('Got "SetParameters" message');
            var msg = this.vehicle.setParameters(data);
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('SetSettings', function(data, id){
            console.log('got "SetSettings" message');
            var msg = this.vehicle.setSettings(data);
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('SetMission', function(data, id){
            console.log('got "SetMission" message');
            var msg = this.vehicle.setMission(data);
            socket.emit(msg[0], msg[1], id);
        }.bind(this));
        socket.on('SetMissions', function(data, id){
            //check message
            var missionsMsg;
            try {
                missionsMsg = this.protoPkg.SetMissions.decode(data);
            } catch (e){
                console.log('Unable to decode SetMissions message');
                socket.emit('Failure', (new this.protoPkg.Failure('Invalid message')).toBuffer(), id);
                return;
            }
            console.log('got "SetMissions" message');
            this.missions = missionsMsg;
            socket.emit('Success', (new this.protoPkg.Success()).toBuffer(), id);
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
