import nconf from 'nconf';
import isThere from 'is-there';

/**
 * This function simply reads the config and parse the input JSON object.
 * If requested file doesn't exist, program stop running.
 */
export default function getConfig(configPath) {
    if (isThere(configPath)) {
        return nconf.env().file(configPath);
    }
    console.error('No configuration specified!');
    process.exit(1);
}
