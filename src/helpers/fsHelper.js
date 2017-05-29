import fs from 'fs';
import jsonfile from 'jsonfile';

/**
 * Saves Object as JSON into fileName
 */
export function saveJson(json, fileName) {
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
export function loadJson(fileName) {
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
 * Saves data to fileName
 */
export function createOutputFile(fileName, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, data, (err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
}
