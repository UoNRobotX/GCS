'use strict';

let Serial = require('./serial');

let s = new Serial('../temp/input', '../temp/output', 9600);

s.writeData(0, new Buffer('Some data'), 0);
s.on('packet', function(type, data, id) {
    console.log('Packet received', type, data, id);
});
