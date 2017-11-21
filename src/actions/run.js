import path from 'path';

import command from '../helpers/cliHelper';
import * as apifyHelper from '../helpers/apifyHelper';
import {
    loadJson,
    saveJson,
    createFilePromised,
    createFolderPromised,
} from '../helpers/fsHelper';
import {
    DEFAULT_EXTRACTOR_TIMEOUT,
    DEFAULT_TABLES_OUT_DIR,
    STATE_IN_FILE,
    STATE_OUT_FILE,
} from '../constants';
import parse from 'csv-parse';


const RESULTS_FILE_LIMIT = 50000;
const DEFAULT_PAGINATION_LIMIT = 1000;

const parseCsvPromised = (input, opts) => {
    return new Promise((resolve, reject) => {
        parse(input, opts, (err, output) => {
            if (err) reject(err);
            resolve(output);
        });
    });
};

const getAndSaveResults = async (executionId, crawlerClient) => {
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    const fileName = 'crawler-result.csv';
    const resultsOpts = {
        executionId,
        simplified: 1,
        format: 'csv',
        hideUrl: 1,
        skipFailedPages: 1,
    };
    const sampleExecutionResults = await crawlerClient.getExecutionResults(Object.assign(resultsOpts, { limit: 10 }));
    const executionDetail = await crawlerClient.getExecutionDetails({ executionId });
    const parsedCsv = await parseCsvPromised(sampleExecutionResults.items);
    const headerRowColumns = parsedCsv[0];
    const outputtedPages = executionDetail.stats.pagesOutputted;
    const resultCount = executionDetail.stats.resultCount || outputtedPages;
    const resultPerPage = Math.ceil(resultCount / outputtedPages);
    const resultsFileLimit = Math.ceil(RESULTS_FILE_LIMIT / resultPerPage);
    const resultsPaginationLimit = Math.ceil(DEFAULT_PAGINATION_LIMIT / resultPerPage);
    console.log(`Start saving ${outputtedPages} results pages with ${resultCount} results from execution ${executionId}`);

    let paginationResultsOpts = Object.assign(resultsOpts, {
        limit: resultsPaginationLimit,
        offset: 0,
    });
    if (outputtedPages > resultsFileLimit) {
        // save results by chunks to sliced tables
        const manifest = {
            source: fileName,
            destination: `out.c-data.${fileName}`,
            columns: headerRowColumns,
        };
        const resultDir = path.join(tableOutDir, fileName);
        await createFolderPromised(resultDir);

        let fileCounter = 1;
        while (true) {
            const resultFile = path.join(resultDir, `slice${fileCounter}`);

            if (outputtedPages < paginationResultsOpts.offset) break;

            paginationResultsOpts = await apifyHelper.saveResultsToFile(crawlerClient, paginationResultsOpts, resultsFileLimit, resultFile, true);
            fileCounter += 1;
        }

        await createFilePromised(path.join(tableOutDir, `${fileName}.manifest`), JSON.stringify(manifest));
    } else {
        // save result to one file
        const resultFile = path.join(tableOutDir, fileName);
        await createFilePromised(resultFile, '');
        await apifyHelper.saveResultsToFile(crawlerClient, paginationResultsOpts, resultsFileLimit, resultFile, false);
    }
    console.log(`Results from execution ${executionId} were saved!`);
};

/**
 * Either gets executionId from state file, or creates a new execution or get execution as @param executionId
 * Then it waits for the execution to finish. When the execution is finished, it fetches
 * the results and saves them into relevant file Execution can be timouted. In such case
 * executionId is saved into state file. This state file will be present next time extractor is run
 * with the same configuration
 */
export default async function runAction(crawlerClient, executionId, crawlerId, crawlerSettings, timeout = DEFAULT_EXTRACTOR_TIMEOUT) {
    const stateInFile = path.join(command.data, STATE_IN_FILE);
    const state = await loadJson(stateInFile);

    if (executionId) {
        // executionId was passed as parameter, get results and finish
        console.log(`Execution ${executionId} was passed.`);
        await getAndSaveResults(executionId, crawlerClient);
        return;
    } else if (state.executionId) {
        // executionId was found in state file. Let's use it
        executionId = state.executionId;
        console.log(`ExecutionId loaded from state file. ExecutionId: ${executionId}`);
    } else {
        // there is no executionId in state file. Start the crawler
        const settings = Object.assign({ crawlerId }, { settings: crawlerSettings });
        const execution = await crawlerClient.startExecution(settings);
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
    await getAndSaveResults(executionId, crawlerClient);
}
