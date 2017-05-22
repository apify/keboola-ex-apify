import * as apifyClient from 'apify-client';
import path from 'path';
import command from './helpers/cliHelper';

import { getConfig } from './helpers/configHelper';
import * as apifyHelper from './helpers/apifyHelper';
import { parseConfiguration } from './helpers/keboolaHelper';
import { CONFIG_FILE, DEFAULT_TABLES_OUT_DIR } from './constants';
import { createOutputFile } from './helpers/fsHelper';

/**
 * This is the main part of the program.
 */
(async () => {
  try {
    // Reading of the input configuration.
    const {
      userId,
      token,
      crawlerId,
      crawlerSettings
    } = await parseConfiguration(getConfig(path.join(command.data, CONFIG_FILE)));
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);

    const crawlerClient = apifyClient.default({ userId, token }).crawlers;

    const execution = await crawlerClient.startCrawler({ crawler: crawlerId });
    const executionId = execution['_id'];
    console.log('Crawler started. ExecutionId: ' + executionId);

    console.log('Waiting for execution ' + executionId + ' to finish');
    await apifyHelper.waitUntilFinished(executionId, crawlerClient);

    const executionResult = await crawlerClient.getExecutionResults({ executionId });
    let data = [];
    executionResult.forEach((page) => { data = data.concat(page.pageFunctionResult); });
    console.log('Data ready!');

    await createOutputFile(path.join(tableOutDir, 'crawlerResult.csv'), data);
    console.log('Files created!');
    // console.log('Manifests created');
    // const manifests = await Promise.all(firebase.generateOutputManifests(tableOutDir, bucketName, files));
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
