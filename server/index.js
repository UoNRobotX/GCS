var http = require('http');
var koa = require('koa');
var path = require('path');
var openUrl = require('openurl');
var serve = require('koa-static');
var fs = require('fs');
var child_process = require('child_process');
var SocketIoManager = require('./js/SocketIoManager.js');

//names of files used for vehicle-server communication
//these should be either both regular files, both FIFOs, or both serial ports
var inputFile  = path.join(__dirname, 'temp/toServer');
var outputFile = path.join(__dirname, 'temp/toVehicle');
//if true, a child process will be started, which acts like the WAM-V
var useFakeVehicle = false;
//if 'inputFile' and 'outputFile' are serial ports, this is used as the baud rate
var baudRate = 9600;

//check command line arguments
var usage = 'Usage: node index.js [-f] [-b baudRate] [inputFile [outputFile]]';
for (var i = 2; i < process.argv.length; i++){
    var arg = process.argv[i];
    if (arg == '-f'){
        useFakeVehicle = true;
    } else if (arg == '-b'){
        if (i+1 == process.argv.length){
            console.error('Option -b has no argument');
            console.error(usage);
            process.exit();
        }
        baudRate = +process.argv[i+1];
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

// Create Koa application
var app = koa();

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

// Create server
var server = http.createServer(app.callback());

//create input and output files if non-existent, and truncate if non-FIFO
function createIfNonExistent(file){
    var openAndTruncate = false;
    try {
        var stats = fs.statSync(file);
        if (stats.isFile()){
            openAndTruncate = true;
        }
    } catch (e){
        openAndTruncate = true;
    }
    if (openAndTruncate){
        var fd = fs.openSync(file, 'w');
        fs.closeSync(fd);
    }
}
createIfNonExistent(inputFile);
createIfNonExistent(outputFile);

// Setup socket handling
var sm = new SocketIoManager(server, inputFile, outputFile, baudRate);

if (useFakeVehicle){
    //create fake vehicle child process
    var childp = child_process.spawn(
        'node',
        [path.join(__dirname, 'js/vehicle.js'), '-b', baudRate, outputFile, inputFile]
    );
    childp.stdout.on('data', function(data){console.log(data.toString())});
    childp.stderr.on('data', function(data){console.error(data.toString())});
    childp.on('error', function(){
        console.log('Error with spawning or killing fake vehicle process');
        childp = null;
        process.exit();
    })
    //close child process on shutdown
    process.on('exit', function(){
        if (childp != null){
            childp.kill();
        }
    });
}

server.listen(3000);

openUrl.open('http://localhost:3000');
