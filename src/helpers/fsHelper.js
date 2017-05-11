import fs from 'fs';
import tmp from 'tmp';
import path from 'path';
import csv from 'fast-csv';
import isThere from 'is-there';
import jsonfile from 'jsonfile'
import {
  EVENT_CLOSE,
  EVENT_ERROR,
  EVENT_FINISH
} from '../constants';

/**
 * This function creates a tmp directory and returns a valid path
 * which will be used later for storing the files.
 */
export function createTmpDirectory() {
  return new Promise((resolve, reject) => {
    tmp.dir((error, path, cleanupCallback) => {
      if (error) {
        reject(error);
      }
      resolve({ path, cleanupCallback });
    });
  });
}

/**
 * This function just stores data to selected destination.
 * Data is appending to a file, the first one needs to have a header.
 */
export function createOutputFile(fileName, data) {
  return new Promise((resolve, reject) => {
    const headers = !isThere(fileName);
    const includeEndRowDelimiter = true;
    csv
      .writeToStream(fs.createWriteStream(fileName, {'flags': 'a'}), data, { headers, includeEndRowDelimiter })
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

/**
 * This functions transfer files from one directory into another one
 */
export function transferFilesBetweenDirectories(sourceDir, destinationDir, fileName) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(path.join(sourceDir, fileName));
    readStream.on(EVENT_ERROR, error => {
      reject(error)
    });
    const writeStream = fs.createWriteStream(path.join(destinationDir, fileName));
    writeStream.on(EVENT_ERROR, error => {
      reject(error);
    });
    writeStream.on(EVENT_CLOSE, result => {
      resolve(`file ${fileName} created!`);
    });
    readStream.pipe(writeStream);
  });
}
