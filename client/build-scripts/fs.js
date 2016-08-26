var fs = require('fs');
var Promise = require('bluebird');

/**
 * A basic Promise wrapper around node's fs.mkdir
 *
 * @param  {String} dirpath - The path to create
 * @return {Promise}
 */
function createDir(dirpath) {
    return new Promise(function(resolve, reject) {
        fs.mkdir(dirpath, function(error) {
            if (error) {
                reject(error);
            }

            resolve();
        });
    });
}

module.exports = {
    createDir: createDir
};
