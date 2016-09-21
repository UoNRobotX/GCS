'use strict';

let VehicleMessenger = require('../vehicle-messenger');
let Serial = require('../serial');
let protobuf = require('protobufjs');
let path = require('path');

function setupSerial() {
    let protoBuilder = protobuf.loadProtoFile(
        path.join(__dirname, '../../public/assets/proto/Test.proto')
    );

    let protoPkg = protoBuilder.build();

    // let s = new Serial('../temp/input', '../temp/output', 9600);
    // let buffer = (new protoPkg.Command(0)).toBuffer();

    // s.writeData(1, buffer, 0);
}

let v = new VehicleMessenger('../temp/input', '../temp/output', 9600);

// v.sendFailureMessage('Test', 0);
// v.sendSuccessMessage(0);

v.on('arm', function(shouldArm, id) {
    console.log('Arm', shouldArm, id);
});
