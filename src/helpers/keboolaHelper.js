import { first } from 'lodash';
import { IS_INCREMENTAL } from '../constants';

/**
 * This is a simple helper that checks whether the input configuration is valid.
 * If so, the particular object with relevant parameters is returned.
 * Otherwise, an error is thrown.
 */
export function parseConfiguration(configObject) {
  return new Promise((resolve, reject) => {
    const action = configObject.get('action') || 'run';

    const userId = configObject.get('parameters:userId');
    if (!userId) {
      reject('Parameter userId is not defined!');
    }
    const token = configObject.get('parameters:#token');
    if (!token) {
      reject('Parameter token is not defined!');
    }

    if (action === 'listCrawlers') {
      resolve({
        action,
        userId,
        token,
      });
    } else {
      const crawlerId = configObject.get('parameters:crawlerId');
      if (!crawlerId) {
        reject('Parameter crawlerId is not defined!');
      }

      const crawlerSettings = configObject.get('parameters:crawlerSettings') || {};

      resolve({
        action,
        userId,
        token,
        crawlerId,
        crawlerSettings,
      });
    }
  });
}

/**
 * This function prepares object containing metadata required for writing
 * output data into Keboola (output files & manifests).
 */
export function getKeboolaStorageMetadata(tableOutDir, bucketName, fileName) {
  const incremental = IS_INCREMENTAL;
  const destination = `${bucketName}.${first(fileName.split('.'))}`;
  const manifestFileName = `${tableOutDir}/${fileName}.manifest`;
  return { fileName, incremental, destination, manifestFileName };
}
