'use strict';

let http = require('http');
let koa = require('koa');
let path = require('path');
let openUrl = require('openurl');
let serve = require('koa-static');
let fs = require('fs');
let child_process = require('child_process');
let SocketIoManager = require('./modules/SocketIoManager.js');

// Variables
let inputFile  = path.join(__dirname, 'temp/toServer'); //used to get messages from vehicle
let outputFile = path.join(__dirname, 'temp/toVehicle'); //used to send messages to vehicle
    //'inputFile' and 'outputFile' should be either both regular files, or both serial ports
let useFakeVehicle = false; //if true, fake vehicle child process will be started
let baudRate = 9600; //if using serial ports, used as the baud rate

// Check command line arguments
let usage = 'Usage: node index.js [-f] [-b baudRate] [inputFile [outputFile]]';
for (let i = 2; i < process.argv.length; i++){
    let arg = process.argv[i];
    if (arg == '-f'){
        useFakeVehicle = true;
    } else if (arg == '-b'){
        if (i+1 == process.argv.length){
            console.error('Option -b has no argument');
            console.error(usage);
            process.exit();
        }
        baudRate = Number(process.argv[i+1]);
        i++;
    } else {
        inputFile = arg;
        if (i+1 < process.argv.length){
            outputFile = process.argv[i+1];
            if (i+2 < process.argv.length){
                console.log('Unexpected arguments');
                console.error(usage);
                process.exit();
            }
        }
        break;
    }
}

console.log('serial',inputFile,'baud',baudRate);

// Create Koa application
let app = koa();

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

// Create server
let server = http.createServer(app.callback());

// Create input and output files if non-existent, and truncate if regular file
function createIfNonExistent(file){
    let openAndTruncate = false;
    try {
        let stats = fs.statSync(file);
        if (stats.isFile()){
            openAndTruncate = true;
        }
    } catch (e){
        openAndTruncate = true;
    }
    if (openAndTruncate){
        let fd = fs.openSync(file, 'w');
        fs.closeSync(fd);
    }
}
createIfNonExistent(inputFile);
createIfNonExistent(outputFile);

// Setup socket handling
let sm = new SocketIoManager(server, inputFile, outputFile, baudRate);

if (useFakeVehicle){
    //create fake vehicle child process
    let childp = child_process.spawn(
        'node',
        [path.join(__dirname, 'vehicle/index.js'), '-b', baudRate, outputFile, inputFile]
    );
    childp.stdout.on('data', (data) => {console.log(data.toString())});
    childp.stderr.on('data', (data) => {console.error(data.toString())});
    childp.on('error', () => {
        console.log('Error with spawning or killing fake vehicle process');
        childp = null;
        process.exit();
    });
    //close child process on shutdown
    process.on('exit', () => {
        if (childp != null){
            childp.kill();
        }
    });
}

server.listen(3000);

//openUrl.open('http://localhost:3000');
