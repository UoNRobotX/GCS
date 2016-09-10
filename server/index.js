var http = require('http');
var koa = require('koa');
var path = require('path');
var openUrl = require('openurl');
var serve = require('koa-static');
var SocketIoManager = require('./js/SocketIoManager.js');

var app = koa();

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

// Create server
var server = http.createServer(app.callback());

// Setup socket handling
var sm = new SocketIoManager(server);

server.listen(3000);

openUrl.open('http://localhost:3000');
