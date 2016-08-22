var http = require('http');
var koa = require('koa');
var path = require('path');
var openUrl = require('openurl');
var serve = require('koa-static');
var socket_io = require('socket.io');
var Vehicle = require('./js/vehicle.js');

var app = koa();

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

var server = http.createServer(app.callback());

//use socket.io to periodically send WAM-V data
var io = socket_io(server);
io.on('connection', function(socket){
    //for a new connection print a message
    var host = socket.client.request.headers.host;
    console.log('connected to: ' + host);
    //periodically send data
    var timer = setInterval(function(){
        var msg = Vehicle.getMsg();
        if (msg.type == 'status'){
            socket.volatile.emit('msg', msg); //status messages can be dropped
        } else {
            socket.emit('msg', msg);
        }
        console.log('sent message to: ' + host);
    }, 3000);
    //when the connection ends, print a message
    socket.on('disconnect', function(){
        clearInterval(timer);
        console.log('disconnected from: ' + host);
    });
});

server.listen(3000);

openUrl.open('http://localhost:3000');
