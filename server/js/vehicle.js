var geolib = require('geolib')

//constructor for fake WAM-V
module.exports = function(){
    this.prevTime = Date.now(); //time of last update, in milliseconds since epoch
    this.BATTERY_LIFETIME = 10; //battery lifetime in hours
    this.SPEED = 30; //max speed (unrealistically, the fake WAM-V will always be at this speed or 0)
    this.position = {lat: 21.308731, lng: -157.888815},
    this.heading = 0;
    this.speed = 0; //speed in kmph
    this.battery = 100;
    this.armed = false;
    this.mode = 'idle';
    this.signal = 100; //unrealistically, for the fake WAM-V, this is always 100
    this.mission = null; //the vehicle's current mission
    this.missionIndex = 0; //if completing a mission, the index of the next waypoint
    this.parameters = [{
        title: 'State Estimator',
        subSections: [{
            title: 'IMU',
            params: [{
                title: 'mag_scale',
                type: 'double',
                value: '0'
            }, {
                title: 'mag vector',
                type: 'vec3',
                value: '0,0,0' // [0, 0, 0]
            }, {
                title: 'Rib',
                type: 'mat3',
                value: '0,0,0;0,0,0;0,0,0' // [0, 0, 0, 0, 0, 0, 0, 0, 0]
            }, {
                title: 'rIBb',
                type: 'vec3',
                value: '0,0,0' // [0, 0, 0]
            }, {
                title: 'gbBNi',
                type: 'vec3',
                value: '0,0,0' // [0, 0, 0]
            }]
        }]
    }, {
        title: 'Test section',
        subSections: [{
            title: 'Test subsection 1',
            params: [{
                title: 'Test parameter 1',
                type: 'double',
                value: '-1.2'
            }, {
                title: 'Test parameter 2',
                type: 'vec3',
                value: '3,-0.2,100'
            }]
        }, {
            title: 'Test subsection 2',
            params: [{
                title: 'Test parameter 3',
                type: 'mat3',
                value: '1,2,3;4,5,6;7,8,9'
            }]
        }]
    }];
    //update fake WAM-V (returns null, or a string if something important has happened)
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
        if (this.mode == 'auto'){
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
                this.mode = 'idle';
                this.missionIndex = 0;
            }
        }
        if (this.battery <= maxBatDec){
            if (this.battery != 0){
                msg += 'Battery has reached 0%. ';
            }
            this.battery = 0;
            this.speed = 0;
            if (this.mode == 'auto'){
                this.mode = 'paused';
            }
        } else {
            this.battery -= maxBatDec;
        }
        //return a message or null
        return msg == '' ? null : msg;
    };
    //returns a generated status message
    this.getStatusData = function(){
        return {
            position: this.position,
            heading:  this.heading,
            speed:    this.speed,
            battery:  this.battery,
            armed:    this.armed,
            mode:     this.mode,
            signal:   this.signal
        };
    };
    //return parameters (returns a parameters object on success, or an error message)
    this.getParameters = function(){
        return this.parameters;
    };
    //set parameter (returns null on success, or an error message)
    this.setParameters = function(paramSettings){
        var params = []; //will contain the parameters to be set
        //verify settings
        ParamSearch:
        for (var c = 0; c < paramSettings.length; c++){
            var setting = paramSettings[c];
            var titles = setting.title.split('|');
            if (titles.length != 3){
                return 'A parameter title was invalid.';
            }
            var found = false;
            for (var i = 0; i < this.parameters.length; i++){
                var section = this.parameters[i];
                if (section.title == titles[0]){
                    for (var j = 0; j < section.subSections.length; j++){
                        var subSection = section.subSections[j];
                        if (subSection.title == titles[1]){
                            for (var k = 0; k < subSection.params.length; k++){
                                var param = subSection.params[k];
                                if (param.title == titles[2]){
                                    // TODO: perform type and value checking
                                    params.push(param);
                                    continue ParamSearch;
                                }
                            }
                            return 'A parameter was not found.'
                        }
                    }
                    return 'A parameter was not found.'
                }
            }
            return 'A parameter was not found.'
        }
        //use settings
        for (var i = 0; i < paramSettings.length; i++){
            params[i].value = paramSettings[i].value;
        }
    };
    //set mission (returns null on success, or an error message)
    this.setMission = function(mission){
        if (mission.waypoints.length == 0){
            return 'Mission has no waypoints.';
        }
        if (this.mode == 'auto'){
            return 'Currently doing a mission.';
        }
        if (this.mode == 'paused'){
            this.mode = 'idle';
        }
        this.mission = mission;
        this.missionIndex = 0;
        return null;
    };
    //get mission (returns an object on success, or an error message)
    this.getMission = function(){
        if (this.mission == null){
            return 'No current mission';
        }
        return this.mission;
    };
    //arm (returns null on success, or an error message)
    this.arm = function(){
        if (this.armed){
            return 'Vehicle already armed.';
        }
        if (this.mode == 'auto'){
            return 'Currently doing a mission.';
        }
        this.armed = true;
        return null;
    };
    //disarm (returns null on success, or an error message)
    this.disarm = function(){
        if (!this.armed){
            return 'Vehicle already disarmed.';
        }
        if (this.mode == 'auto'){
            return 'Currently doing a mission.';
        }
        this.armed = false;
        return null;
    };
    //start/resume (returns null on success, or an error message)
    this.start = function(fromBeginning){
        if (this.mode == 'auto'){
            return 'Vehicle is already doing a mission.';
        }
        if (this.mode == 'killed'){
            return 'Kill switch is active.';
        }
        if (this.battery == 0){
            return 'Battery is at 0%.';
        }
        if (!this.armed){
            return 'Vehicle is not armed.';
        }
        if (this.mission == null){
            return 'No current mission.';
        }
        if (this.mode == 'paused' && fromBeginning){
            this.missionIndex = 0;
        }
        this.mode = 'auto';
        this.speed = this.SPEED;
        return null;
    };
    //stop (returns null on success, or an error message)
    this.stop = function(){
        if (this.mode != 'auto'){
            return 'Vehicle is not doing a mission.';
        }
        this.mode = 'paused';
        this.speed = 0;
        return null;
    };
    //activate kill switch (returns null on success, or an error message)
    this.kill = function(){
        if (this.mode == 'killed'){
            return 'Kill switch is already active';
        }
        this.mode = 'killed';
        this.speed = 0;
        return null;
    }
    //de-activate kill switch (returns null on success, or an error message)
    this.unkill = function(){
        if (this.mode != 'killed'){
            return 'Kill switch is not active';
        }
        this.mode = 'idle';
        this.missionIndex = 0;
        return null;
    }
}
