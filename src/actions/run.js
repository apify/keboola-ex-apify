import path from 'path';

import * as apifyHelper from '../helpers/apifyHelper';
import { createOutputFile } from '../helpers/fsHelper';

// todo: add timeout
export default async function runAction(crawlerClient, crawlerId, crawlerSettings, tableOutDir) {
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
}
