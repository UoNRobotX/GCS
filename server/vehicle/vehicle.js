'use strict';

let geolib = require('geolib');
let VehicleMessenger = require('./vehicle-messenger');

class Vehicle {
    constructor(inputFile, outputFile, baudRate) {
        this.lastUpdateTime = Date.now();
        this.currentlyUpdating = false;

        this.MODES = {
            STOPPED:    0,
            AUTO:       1,
            PAUSED:     2,
            KILLED:     3
        };

        this.PARAM_TYPES = {
            DOUBLE: 0,
            VEC3:   1,
            MAT3:   2
        };

        this.BATTERY_LIFETIME = 10; // battery lifetime in hours
        this.MAX_SPEED = 30; // max speed (unrealistically, the fake WAM-V will always be at this speed or 0)

        this.position = {
            lat: 21.308731,
            lng: -157.888815
        };

        this.heading = 0;
        this.speed = 0; // speed in kmph
        this.battery = 100;
        this.armed = false;
        this.mode = this.MODES.STOPPED;
        this.signal = 100; // unrealistically, for the fake WAM-V, this is always 100
        this.mission = null; // the vehicle's current mission
            //{title: t1, origin: {lat: lat1, lng: lng1},
            //waypoints: [{title: t2, type: t3, position: {lat: lat1, lng: lng1}}, ...]}
        this.nextWaypointIndex = 0; //if completing a mission, the index of the next waypoint
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

        this.messenger = new VehicleMessenger(inputFile, outputFile, baudRate);

        // Periodically update the fake vehicle
        setInterval(() => {
            this.updateState();
        }, 100);

        // Periodically send Status messages
        setInterval(() => {
            this.sendStatus();
        }, 100);

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.messenger.on('arm', (shouldArm) => {
            this.arm(shouldArm);
        });

        this.messenger.on('start', (fromBeginning) => {
            this.start(fromBeginning);
        });

        this.messenger.on('stop', () => {
            this.stop();
        });

        this.messenger.on('kill', (shouldKill) => {
            this.kill(shouldKill);
        });

        this.messenger.on('get_parameters', () => {
            this.messenger.sendGetParametersResponse(this.parameters);
        });

        this.messenger.on('get_mission', () => {
            if (this.mission === null) {
                console.log('Unable to respond to GetMission request: No uploaded mission');
                return;
            }

            this.messenger.sendGetMissionResponse(this.mission);
        });

        this.messenger.on('set_parameters', (newParams) => {
            this.setParameters(newParams);
            this.messenger.sendSetParametersAck();
        });

        this.messenger.on('set_mission', (newMission) => {
            this.setMission(newMission);
            this.messenger.sendSetMissionAck();
        });
    }

    /**
     * Arm or disarm
     */
    arm(shouldArm) {
        if (shouldArm === this.armed) {
            console.log('Unable to arm: Already ' + (shouldArm ? 'armed' : 'disarmed'));
            return;
        }

        if (this.mode === this.MODES.AUTO) {
            console.log('Unable to arm: Currently doing a mission');
            return;
        }

        this.armed = shouldArm;
    }

    /**
     * Start or resume
     */
    start(fromBeginning) {
        if (this.mode === this.MODES.AUTO) {
            console.log('Unable to start/resume: Currently doing a mission');
        } else if (this.mode === this.MODES.KILLED) {
            console.log('Unable to start/resume: Kill switch is active');
        } else if (this.battery === 0) {
            console.log('Unable to start/resume: Battery is at 0%');
        } else if (!this.armed) {
            console.log('Unable to start/resume: Not armed');
        } else if (this.mission === null){
            console.log('Unable to start/resume: No uploaded mission');
        } else {
            if (this.mode === this.MODES.PAUSED && fromBeginning) {
                this.nextWaypointIndex = 0;
            }

            this.mode = this.MODES.AUTO;
            this.speed = this.MAX_SPEED;
        }
    }

    /**
     * Stop
     */
    stop() {
        if (this.mode !== this.MODES.AUTO){
            console.log('Unable to stop: Not doing a mission');
            return;
        }

        this.mode = this.MODES.PAUSED;
        this.speed = 0;
    }

    /**
     * Activate or deactivate kill switch
     */
    kill(shouldKill) {
        if (shouldKill === (this.mode === this.MODES.KILLED)) {
            if (shouldKill){
                console.log('Unable to kill: Kill switch already active');
            } else {
                console.log('Unable to unkill: Kill switch already inactive');
            }
            return;
        }

        this.mode = shouldKill ? this.MODES.KILLED : this.mode.STOPPED;
        this.nextWaypointIndex = 0;
        this.speed = 0;
    }

    updateState() {
        if (this.currentlyUpdating) {
            return;
        }

        this.currentlyUpdating = true;

        let msg = ''; // used to construct an 'Attention' message
        let time = Date.now();
        let dt = (time - this.lastUpdateTime) / 1000; //  time since last update, in seconds

        this.lastUpdateTime = time;

        // Update
        let maxBatDec = dt / (this.BATTERY_LIFETIME * 3600) * 100; // max battery decrease since last update
        if (this.battery <= maxBatDec) {
            dt *= this.battery / maxBatDec; //obtain the time period while the battery was active
        }

        if (this.mode === this.MODES.AUTO) {
            let waypoints = this.mission.waypoints;
            let pos = {latitude: this.position.lat, longitude: this.position.lng};
            let travelDist = dt * this.MAX_SPEED * 1000 / 3600; //maximum distance travelled, in meters

            while (travelDist > 0 && this.nextWaypointIndex < waypoints.length) {
                let wp = waypoints[this.nextWaypointIndex];
                let wpPos = {latitude: wp.position.lat, longitude: wp.position.lng};
                let dist = geolib.getDistance(pos, wpPos); //distance to waypoint

                // Move towards waypoint
                this.heading = geolib.getBearing(pos, wpPos);

                if (travelDist < dist) {
                    let newPos = geolib.computeDestinationPoint(pos, travelDist, this.heading);
                    this.position = {lat: newPos.latitude, lng: newPos.longitude};
                    travelDist = 0;
                } else {
                    travelDist -= dist;
                    this.position = wp.position;
                    this.nextWaypointIndex++;
                }
            }

            if (this.nextWaypointIndex === waypoints.length) {
                msg += 'Mission completed. ';
                this.speed = 0;
                this.mode = this.MODES.STOPPED;
                this.nextWaypointIndex = 0;
            }
        }

        if (this.battery <= maxBatDec) {
            if (this.battery != 0) {
                msg += 'Battery has reached 0%. ';
            }

            this.battery = 0;
            this.speed = 0;

            if (this.mode == this.MODES.AUTO) {
                this.mode = this.MODES.PAUSED;
            }
        } else {
            this.battery -= maxBatDec;
        }

        if (msg.length > 0) {
            this.messenger.sendAttentionMessage(msg);
        }

        this.currentlyUpdating = false;
    }

    sendStatus() {
        this.messenger.sendStatusMessage({
            lat: this.position.lat,
            lng: this.position.lng,
            heading: this.heading,
            speed: this.speed,
            battery: this.battery,
            armed: this.armed,
            mode: this.mode,
            signal: this.signal
        });
    }

    setMission(newMission) {
        if (newMission.waypoints.length === 0) {
            console.log('Unable to set mission: Mission has no waypoints');
        } else if (this.mode === this.MODES.AUTO) {
            console.log('Unable to set mission: Currently doing a mission');
        } else {
            if (this.mode === this.MODES.PAUSED) {
                this.mode = this.MODES.STOPPED;
            }

            this.mission = {
                title: newMission.title,
                origin: {
                    lat: newMission.originLatitude,
                    lng: newMission.originLongitude
                },
                waypoints: newMission.waypoints.map(function(wp) {
                    return {
                        title: wp.title,
                        type: wp.type,
                        position: {
                            lat: wp.latitude,
                            lng: wp.longitude
                        }
                    }
                })
            };

            this.nextWaypointIndex = 0;
        }
    }

    setParameters(newParams) {
        // Verify new parameters
        let paramsToSet = [];
        let i, j;

        ParamSearch:
        for (i = 0; i < newParams.parameters.length; i++) {
            let newParam = newParams.parameters[i];

            for (j = 0; j < this.parameters.length; j++) {
                let param = this.parameters[j];

                if (newParam.section === param[0] &&
                    newParam.subSection === param[1] &&
                    newParam.title === param[2]) {
                    // TODO: perform type and value checking
                    paramsToSet.push(j);
                    continue ParamSearch;
                }
            }

            console.log('Unable to set parameters: A parameter was not found');
            return;
        }

        // Set parameters
        for (i = 0; i < newParams.parameters.length; i++) {
            this.parameters[paramsToSet[i]] = [
                newParams.parameters[i].section,
                newParams.parameters[i].subSection,
                newParams.parameters[i].title,
                newParams.parameters[i].type,
                newParams.parameters[i].value
            ];
        }
    }
}

module.exports = Vehicle;
