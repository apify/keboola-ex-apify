const fs = require('fs');
const jsonfile = require('jsonfile');
const { promisify } = require('util');

/**
 * Saves Object as JSON into fileName
 */
const saveJson = promisify(jsonfile.writeFile);

/**
 * Loads Object in JSON format from fileName
 */
function loadJson(fileName) {
    return new Promise((resolve) => {
        if (!fs.existsSync(fileName)) {
            resolve({});
        } else {
            jsonfile.readFile(fileName, {}, (error, obj) => {
                if (error) {
                    resolve({});
                } else {
                    resolve(obj);
                }
            });
        }
    });
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
    saveJson,
    loadJson,
    createFilePromised,
    appendFilePromised,
    createFolderPromised,
    fileStatPromied,
    readDirPromised,
    readFilePromised,
};
