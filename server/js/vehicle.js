//message constructor
function Msg(type, data){
    this.type = type;
    this.data = data;
}
Msg.prototype.TYPE = [ //a list of message types
    'status',           //message to client that contains vehicle location, heading, etc
    'upload_mission',   //message to server that contains a mission the vehicle is to use
    'download_mission', //message to client that contains the vehicle's current mission
    'arm',              //message to server that requests that the vehicle arm itself
    'disarm',           //message to server that requests that the vehicle disarm itself
    'start_mission',    //message to server that requests that the vehicle begin its mission
    'stop_mission',     //message to server that requests that the vehicle stop its mission
    'pause_mission',    //message to server that requests that the vehicle pause its mission
    'resume_mission',   //message to server that requests that the vehicle resume its mission
    'command_ack',      //message to client that indicates that the last command was received
    'error',            //message to client that indicates that the last command was invalid
    //message data:
        //for STATUS, message data has this form: {
            //    location: {lat: lat1, lng: lng1},
            //    heading:  degrees1,
            //    speed:    metersPerSec1,
            //    battery:  percentage1,
            //    armed:    boolean1,
            //    mode:     mode1, //this will be one of: 'idle', 'auto', 'paused'
            //}
        //for UPLOAD_MISSION and DOWNLOAD_MISSION, message data has this form:
            //[{lat: lat1, lng: lng1}, ...]
        //for ERROR, message data is a string containing an error message
        //for the rest, message data is null
];

//returns a message with random fields
function randomMsg(){
    var msg = new Msg(null, null);
    //random type
    msg.type = msg.TYPE[Math.floor(Math.random() * msg.TYPE.length)];
    //random data
    switch (msg.type){
        case 'status': {
            msg.data = {
                location: {lat: -90 + Math.random()*180, lng: -180 + Math.random()*360},
                heading: Math.random()*360,
                speed: Math.random()*20,
                battery: Math.min(Math.random()*101, 100),
                armed: Math.random() < 0.5 ? true : false,
                mode: ['idle', 'auto', 'paused'][Math.floor(Math.random()*3)],
            };
            break;
        }
        case 'upload_mission': 
        case 'download_mission': {
            msg.data = [];
            for (var i = 0; i < 3; i++){
                msg.data.push({lat: -90 + Math.random()*180, lng: -180 + Math.random()*360});
            }
            break;
        }
        case 'arm': 
        case 'disarm': 
        case 'start_mission': 
        case 'stop_mission': 
        case 'resume_mission': 
        case 'command_ack': {
            msg.data = null;
            break;
        }
        case 'error': {
            msg.data = 'test error message'; 
            break;
        }
    }
    return msg;
}

//returns a generated message
exports.getMsg = function(){
    return randomMsg();
}
