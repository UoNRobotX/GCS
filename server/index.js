var koa = require('koa');
var path = require('path');
var openUrl = require('openurl');
var serve = require('koa-static');

var app = koa();

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

app.listen(3000);

openUrl.open('http://localhost:3000');
