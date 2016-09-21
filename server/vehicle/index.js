'use strict';

let path = require('path');
let Vehicle = require('./vehicle');

let inputFile = path.join(__dirname, '../temp/toVehicle');
let outputFile = path.join(__dirname, '../temp/toServer');
let baudRate = 9600;

// Check command line arguments
let usage = 'Usage: node index.js [-b baudRate] [inputFile [outputFile]]';

for (let i = 2; i < process.argv.length; i++) {
    let arg = process.argv[i];

    if (arg === '-b') {
        if (i + 1 === process.argv.length) {
            console.error('Option -b has no argument');
            console.error(usage);
            process.exit();
        }

        baudRate = Number(process.argv[i + 1]);
        i++;
    } else {
        inputFile = arg;

        if (i + 1 < process.argv.length) {
            outputFile = process.argv[i + 1];

            if (i + 2 < process.argv.length) {
                console.log('Unexpected arguments');
                console.error(usage);
                process.exit();
            }
        }

        break;
    }
}

let vehicle = new Vehicle(inputFile, outputFile, baudRate);
