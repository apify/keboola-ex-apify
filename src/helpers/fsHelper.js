import fs from 'fs';
import csv from 'fast-csv';
import isThere from 'is-there';
import jsonfile from 'jsonfile';
import {
  EVENT_ERROR,
  EVENT_FINISH,
} from '../constants';

/**
 * Saves data to selected destination.
 * Data appends to a file, the first one needs to have a header.
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
