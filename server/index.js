var http = require('http');
var koa = require('koa');
var path = require('path');
var openUrl = require('openurl');
var serve = require('koa-static');
var socket_io = require('socket.io');

var app = koa();

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

var server = http.createServer(app.callback());

//test socket.io
var io = socket_io(server);
io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('disconnected');
    });
    socket.on('test', (data) => {
        console.log('test message received');
        console.log(data);
    });
    console.log('connected');
    socket.emit('test', {data: 'data'});
});

server.listen(3000);

openUrl.open('http://localhost:3000');
