import path from 'path';

import * as apifyHelper from '../helpers/apifyHelper';
import { createOutputFile } from '../helpers/fsHelper';
import { DEFAULT_EXECUTOR_TIMEOUT } from '../constants';

function saveState(state) {

}

export default async function runAction(crawlerClient, crawlerId, crawlerSettings, tableOutDir, timeout = DEFAULT_EXECUTOR_TIMEOUT) {
    const execution = await crawlerClient.startCrawler({ crawler: crawlerId });
    const executionId = execution._id;
    console.log(`Crawler started. ExecutionId: ${executionId}`);

    if (timeout) {
        setTimeout(() => {
            console.log('Executor Timeouted. Saving the state');
            saveState({ executionId });
            console.log('State saved. Exiting.');
            process.exit(0);
        }, timeout);
    }

    console.log(`Waiting for execution ${executionId} to finish`);
    await apifyHelper.waitUntilFinished(executionId, crawlerClient);

    const executionResult = await crawlerClient.getExecutionResults({ executionId, simplified: 1 });
    console.log('Data ready!');

    await createOutputFile(path.join(tableOutDir, 'crawlerResult.csv'), executionResult);
    console.log('Files created!');
}
