import fs from 'fs';
import stripEof  from 'strip-eof';
import { createFilePromised } from './fsHelper';

const WAIT_BETWEEN_REQUESTS = 100; // Time in ms to wait between request, to avoid rate limiting
const DEFAULT_POOLING_INTERVAL = 2000; // ms

/**
 * Sleep for ms with promised
 * usage:
 * await sleepPromised(3000);
 * @param ms
 */
export const sleepPromised = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Asynchronously waits until execution is finished
 */
export async function waitUntilFinished(executionId, crawlerClient, interval = DEFAULT_POOLING_INTERVAL) {
    let running = true;

    while (running) {
        const executionState = await crawlerClient.getExecutionDetails({ executionId });
        console.log(`Execution ${executionState.status}`);
        if (executionState.status !== 'RUNNING') {
            running = false;
        }
        await sleepPromised(interval);
    }
}

/**
 * Appends csv result from crawler execution to file using pagination.
 * @param crawlerClient
 * @param executionResultsOpts
 * @param fileLimit
 * @param file
 * @return {}
 */
export async function saveResultsToFile(crawlerClient, executionResultsOpts, fileLimit, file, skipHeaderRow) {
    let fileResultsCount = 0;
    const fileWriteStream = fs.createWriteStream(file, { encoding: 'UTF-8', flags: 'a' });
    while (true) {
        console.log(`Saving ${executionResultsOpts.offset} - ${executionResultsOpts.offset + executionResultsOpts.limit} pages with results ...`);

        executionResultsOpts.skipHeaderRow = (!skipHeaderRow && executionResultsOpts.offset === 0) ? '' : 1;

        const executionResults = await crawlerClient.getExecutionResults(executionResultsOpts);
        const resultCount = parseInt(executionResults.count);

        if (resultCount === 0) break;

        // NOTE: clean spaces around string and add newline, without this we get malformed csv
        fileWriteStream.write(executionResults.items.trim());
        fileWriteStream.write('\n');

        fileResultsCount += resultCount;

        executionResultsOpts.offset = executionResultsOpts.offset + executionResultsOpts.limit;

        if (fileResultsCount >= fileLimit) break;

        await sleepPromised(WAIT_BETWEEN_REQUESTS);
    }
    fileWriteStream.end();
    return executionResultsOpts;
}