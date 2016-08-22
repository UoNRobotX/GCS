
//returns a message with random fields
function randomStatusData(){
    return {
        location: {lat: -90 + Math.random()*180, lng: -180 + Math.random()*360},
        heading: Math.random()*360,
        speed: Math.random()*20,
        battery: Math.min(Math.random()*101, 100),
        armed: Math.random() < 0.5 ? true : false,
        mode: ['idle', 'auto', 'paused'][Math.floor(Math.random()*3)],
    };
}

//returns a generated message
exports.getStatusData = function(){
    return randomStatusData();
}
