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
        this.messenger.on('arm', (shouldArm, id) => {
            this.arm(shouldArm, id);
        });

        this.messenger.on('start', (fromBeginning, id) => {
            this.start(fromBeginning, id);
        });

        this.messenger.on('stop', (id) => {
            this.stop(id);
        });

        this.messenger.on('kill', (shouldKill, id) => {
            this.kill(shouldKill, id);
        });

        this.messenger.on('get_parameters', (id) => {
            this.messenger.sendGetParametersResponse(this.parameters, id);
        });

        this.messenger.on('get_mission', (id) => {
            if (this.mission === null) {
                this.messenger.sendFailureMessage('No uploaded mission', id);
                return;
            }

            this.messenger.sendGetMissionResponse(this.mission, id);
        });

        this.messenger.on('set_parameters', (newParams, id) => {
            this.setParameters(newParams, id);
        });

        this.messenger.on('set_mission', (newMission, id) => {
            this.setMission(newMission, id);
        });
    }

    /**
     * Arm or disarm, sending a Success or Failure message
     */
    arm(shouldArm, id) {
        if (shouldArm === this.armed) {
            this.messenger.sendFailureMessage(shouldArm ? 'Already armed' : 'Already disarmed', id);
            return;
        }

        if (this.mode === this.MODES.AUTO) {
            this.messenger.sendFailureMessage('Currently doing a mission', id);
            return;
        }

        this.armed = shouldArm;
        this.messenger.sendSuccessMessage(id);
    }

    /**
     * Start or resume, sending a Success or Failure message
     */
    start(fromBeginning, id) {
        if (this.mode === this.MODES.AUTO) {
            this.messenger.sendFailureMessage('Currently doing a mission', id);
        } else if (this.mode === this.MODES.KILLED) {
            this.messenger.sendFailureMessage('Kill switch is active', id);
        } else if (this.battery === 0) {
            this.messenger.sendFailureMessage('Battery is at 0%', id);
        } else if (!this.armed) {
            this.messenger.sendFailureMessage('Not armed', id);
        } else if (this.mission === null){
            this.messenger.sendFailureMessage('No uploaded mission', id);
        } else {
            if (this.mode === this.MODES.PAUSED && fromBeginning) {
                this.nextWaypointIndex = 0;
            }

            this.mode = this.MODES.AUTO;
            this.speed = this.MAX_SPEED;

            this.messenger.sendSuccessMessage(id);
        }
    }

    /**
     * Stop, sending a Success or Failure message
     */
    stop(id) {
        if (this.mode !== this.MODES.AUTO){
            this.messenger.sendFailureMessage('Not doing a mission', id);
            return;
        }

        this.mode = this.MODES.PAUSED;
        this.speed = 0;

        this.messenger.sendSuccessMessage(id);
    }

    /**
     * Activate or deactivate kill switch, sending a Success or Failure message
     */
    kill(shouldKill, id) {
        if (shouldKill === (this.mode === this.MODES.KILLED)) {
            this.messenger.sendFailureMessage('Kill switch already ' + (shouldKill ? '' : 'in') + 'active', id);
            return;
        }

        this.mode = shouldKill ? this.MODES.KILLED : this.mode.STOPPED;
        this.nextWaypointIndex = 0;
        this.speed = 0;

        this.messenger.sendSuccessMessage(id);
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
            this.messenger.sendAttentionMessage(msg, 0);
        }

        this.currentlyUpdating = false;
    }

    sendStatus() {
        let status = {
            lat: this.position.lat,
            lng: this.position.lng,
            heading: this.heading,
            speed: this.speed,
            battery: this.battery,
            armed: this.armed,
            mode: this.mode,
            signal: this.signal
        };

        this.messenger.sendStatusMessage(status, 0);
    }

    setMission(newMission, id) {
        if (newMission.waypoints.length === 0) {
            this.messenger.sendFailureMessage('Mission has no waypoints', id);
        } else if (this.mode == this.MODES.AUTO) {
            this.messenger.sendFailureMessage('Currently doing a mission', id);
        } else {
            if (this.mode == this.MODES.PAUSED) {
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
            this.messenger.sendSuccessMessage(id);
        }
    }

    setParameters(newParams, id) {
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

            this.messenger.sendFailureMessage('A parameter was not found', id);
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

        this.messenger.sendSuccessMessage(id);
    }
}

module.exports = Vehicle;
