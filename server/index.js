var http = require('http');
var koa = require('koa');
var path = require('path');
var openUrl = require('openurl');
var serve = require('koa-static');
var fs = require('fs');
var child_process = require('child_process');
var SocketIoManager = require('./js/SocketIoManager.js');

var app = koa();

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

// Create server
var server = http.createServer(app.callback());

//obtain names of files used for vehicle-server communication
    // TODO: when the files are FIFOs, 'npm start' works once, but later attempts exit prematurely
var inputFile  = path.join(__dirname, 'temp/toServer');
var outputFile = path.join(__dirname, 'temp/toVehicle');

//create input and output files if non-existent, and truncate if non-FIFO
function createIfNonExistent(file){
    var openAndTruncate = true;
    try {
        var stats = fs.statSync(file);
        if (stats.isFIFO()){
            openAndTruncate = false;
        }
    } catch (e){}
    if (openAndTruncate){
        var fd = fs.openSync(file, 'w');
        fs.closeSync(fd);
    }
}
createIfNonExistent(inputFile);
createIfNonExistent(outputFile);

// Setup socket handling
var sm = new SocketIoManager(server, inputFile, outputFile);

var useFakeVehicle = true;
if (useFakeVehicle){
    //create fake vehicle child process
    var childp = child_process.spawn(
        'node',
        [path.join(__dirname, 'js/vehicle.js'), outputFile, inputFile]
    );
    childp.stdout.on('data', function(data){console.log(data.toString())});
    childp.stderr.on('data', function(data){console.error(data.toString())});
    //close child process on shutdown
    process.on('exit', function(){
        childp.kill();
    });
}

server.listen(3000);

openUrl.open('http://localhost:3000');
