var geolib = require('geolib');
var protobuf = require('protobufjs');

//constructor for fake WAM-V
module.exports = function(){
    this.prevTime = Date.now(); //time of last update, in milliseconds since epoch
    this.MODES = {STOPPED: 0, AUTO: 1, PAUSED: 2, KILLED: 3};
    this.TYPES = {DOUBLE: 0, VEC3: 1, MAT3: 2};
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
        ['State Estimator', 'IMU',          'mag_scale',   this.TYPES.DOUBLE, '0'                ],
        ['State Estimator', 'IMU',          'mag_vector',  this.TYPES.VEC3,   '0,0,0'            ],
        ['State Estimator', 'IMU',          'Rib',         this.TYPES.MAT3,   '0,0,0,0,0,0,0,0,0'],
        ['State Estimator', 'IMU',          'rIBb',        this.TYPES.VEC3,   '0,0,0'            ],
        ['State Estimator', 'IMU',          'gbBNi',       this.TYPES.VEC3,   '0,0,0'            ],
        ['Section 1',       'Subsection 1', 'Parameter 1', this.TYPES.DOUBLE, '-1.2'             ],
        ['Section 1',       'Subsection 1', 'Parameter 2', this.TYPES.VEC3,   '3,-0.2,100'       ],
        ['Section 1',       'Subsection 2', 'Parameter 3', this.TYPES.MAT3,   '1,2,3,4,5,6,7,8,9']
    ];
    this.settings = [
        ['Map',       'key',       'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA'],
        ['Map',       'lat',       '21.308731'                              ],
        ['Map',       'lng',       '-157.888815'                            ],
        ['Map',       'zoom',      '19'                                     ],
        ['Section 1', 'Setting 1', 'value 1'                                ]
    ];
    //load .proto messages
    this.protoBuilder = protobuf.loadProtoFile('./public/assets/proto/Test.proto');
    if (this.protoBuilder === null){
        throw new Error ('Unable to load proto messages');
    }
    this.protoPkg = this.protoBuilder.build();
    //update fake WAM-V, returning null or an Attention message
    this.update = function(){
        var msg = ''; //used for return value
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
        //return a message or null
        return msg === '' ? null : (new this.protoPkg.Attention(msg)).toBuffer();
    };
    //returns a Status message
    this.getStatusData = function(){
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
        return msg.toBuffer();
    };
    //return a GetParametersResponse or Failure message
    this.getParameters = function(){
        var msg = new this.protoPkg.GetParametersResponse();
        for (var i = 0; i < this.parameters.length; i++){
            var param = this.parameters[i];
            msg.add('parameters', new this.protoPkg.Parameter(
                param[0], param[1], param[2], param[3], param[4]
            ));
        }
        return ['GetParametersResponse', msg.toBuffer()];
    };
    //return a GetSettingsResponse or Failure message
    this.getSettings = function(){
        var msg = new this.protoPkg.GetSettingsResponse();
        for (var i = 0; i < this.settings.length; i++){
            var setting = this.settings[i];
            msg.add('settings', new this.protoPkg.Setting(
                setting[0], setting[1], setting[2]
            ));
        }
        return ['GetSettingsResponse', msg.toBuffer()];
    }
    //returns a GetMissionResponse or Failure message
    this.getMission = function(){
        if (this.mission === null){
            return ['Failure', (new this.protoPkg.Failure('No uploaded mission')).toBuffer()];
        }
        var msg = new this.protoPkg.GetMissionResponse(new this.protoPkg.Mission());
        msg.mission.title = this.mission.title;
        for (var i = 0; i < this.mission.waypoints.length; i++){
            var wp = this.mission.waypoints[i];
            msg.mission.add('waypoints', new this.protoPkg.Mission.Waypoint(
                wp.title, wp.type, wp.position.lat, wp.position.lng
            ));
        }
        return ['GetMissionResponse', msg.toBuffer()];
    };
    //set parameters, returning a Success or Failure message
    this.setParameters = function(setParametersBuf){
        //decode message
        var newParams;
        try {
            newParams = this.protoPkg.SetParameters.decode(setParametersBuf);
        } catch (e){
            console.log('Unable to decode SetParameters message');
            return ['Failure', (new this.protoPkg.Failure('Invalid message')).toBuffer()];
        }
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
            return ['Failure', (new this.protoPkg.Failure('A parameter was not found')).toBuffer()];
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
        return ['Success', null];
    };
    //set settings, returning a Success or Failure message
    this.setSettings = function(newSettingsBuf){
        //decode message
        var newSettings;
        try {
            newSettings = this.protoPkg.SetSettings.decode(newSettingsBuf);
        } catch (e){
            console.log('Unable to decode SetSettings message');
            return ['Failure', (new this.protoPkg.Failure('Invalid message')).toBuffer()];
        }
        //verify new settings
        var settingsToSet = [];
        var i, j;
        SettingSearch:
        for (i = 0; i < newSettings.settings.length; i++){
            var newSetting = newSettings.settings[i];
            for (j = 0; j < this.settings.length; j++){
                var setting = this.settings[j];
                if (newSetting.section == setting[0] &&
                    newSetting.title == setting[1]){
                    // TODO: perform value checking
                    settingsToSet.push(j);
                    continue SettingSearch;
                }
            }
            return ['Failure', (new this.protoPkg.Failure('A setting was not found')).toBuffer()];
        }
        //set settings
        for (i = 0; i < newSettings.settings.length; i++){
            this.settings[settingsToSet[i]] = [
                newSettings.settings[i].section,
                newSettings.settings[i].title,
                newSettings.settings[i].value
            ];
        }
        return ['Success', null];
    }
    //set mission, returning a Success or Failure message
    this.setMission = function(setMissionBuf){
        //decode message
        var newMission;
        try {
            newMission = (this.protoPkg.SetMission.decode(setMissionBuf)).mission;
        } catch (e){
            console.log('Unable to decode SetMission message');
            return ['Failure', (new this.protoPkg.Failure('Invalid message')).toBuffer()];
        }
        //set mission
        if (newMission.waypoints.length == 0){
            return ['Failure', (new this.protoPkg.Failure('Mission has no waypoints')).toBuffer()];
        }
        if (this.mode == this.MODES.AUTO){
            return ['Failure', (new this.protoPkg.Failure('Currently doing a mission')).toBuffer()];
        }
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
        return ['Success', null];
    };
    //arm or disarm, returning a Success or Failure message
    this.arm = function(arm){
        if (arm == this.armed){
            return [
                'Failure',
                (new this.protoPkg.Failure(arm ? 'Already armed' : 'Already disarmed')).toBuffer()
            ];
        }
        if (this.mode == this.MODES.AUTO){
            return ['Failure', (new this.protoPkg.Failure('Currently doing a mission')).toBuffer()];
        }
        this.armed = arm;
        return ['Success', null];
    };
    //start or resume, returning a Success or Failure message
    this.start = function(fromBeginning){
        if (this.mode == this.MODES.AUTO){
            return ['Failure', (new this.protoPkg.Failure('Currently doing a mission')).toBuffer()];
        }
        if (this.mode == this.MODES.KILLED){
            return ['Failure', (new this.protoPkg.Failure('Kill switch is active')).toBuffer()];
        }
        if (this.battery == 0){
            return ['Failure', (new this.protoPkg.Failure('Battery is at 0%')).toBuffer()];
        }
        if (!this.armed){
            return ['Failure', (new this.protoPkg.Failure('Not armed')).toBuffer()];
        }
        if (this.mission == null){
            return ['Failure', (new this.protoPkg.Failure('No uploaded mission')).toBuffer()];
        }
        if (this.mode == this.MODES.PAUSED && fromBeginning){
            this.missionIndex = 0;
        }
        this.mode = this.MODES.AUTO;
        this.speed = this.SPEED;
        return ['Success', null];
    };
    //stop, returning a Success or Failure message
    this.stop = function(){
        if (this.mode != this.MODES.AUTO){
            return ['Failure', (new this.protoPkg.Failure('Not doing a mission')).toBuffer()];
        }
        this.mode = this.MODES.PAUSED;
        this.speed = 0;
        return ['Success', null];
    };
    //activate or deactivate kill switch, returning a Success or Failure message
    this.kill = function(kill){
        if (kill === (this.mode == this.MODES.KILLED)){
            return ['Failure', (new this.protoPkg.Failure(
                'Kill switch already ' + (kill?'':'in') + 'active'
            )).toBuffer()];
        }
        this.mode = kill ? this.MODES.KILLED : this.mode.STOPPED;
        this.speed = 0;
        this.missionIndex = 0;
        return ['Success', null];
    };
};
