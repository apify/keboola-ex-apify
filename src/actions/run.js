const path = require('path');
const shortid = require('shortid');

const apifyHelper = require('../helpers/apifyHelper');
const {
    loadJson,
    saveJson,
    createFilePromised,
    createFolderPromised,
    fileStatPromied,
    readDirPromised,
    readFilePromised,
} = require('../helpers/fsHelper');
const {
    DEFAULT_EXTRACTOR_TIMEOUT,
    DEFAULT_TABLES_OUT_DIR,
    STATE_IN_FILE,
    STATE_OUT_FILE,
    DEFAULT_TABLES_IN_DIR,
    DATA_DIR,
    RESULTS_FILE_NAME,
} = require('../constants');
const parseCsvPromised = require('../helpers/csvHelpers');


const RESULTS_FILE_LIMIT = 50000;
const DEFAULT_PAGINATION_LIMIT = 1000;
const NAME_OF_KEBOOLA_INPUTS_STORE = 'KEBOOLA-INPUTS'; // Name of Apify keyvalue store for Keboola inputs files

const getAndSaveResults = async (executionId, crawlerClient) => {
    const tableOutDir = path.join(DATA_DIR, DEFAULT_TABLES_OUT_DIR);
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
        // fix empty header row column
        const headerRowColumnsClean = headerRowColumns.map((column) => {
            return (column === '') ? 'x' : column;
        });
        const manifest = {
            columns: headerRowColumnsClean,
        };
        const resultDir = path.join(tableOutDir, RESULTS_FILE_NAME);
        await createFolderPromised(resultDir);

        let fileCounter = 1;
        while (true) {
            const resultFile = path.join(resultDir, `slice${fileCounter}`);

            if (outputtedPages <= paginationResultsOpts.offset) break;

            paginationResultsOpts = await apifyHelper.saveResultsToFile(crawlerClient,
                paginationResultsOpts, resultsFileLimit, resultFile, true);
            fileCounter += 1;
        }

        await createFilePromised(path.join(tableOutDir, `${RESULTS_FILE_NAME}.manifest`), JSON.stringify(manifest));
    } else {
        // save result to one file
        const resultFile = path.join(tableOutDir, RESULTS_FILE_NAME);
        await createFilePromised(resultFile, '');
        await apifyHelper.saveResultsToFile(crawlerClient, paginationResultsOpts, resultsFileLimit, resultFile, false);
    }
    console.log(`Results from execution ${executionId} were saved!`);
};

/**
 * Get filer from default table in directory as Buffer
 * @return {Promise<Buffer>||Promise<null>}
 */
const getInputFile = async () => {
    const tablesInDirPath = path.join(DATA_DIR, DEFAULT_TABLES_IN_DIR);
    try {
        await fileStatPromied(tablesInDirPath);
    } catch (e) {
        // Folder doesn't exist, input file wasn't pass
        return null;
    }

    const files = await readDirPromised(tablesInDirPath);
    if (files.length) {
        const fileBuffer = await readFilePromised(path.join(tablesInDirPath, files[0]));
        return fileBuffer;
    }
};

/**
 * Either gets executionId from state file, or creates a new execution or get execution as @param executionId
 * Then it waits for the execution to finish. When the execution is finished, it fetches
 * the results and saves them into relevant file Execution can be timouted. In such case
 * executionId is saved into state file. This state file will be present next time extractor is run
 * with the same configuration
 */
module.exports = async function runAction(apifyClient, executionId, crawlerId, crawlerSettings, timeout = DEFAULT_EXTRACTOR_TIMEOUT) {
    const stateInFile = path.join(DATA_DIR, STATE_IN_FILE);
    const state = await loadJson(stateInFile);
    const crawlerClient = apifyClient.crawlers;

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
        const crawlerExecution = Object.assign({ crawlerId }, { settings: crawlerSettings });
        // Check if input file was passed, if was pass it to crawler as Apify keyvalue store object
        const inputFile = await getInputFile();
        if (inputFile) {
            const keyValueStoresClient = apifyClient.keyValueStores;
            const store = await keyValueStoresClient.getOrCreateStore({ storeName: NAME_OF_KEBOOLA_INPUTS_STORE });
            const storeId = store.id;
            const key = shortid.generate();
            await keyValueStoresClient.putRecord({
                storeId,
                key,
                body: inputFile,
                contentType: 'text/csv',
            });
            if (crawlerExecution.settings.customData && typeof crawlerExecution.settings.customData === 'object') {
                Object.assign(crawlerExecution.settings.customData, { storeId, key });
            } else {
                crawlerExecution.settings.customData = { storeId, key };
            }
        }
        const execution = await crawlerClient.startExecution(crawlerExecution);
        executionId = execution._id;
        console.log(`Crawler started. ExecutionId: ${executionId}`);
    }
    // Create a timeout limit, after which executionId will be saved and extractor will stop
    if (timeout) {
        setTimeout(async () => {
            console.log('Extractor Timeouted. Saving the state');
            const stateOutFile = path.join(DATA_DIR, STATE_OUT_FILE);
            await saveJson({ executionId }, stateOutFile);
            console.log('State saved. Exiting.');
            process.exit(0);
        }, timeout);
    }

    console.log(`Waiting for execution ${executionId} to finish`);
    await apifyHelper.waitUntilFinished(executionId, crawlerClient);
    await getAndSaveResults(executionId, crawlerClient);
};
