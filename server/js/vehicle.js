var geolib = require('geolib');
var protobuf = require('protobufjs');
var fs = require('fs');

//constructor for fake WAM-V
//'inputFile' and 'outputFile' are names of files used to communicate with the server
module.exports = function(inputFile, outputFile){
    this.prevTime = Date.now(); //time of last update, in milliseconds since epoch
    this.MSG_TYPES = {
        STATUS:                   0,
        COMMAND:                  1,
        GET_PARAMETERS:           2,
        GET_PARAMETERS_RESPONSE:  3,
        GET_SETTINGS:             4,
        GET_SETTINGS_RESPONSE:    5,
        GET_MISSION:              6,
        GET_MISSION_RESPONSE:     7,
        GET_MISSIONS:             8,
        GET_MISSIONS_RESPONSE:    9,
        SET_PARAMETERS:          10,
        SET_SETTINGS:            11,
        SET_MISSION:             12,
        SET_MISSIONS:            13,
        SUCCESS:                 14,
        FAILURE:                 15,
        ATTENTION:               16
    };
    this.MODES = {STOPPED: 0, AUTO: 1, PAUSED: 2, KILLED: 3};
    this.PARAM_TYPES = {DOUBLE: 0, VEC3: 1, MAT3: 2};
    this.BATTERY_LIFETIME = 10; //battery lifetime in hours
    this.SPEED = 30; //max speed (unrealistically, the fake WAM-V will always be at this speed or 0)
    this.position = {lat: 21.308731, lng: -157.888815};
    this.heading = 0;
    this.speed = 0; //speed in kmph
    this.battery = 100;
    this.armed = false;
    this.mode = this.MODES.STOPPED;
    this.signal = 100; //unrealistically, for the fake WAM-V, this is always 100
    this.mission = null; //the vehicle's current mission
        //{title: t1, waypoints: [{title: t2, type: t3, position: {lat: lat1, lng: lng1}}, ...]}
    this.missionIndex = 0; //if completing a mission, the index of the next waypoint
    this.parameters = [
        ['State Estimator', 'IMU',          'mag_scale',   this.PARAM_TYPES.DOUBLE, '0'                ],
        ['State Estimator', 'IMU',          'mag_vector',  this.PARAM_TYPES.VEC3,   '0,0,0'            ],
        ['State Estimator', 'IMU',          'Rib',         this.PARAM_TYPES.MAT3,   '0,0,0,0,0,0,0,0,0'],
        ['State Estimator', 'IMU',          'rIBb',        this.PARAM_TYPES.VEC3,   '0,0,0'            ],
        ['State Estimator', 'IMU',          'gbBNi',       this.PARAM_TYPES.VEC3,   '0,0,0'            ],
        ['Section 1',       'Subsection 1', 'Parameter 1', this.PARAM_TYPES.DOUBLE, '-1.2'             ],
        ['Section 1',       'Subsection 1', 'Parameter 2', this.PARAM_TYPES.VEC3,   '3,-0.2,100'       ],
        ['Section 1',       'Subsection 2', 'Parameter 3', this.PARAM_TYPES.MAT3,   '1,2,3,4,5,6,7,8,9']
    ];
    this.magicNumber = new Buffer([0x17, 0xC0, 0x42]); //used in messages
    //load .proto messages
    this.protoBuilder = protobuf.loadProtoFile('./public/assets/proto/Test.proto');
    if (this.protoBuilder === null){
        throw new Error ('Unable to load proto messages');
    }
    this.protoPkg = this.protoBuilder.build();
    //open output file
    this.ostream = fs.createWriteStream(outputFile, {flags: 'a'});
    this.ostream.on('error', function(){throw new Error('Vehicle: Error with writing output file');});
    //open input file
    if (fs.statSync(inputFile).isFIFO()){
        var istream = fs.createReadStream(inputFile);
        istream.on('data', function(chunk){this.processInputData(chunk);}.bind(this));
        istream.on('error', function(){throw new Error('Vehicle: Error with reading input file');});
    } else {
        fs.open(inputFile, 'r', function (err, fd){
            if (err){throw new Error('Vehicle: Error with opening input file');}
            var bytesRead = 0;
            var bufSize = 64;
            var buffer = new Buffer(bufSize);
            var readBytes = function(){
                if (fs.statSync(inputFile).size > bytesRead){
                    fs.read(fd, buffer, 0, bufSize, bytesRead, function (err, n, buffer){
                        if (err){throw new Error('Vehicle: Error with reading input file');}
                        this.processInputData(buffer.slice(0,n));
                        bytesRead += n;
                        readBytes();
                    }.bind(this));
                } else {
                    setTimeout(readBytes, 100);
                }
            }.bind(this);
            readBytes();
        }.bind(this));
    }
    this.msgBuf = new Buffer(0);
    this.processInputData = function(buf){
        this.msgBuf = Buffer.concat([this.msgBuf, buf]);
        //find magic number prefix
        var i = 0;
        while (i+2 < this.msgBuf.length){
            if (this.msgBuf[i] != this.magicNumber[0] ||
                this.msgBuf[i+1] != this.magicNumber[1] ||
                this.msgBuf[i+2] != this.magicNumber[2]){
                i++;
            } else {
                break;
            }
        }
        this.msgBuf = this.msgBuf.slice(i);
        //check for a complete packet
        if (this.msgBuf.length >= 9){
            var msgSize = this.msgBuf.readUInt32LE(5);
            if (this.msgBuf.length >= 9 + msgSize + 4){
                var type = this.msgBuf.readUInt8(3);
                var id = this.msgBuf.readUInt8(4);
                var data = this.msgBuf.slice(9, 9 + msgSize);
                this.msgBuf = this.msgBuf.slice(9 + msgSize + 4);
                this.processMsg(type, data, id);
            }
        }
    };
    //sends a messsage to the server
    this.writeOutputData = function(type, buffer, id){
        if (buffer.length > Math.pow(2,32)-1){
            console.log('Vehicle: Message too large');
            return;
        }
        var header = new Buffer(9); //magic number, type, message ID, size
        this.magicNumber.copy(header);
        header.writeUInt8(type, 3);
        header.writeUInt8(  id, 4);
        header.writeUInt32LE(buffer.length, 5);
        this.ostream.write(header);
        this.ostream.write(buffer);
        this.ostream.write(new Buffer([0, 0, 0, 0])); // TODO: use a CRC32
    }
    //processes messages from the server
    this.processMsg = function(type, data, id){
        switch (type){
            case this.MSG_TYPES.COMMAND: {
                var msg = this.decodeMsg('Command', data);
                if (msg === null){return;}
                switch (msg.type){
                    case this.protoPkg.Command.Type.ARM: {
                        this.arm(true, id);
                        break;
                    }
                    case this.protoPkg.Command.Type.DISARM: {
                        this.arm(false, id);
                        break;
                    }
                    case this.protoPkg.Command.Type.START: {
                        this.start(true, id);
                        break;
                    }
                    case this.protoPkg.Command.Type.STOP: {
                        this.stop(id);
                        break;
                    }
                    case this.protoPkg.Command.Type.RESUME: {
                        this.start(false, id);
                        break;
                    }
                    case this.protoPkg.Command.Type.KILL: {
                        this.kill(true, id);
                        break;
                    }
                    case this.protoPkg.Command.Type.UNKILL: {
                        this.kill(false, id);
                        break;
                    }
                }
                break;
            }
            case this.MSG_TYPES.GET_PARAMETERS: {
                var msg = new this.protoPkg.GetParametersResponse();
                for (var i = 0; i < this.parameters.length; i++){
                    var param = this.parameters[i];
                    msg.add('parameters', new this.protoPkg.Parameter(
                        param[0], param[1], param[2], param[3], param[4]
                    ));
                }
                this.writeOutputData(this.MSG_TYPES.GET_PARAMETERS_RESPONSE, msg.toBuffer(), id);
                break;
            }
            case this.MSG_TYPES.GET_MISSION: {
                if (this.mission === null){
                    this.sendFailureMsg('No uploaded mission', id);
                    return;
                }
                var msg = new this.protoPkg.GetMissionResponse(new this.protoPkg.Mission());
                msg.mission.title = this.mission.title;
                for (var i = 0; i < this.mission.waypoints.length; i++){
                    var wp = this.mission.waypoints[i];
                    msg.mission.add('waypoints', new this.protoPkg.Mission.Waypoint(
                        wp.title, wp.type, wp.position.lat, wp.position.lng
                    ));
                }
                this.writeOutputData(this.MSG_TYPES.GET_MISSION_RESPONSE, msg.toBuffer(), id);
                break;
            }
            case this.MSG_TYPES.SET_PARAMETERS: {
                var newParams = this.decodeMsg('SetParameters', data);
                if (newParams === null){return;}
                //verify new parameters
                var paramsToSet = [];
                var i, j;
                ParamSearch:
                for (i = 0; i < newParams.parameters.length; i++){
                    var newParam = newParams.parameters[i];
                    for (j = 0; j < this.parameters.length; j++){
                        var param = this.parameters[j];
                        if (newParam.section === param[0] &&
                            newParam.subSection === param[1] &&
                            newParam.title === param[2]){
                            // TODO: perform type and value checking
                            paramsToSet.push(j);
                            continue ParamSearch;
                        }
                    }
                    this.sendFailureMsg('A parameter was not found', id);
                    return;
                }
                //set parameters
                for (i = 0; i < newParams.parameters.length; i++){
                    this.parameters[paramsToSet[i]] = [
                        newParams.parameters[i].section,
                        newParams.parameters[i].subSection,
                        newParams.parameters[i].title,
                        newParams.parameters[i].type,
                        newParams.parameters[i].value
                    ];
                }
                this.sendSuccessMsg(id);
                break;
            }
            case this.MSG_TYPES.SET_MISSION: {
                var newMission = this.decodeMsg('SetMission', data).mission;
                if (newMission === null){return;}
                //set mission
                if (newMission.waypoints.length == 0){
                    this.sendFailureMsg('Mission has no waypoints', id);
                } else if (this.mode == this.MODES.AUTO){
                    this.sendFailureMsg('Currently doing a mission', id);
                } else {
                    if (this.mode == this.MODES.PAUSED){
                        this.mode = this.MODES.STOPPED;
                    }
                    this.mission = {
                        title: newMission.title,
                        waypoints: newMission.waypoints.map(function(wp){
                            return {
                                title: wp.title,
                                type: wp.type,
                                position: {lat: wp.latitude, lng: wp.longitude}
                            }
                        })
                    };
                    this.missionIndex = 0;
                    this.sendSuccessMsg(id);
                }
                break;
            }
            default: {
                this.sendFailureMsg('Vehicle: unexpected message type', id);
            }
        }
    };
    //periodically update
    setInterval(function(){
        var msg = ''; //used to construct an 'Attention' message
        var time = Date.now();
        var dt = (time - this.prevTime) / 1000; //time since last update, in seconds
        this.prevTime = time;
        //update
        var maxBatDec = dt/(this.BATTERY_LIFETIME*3600) * 100; //max battery decrease since last update
        if (this.battery <= maxBatDec){
            dt *= this.battery / maxBatDec; //obtain the time period while the battery was active
        }
        if (this.mode === this.MODES.AUTO){
            var waypoints = this.mission.waypoints;
            var pos = {latitude: this.position.lat, longitude: this.position.lng};
            var travelDist = dt * this.SPEED*1000/3600; //maximum distance travelled, in meters
            while (travelDist > 0 && this.missionIndex < waypoints.length){
                var wp = waypoints[this.missionIndex];
                var wpPos = {latitude: wp.position.lat, longitude: wp.position.lng};
                var dist = geolib.getDistance(pos, wpPos); //distance to waypoint
                //move towards waypoint
                this.heading = geolib.getBearing(pos, wpPos);
                if (travelDist < dist){
                    var newPos = geolib.computeDestinationPoint(pos, travelDist, this.heading);
                    this.position = {lat: newPos.latitude, lng: newPos.longitude};
                    travelDist = 0;
                } else {
                    travelDist -= dist;
                    this.position = wp.position;
                    this.missionIndex++;
                }
            }
            if (this.missionIndex == waypoints.length){
                msg += 'Mission completed. ';
                this.speed = 0;
                this.mode = this.MODES.STOPPED;
                this.missionIndex = 0;
            }
        }
        if (this.battery <= maxBatDec){
            if (this.battery != 0){
                msg += 'Battery has reached 0%. ';
            }
            this.battery = 0;
            this.speed = 0;
            if (this.mode == this.MODES.AUTO){
                this.mode = this.MODES.PAUSED;
            }
        } else {
            this.battery -= maxBatDec;
        }
        if (msg.length > 0){
            this.writeOutputData(
                this.MSG_TYPES.ATTENTION,
                (new this.protoPkg.Attention(msg)).toBuffer(),
                0
            );
        }
    }.bind(this), 100);
    //periodically send Status messages
    setInterval(function(){
        var msg = new this.protoPkg.Status(
            this.position.lat,
            this.position.lng,
            this.heading,
            this.speed,
            this.battery,
            this.armed,
            this.mode,
            this.signal
        );
        this.writeOutputData(this.MSG_TYPES.STATUS, msg.toBuffer(), 0);
    }.bind(this), 100);
    //arm or disarm, returning a Success or Failure message
    this.arm = function(arm, id){
        if (arm == this.armed){
            this.sendFailureMsg(arm ? 'Already armed' : 'Already disarmed', id);
        } else if (this.mode == this.MODES.AUTO){
            this.sendFailureMsg('Currently doing a mission', id);
        } else {
            this.armed = arm;
            this.sendSuccessMsg(id);
        }
    };
    //start or resume, returning a Success or Failure message
    this.start = function(fromBeginning, id){
        if (this.mode == this.MODES.AUTO){
            this.sendFailureMsg('Currently doing a mission', id);
        } else if (this.mode == this.MODES.KILLED){
            this.sendFailureMsg('Kill switch is active', id);
        } else if (this.battery == 0){
            this.sendFailureMsg('Battery is at 0%', id);
        } else if (!this.armed){
            this.sendFailureMsg('Not armed', id);
        } else if (this.mission == null){
            this.sendFailureMsg('No uploaded mission', id);
        } else {
            if (this.mode == this.MODES.PAUSED && fromBeginning){
                this.missionIndex = 0;
            }
            this.mode = this.MODES.AUTO;
            this.speed = this.SPEED;
            this.sendSuccessMsg(id);
        }
    };
    //stop, returning a Success or Failure message
    this.stop = function(id){
        if (this.mode != this.MODES.AUTO){
            this.sendFailureMsg('Not doing a mission', id);
        } else {
            this.mode = this.MODES.PAUSED;
            this.speed = 0;
            this.sendSuccessMsg(id);
        }
    };
    //activate or deactivate kill switch, returning a Success or Failure message
    this.kill = function(kill, id){
        if (kill === (this.mode == this.MODES.KILLED)){
            this.sendFailureMsg('Kill switch already ' + (kill ? '' : 'in') + 'active', id);
        } else {
            this.mode = kill ? this.MODES.KILLED : this.mode.STOPPED;
            this.speed = 0;
            this.missionIndex = 0;
            this.sendSuccessMsg(id);
        }
    };
    //helper functions
    this.decodeMsg = function(msgType, data){
        try {
            return this.protoPkg[msgType].decode(data);
        } catch (e){
            console.log('Vehicle: Unable to decode ' + msgType + ' message');
            this.sendFailureMsg('Invalid message');
            return null;
        }
    }
    this.sendFailureMsg = function(msg, id){
        this.writeOutputData(
            this.MSG_TYPES.FAILURE,
            (new this.protoPkg.Failure(msg)).toBuffer(),
            id
        );
    }
    this.sendSuccessMsg = function(id){
        this.writeOutputData(this.MSG_TYPES.SUCCESS, new Buffer(0), id);
    }
};
