var geolib = require('geolib')

//constructor for fake WAM-V
module.exports = function(){
    this.prevTime = Date.now(); //time of last update, in milliseconds since epoch
    this.BATTERY_LIFETIME = 10; //battery lifetime in hours
    this.SPEED = 20; //vehicle speed (unrealistically, the fake WAM-V will always be at this speed or 0)
    this.position = {lat: -32.8883338, lng: 151.7075279};
    this.heading = 0;
    this.speed = 0; //speed in kmph
    this.battery = 100;
    this.armed = false;
    this.mode = 'idle';
    this.mission = null;
    this.missionIndex = -1;
    this.parameters = {
        'State Estimator': {
            'IMU': {
                'mag scale':  {type: 'double',  value: 0},
                'mag vector': {type: 'vector3', value: [0,0,0]},
                'Rib':        {type: 'mat3',    value: [0,0,0,0,0,0,0,0,0]},
                'rIBb':       {type: 'vec3',    value: [0,0,0]},
                'gbBNi':      {type: 'vec3',    value: [0,0,0]}
            }
        }
    };
    //update fake WAM-V
        //returns null, or a string if something important has happened
    this.update = function(){
        var ret = ''; //return value
        var time = Date.now();
        var dt = (time - this.prevTime) * 1000; //time since last update, in seconds
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
                //
                this.heading = geolib.getBearing(pos, wpPos);
                if (travelDist < dist){
                    travelDist = 0;
                    var newPos = geolib.computeDestinationPoint(pos, travelDist, this.heading);
                    this.position = {lat: newPos.latitude, lng: newPos.longitude};
                } else {
                    travelDist -= dist;
                    this.position = wp.position;
                    this.missionIndex++;
                }
            }
            if (this.missionIndex == waypoints.length){
                ret += 'Mission completed. ';
                this.speed = 0;
                this.mode = 'idle';
            }
        }
        //update battery
        if (this.battery <= maxBatDec){
            this.battery = 0;
            this.speed = 0;
            this.armed = false;
            this.mode = 'idle';
            ret += 'Battery has reached 0%. ';
        } else {
            this.battery -= maxBatDec;
        }
        //return a message or null
        return ret == '' ? null : ret;
    };
    //returns a generated status message
    this.getStatusData = function(){
        return {
            position: this.position,
            heading:  this.heading,
            speed:    this.speed,
            battery:  this.battery,
            armed:    this.armed,
            mode:     this.mode
        };
    };
    //return paramters
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
    }
}
