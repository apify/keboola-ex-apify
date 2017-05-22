import _ from 'underscore';
import request from 'request';

import { sleep } from 'wait-promise';

import { APIFY_API_BASE_URL } from '../constants';

/**
 * Promised version of request(options) function.
 */
const requestPromise = (options) => {
  const method = _.isString(options.method) ? options.method.toLowerCase() : options.method;

  if (!method) throw new Error('"options.method" parameter must be provided');
  if (!request[method]) throw new Error('"options.method" is not a valid http request method');

  return new Promise((resolve, reject) => {
    // We have to use request[method]({ ... }) instead of request({ method, ... })
    // to be able to mock request when unit testing requestPromise().
    request[method](options, (error, response, body) => {
      if (error) return reject(error);

      return resolve(body);
    });
  });
};

export function startCrawler(crawler, params = {}, userId, token) {
  params.token = token;

  const queryString = objectToQueryString(params);
  const requestParams = {
    url: `${APIFY_API_BASE_URL}/${userId}/crawlers/${crawler}/execute${queryString}`,
    method: 'POST',
    json: true,
    resolveWithFullResponse: true,
  };

  return requestPromise(requestParams);
}

export function getExecution(execution) {
  const requestParams = {
    url: `${APIFY_API_BASE_URL}/execs/${execution}`,
    method: 'GET',
    json: true,
    resolveWithFullResponse: true,
  };

  return requestPromise(requestParams);
}

export function getExecutionResults(execution) {
  const requestParams = {
    url: `${APIFY_API_BASE_URL}/execs/${execution}/results`,
    method: 'GET',
    json: true,
    resolveWithFullResponse: true,
  };

  return requestPromise(requestParams);
}

// todo: add timeout
export async function waitUntilFinished(executionId, interval = 2000) {
  let running = true;
  while (running) {
    const executionState = await getExecution(executionId);
    console.log('Execution ' + executionState.status);
    if (executionState.status !== 'RUNNING') {
      running = false;
    }
    await sleep(interval);
  }
}
