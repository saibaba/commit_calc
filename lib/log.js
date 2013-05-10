var config = require('./config');

function log(msg) {
    if (config.debug) console.log(msg);
}

module.exports = log;
