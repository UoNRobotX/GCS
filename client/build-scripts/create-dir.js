var fs = require('./fs');
var path = require('path');

fs.createDir(path.join(__dirname, '../../server/public'))
    .then(function() {
        return fs.createDir(path.join(__dirname, '../../server/public/assets'))
    })
    .then(function() {
        return fs.createDir(path.join(__dirname, '../../server/public/assets/images'))
    })
    .then(function() {
        console.log('create:dir Done');
    })
    .catch(function(error) {
        console.error(error);
    });
