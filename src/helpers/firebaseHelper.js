import path from 'path';
import https from 'https';
import moment from 'moment';
import {
  size,
  first,
  groupBy,
  isArray,
  replace,
  isNumber,
  toString,
  includes,
  isUndefined
} from 'lodash';
import {
  initializeApp
} from 'firebase';
import {
  createOutputFile,
  createManifestFile
} from './fsHelper';
import {
  getKeboolaStorageMetadata
} from './keboolaHelper';
import {
  EVENT_END,
  EVENT_DATA,
  EVENT_ERROR,
  EVENT_FINISH
} from '../constants';

/**
 * This function loop throught database and generate array of promises
 * which will be used later.
 */
export function generateDataArray({ apiKey, domain, endpoint, pageCount, pageSize, keys }) {
  const data = [];
  for (let i = 0; i < pageCount; i++) {
    const key = keys[i * pageSize];
    const limitToFirst = pageSize;
    const startAt = key;
    const shallow = false;
    const promise = fetchData({ domain, endpoint, apiKey, limitToFirst, startAt, shallow });
    data.push(promise);
  }
  return data;
}


export function fetchData({ domain, endpoint, apiKey, shallow, limitToFirst, startAt }) {
  return new Promise((resolve, reject) => {
    const url = getUrl({
      domain,
      apiKey,
      shallow,
      startAt,
      endpoint,
      limitToFirst
    });
    https.get(url, response => {
      // Continuously update stream with data
      let body = '';
      response.on(EVENT_DATA, data => {
          body += data;
      });
      response.on(EVENT_ERROR, error => reject(error));
      response.on(EVENT_END, () => {
        resolve(JSON.parse(body));
      });
    });
  });
}

/**
 * This function just group data by event type.
 */
export function groupDataByEventType(input) {
  return groupBy(input, 'eventType');
}

/**
 * This function generates output promises which lead into creating output files.
 */
export function generateOutputFiles(outputDirectory, data) {
  return Object
    .keys(data)
    .map(key => createOutputFile(path.join(outputDirectory, `${replace(key,'.', '_')}.csv`), data[key]));
}

/**
 * This function generates output manifests which help to upload data into KBC
 */
export function generateOutputManifests(outputDirectory, bucketName, files) {
  return files
    .map(key => {
      const {
        fileName,
        incremental,
        destination,
        manifestFileName
      } = getKeboolaStorageMetadata(outputDirectory, bucketName, key);
      return createManifestFile(manifestFileName, { destination, incremental });
    });
}


/**
 * This function reads input data and prepare the output objects suitable for CSV output.
 */
export function prepareDataForOutput(data) {
  return mergeFirebaseIdWithObject(
    convertArrayOfObjectsIntoObject(
      Object.keys(data)
        .map(object => {
          return { [ object ]: normalizeOutput(data[object])};
        }
      )
    )
  );
}

/**
 * This function reads all fields except data array itself and returns object
 * which is going to be included in the final result.
 */
export function getParentData(object) {
  return Object.keys(object).reduce((previous, current) => {
    if (!isArray(object[current])) {
      return { ...previous, [ current ] : convertEpochToDateIfAvailable(object[current]) };
    }
  }, {});
}

/**
 * This function detects whether the input is in epoch date format.
 * If so, the function returns a converted value, otherwise the original
 * value is returned.
 */
export function convertEpochToDateIfAvailable(value) {
  return isNumber(value) && toString(value).length === 10
    ? moment(value, 'X').utc().format("YYYY-MM-DD HH:mm:ss.SSS")
    : isNumber(value) && toString(value).length === 13
    ? moment(value, 'x').utc().format("YYYY-MM-DD HH:mm:ss.SSS")
    : value;
}

/**
 * This function detects whether a particular value is an array.
 * If so, join the values together, otherwise it
 * returns just a value.
 */
export function convertArrayToStringIfAvailable(object) {
  return Object.keys(object).reduce((previous, current) => {
      return isArray(object[current])
        ? { ...previous, [ current ] : object[current].join(',') }
        : { ...previous, [ current ] : object[current] }
  }, {});
}

/**
 * This function gets data for particular firebaseId and return object.
 */
export function normalizeOutput(data) {
  const parentObject = getParentData(data);
  return size(data['data']) > 0
    ? data['data'].map(event => {
      const test = convertArrayToStringIfAvailable(event);
      if (parentObject.eventType === 'entity.create') {
        return Object.assign({}, parentObject, convertArrayToStringIfAvailable(event));
      } else if (parentObject.eventType === 'entity.edit') {
        const { intervall, key, valuePost, valuePre } = convertArrayToStringIfAvailable(event);
        return Object.assign({}, parentObject, {intervall: isUndefined(intervall) ? '' : intervall, key, valuePost, valuePre});
      }
    }) : null;
}

/**
 * Convert array of object into single object.
 */
export function convertArrayOfObjectsIntoObject(input) {
  return input.reduce((memo, object) => {
    const key = first(Object.keys(object));
    memo[key] = object[key];
    return memo;
  }, {});
}

/**
 * Merge firebaseId with the other attributes
 */
export function mergeFirebaseIdWithObject(data) {
  return Object.keys(data)
    .map(element => {
      return data[element]
        .map(object => {
          return Object.assign({}, { ...object, firebaseId: element } )
        });
    });
}

/**
 * This function compose url for further processing.
 */
export function getUrl({ domain, endpoint, limitToFirst, startAt, apiKey, shallow }) {
  const baseUrl = `https://${domain}.firebaseio.com/${endpoint}.json`;
  const authParam = `auth=${apiKey}`;
  const params = !shallow
    ? `orderBy=%22$key%22&limitToFirst=${parseInt(limitToFirst)}&startAt=%22${startAt}%22`
    : 'shallow=true';
  return `${baseUrl}?${params}&${authParam}`;
}
