const nconf = require('nconf');
const isThere = require('is-there');
const fs = require('fs');

/**
 * Reads the config and parse the input JSON object.
 * If requested file doesn't exist, program stops.
 */
module.exports = function getConfig(configPath) {
    if (isThere(configPath)) {
        console.log('Raw config file:');
        console.log(fs.readFileSync(configPath).toString());
        return nconf.env().file(configPath);
    }
    console.error('No configuration specified!');
    process.exit(1);
};
