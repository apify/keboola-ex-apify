const fs = require('fs');
const jsonfile = require('jsonfile');
const util = require('util');

/**
 * Saves Object as JSON into fileName
 */
function saveJson(json, fileName) {
    return new Promise((resolve, reject) => {
        jsonfile.writeFile(fileName, json, {}, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve('JSON saved!');
            }
        });
    });
}

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
function createFilePromised(fileName, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, data, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * Append data to fileName promised
 */
function appendFilePromised(fileName, data) {
    return new Promise((resolve, reject) => {
        fs.appendFile(fileName, data, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

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
const fileStatPromied = util.promisify(fs.stat);

/**
 * Get folder files
 */
const readDirPromised = util.promisify(fs.readdir);

/**
 * Read file
 */
const readFilePromised = util.promisify(fs.readFile);

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
