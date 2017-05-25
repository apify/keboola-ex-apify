import fs from 'fs';
import csv from 'fast-csv';
import isThere from 'is-there';
import jsonfile from 'jsonfile';
import {
  EVENT_ERROR,
  EVENT_FINISH,
} from '../constants';

/**
 * This function just stores data to selected destination.
 * Data is appending to a file, the first one needs to have a header.
 */
export function createOutputFile(fileName, data) {
    return new Promise((resolve, reject) => {
        const headers = !isThere(fileName);
        const includeEndRowDelimiter = true;
        csv
      .writeToStream(fs.createWriteStream(fileName, { flags: 'a' }), data, { headers, includeEndRowDelimiter })
      .on(EVENT_ERROR, () => reject('Problem with writing data into output!'))
      .on(EVENT_FINISH, () => resolve('File created!'));
    });
}

/**
 * This function simply create a manifest file related to the output data
 */
export function createManifestFile(fileName, data) {
    return new Promise((resolve, reject) => {
        jsonfile.writeFile(fileName, data, {}, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve('Manifest created!');
            }
        });
    });
}
