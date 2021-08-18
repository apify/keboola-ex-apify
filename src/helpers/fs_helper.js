const fs = require('fs');
const jsonfile = require('jsonfile');
const { promisify } = require('util');

/**
 * Loads Object in JSON format from fileName
 */
async function loadJson(fileName) {
    if (!fs.existsSync(fileName)) {
        return {};
    }
    try {
        const obj = await jsonfile.readFile(fileName, {});
        return obj;
    } catch (err) {
        return {};
    }
}

/**
 * Saves data to fileName promised
 */
const createFilePromised = promisify(fs.writeFile);

/**
 * Append data to fileName promised
 */
const appendFilePromised = promisify(fs.appendFile);

/**
 * Create folder promised
 */
function createFolderPromised(dir) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, (err) => {
            if (err && err.code !== 'EEXIST') return reject(err);
            resolve();
        });
    });
}

/**
 * Check file/folder stats
 */
const fileStatPromied = promisify(fs.stat);

/**
 * Get folder files
 */
const readDirPromised = promisify(fs.readdir);

/**
 * Read file
 */
const readFilePromised = promisify(fs.readFile);

module.exports = {
    saveJson: jsonfile.writeFile,
    loadJson,
    createFilePromised,
    appendFilePromised,
    createFolderPromised,
    fileStatPromied,
    readDirPromised,
    readFilePromised,
};
