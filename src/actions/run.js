import path from 'path';

import command from '../helpers/cliHelper';
import * as apifyHelper from '../helpers/apifyHelper';
import {
  loadJson,
  saveJson,
  createOutputFile,
} from '../helpers/fsHelper';
import {
  DEFAULT_EXTRACTOR_TIMEOUT,
  DEFAULT_TABLES_OUT_DIR,
  STATE_IN_FILE,
  STATE_OUT_FILE,
} from '../constants';

/**
 * Either gets executionId from state file, or creates a new execution.
 * Then it waits for the execution to finish.
 * When the execution is finished, it fetches the results and saves them into relevant file
 * Execution can be timouted. In such case executionId is saved into state file. This state file will be present
 * next time extractor is run with the same configuration
 */
export default async function runAction(crawlerClient, crawlerId, crawlerSettings, timeout = DEFAULT_EXTRACTOR_TIMEOUT) {
    let executionId;

    const stateInFile = path.join(command.data, STATE_IN_FILE);
    const state = await loadJson(stateInFile);

    if (state.executionId) {
        // executionId was found in state file. Let's use it
        executionId = state.executionId;
        console.log(`ExecutionId loaded from state file. ExecutionId: ${executionId}`);
    } else {
        // there is no executionId in state file. Start the crawler
        const execution = await crawlerClient.startCrawler({ crawler: crawlerId });
        executionId = execution._id;
        console.log(`Crawler started. ExecutionId: ${executionId}`);
    }

    // Create a timeout limit, after which executionId will be saved and extractor will stop
    if (timeout) {
        setTimeout(async () => {
            console.log('Extractor Timeouted. Saving the state');
            const stateOutFile = path.join(command.data, STATE_OUT_FILE);
            await saveJson({ executionId }, stateOutFile);
            console.log('State saved. Exiting.');
            process.exit(0);
        }, timeout);
    }

    console.log(`Waiting for execution ${executionId} to finish`);
    await apifyHelper.waitUntilFinished(executionId, crawlerClient);

    const executionResult = await crawlerClient.getExecutionResults({ executionId, simplified: 1, format: 'csv' });
    console.log('Data ready!');

    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    await createOutputFile(path.join(tableOutDir, 'crawlerResult.csv'), executionResult);
    console.log('Files created!');
}
