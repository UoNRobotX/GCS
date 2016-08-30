var geolib = require('geolib')

//constructor for fake WAM-V
module.exports = function(){
    this.prevTime = Date.now(); //time of last update, in milliseconds since epoch
    this.BATTERY_LIFETIME = 10; //battery lifetime in hours
    this.SPEED = 20; //max speed (unrealistically, the fake WAM-V will always be at this speed or 0)
    this.position = {lat: -32.8883338, lng: 151.7075279};
    this.heading = 0;
    this.speed = 0; //speed in kmph
    this.battery = 100;
    this.armed = false;
    this.mode = 'idle';
    this.signal = 100; //unrealistically, for the fake WAM-V, this is always 100
    this.mission = null; //the vehicle's current mission
    this.missionIndex = 0; //if completing a mission, the index of the next waypoint
    this.parameters = {
        'Test Parameter 1': ['double', 3.2],
        'Test Parameter Group 1': {
            'Test Parameter 2': ['vec3', [3,-2.3,1000]]
        },
        'State Estimator': {
            'IMU': {
                'mag scale':  ['double',  0],
                'mag vector': ['vector3', [0,0,0]],
                'Rib':        ['mat3',    [0,0,0,0,0,0,0,0,0]],
                'rIBb':       ['vec3',    [0,0,0]],
                'gbBNi':      ['vec3',    [0,0,0]]
            }
        }
    };
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
    this.setParameter = function(name, value){
        var obj = this.parameters;
        var names = name.split('|');
        for (var i = 0; i < names.length; i++){
            if (obj.hasOwnProperty(names[i])){
                if (i < names.length-1){
                    obj = obj[names[i]];
                } else {
                    // TODO: perform parameter type checking
                    obj[names[i]].value = value;
                    return null;
                }
            } else {
                return 'Parameter not found';
            }
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
        return null;
    }
}
