const fs = require('fs');
const got = require('got');
const { promisify } = require('util');
const stream = require('stream');
const path = require('path');
const { saveJson } = require('./fs_helper');
const {
    STATE_OUT_FILE,
    DATA_DIR,
    NAME_OF_KEBOOLA_INPUTS_STORE,
    TIME_TO_SAVE_STATE_MILLIS,
} = require('../constants');

const pipeline = promisify(stream.pipeline);

const RUN_LOG_INTERVAL_MILLIS = 5000;

const periodicalRunLog = (runId, interval = RUN_LOG_INTERVAL_MILLIS) => {
    return setInterval(() => {
        console.log(`Run with ID "${runId}" is still running ...`);
    }, interval);
};

/**
 * Asynchronously waits until run is finished
 */
async function waitUntilRunFinished(runId, apifyClient, timeoutMillis) {
    const betterTimeoutMillis = timeoutMillis - TIME_TO_SAVE_STATE_MILLIS;
    const intervalRunLog = periodicalRunLog(runId);
    const run = await apifyClient.run(runId).waitForFinish({ waitSecs: betterTimeoutMillis / 1000 });
    clearInterval(intervalRunLog);

    return run;
}

/**
 * Appends csv items from dataset to file using pagination.
 * @param datasetId
 * @param paginationItemsOpts
 * @param fileLimit
 * @param file
 * @param skipHeaderRow
 * @return {}
 */
async function saveItemsToFile(datasetId, paginationItemsOpts, fileLimit, file, skipHeaderRow) {
    paginationItemsOpts.limit = fileLimit;
    // NOTE: We need to stream data from API here and this functionality is not provided by Apify client yet.
    const fileWriteStream = fs.createWriteStream(file, { flags: 'a' });
    const datasetItemsUrl = `https://api.apify.com/v2/datasets/${datasetId}/items`;
    const { fields } = paginationItemsOpts;
    const searchParams = { ...paginationItemsOpts, format: 'csv', skipHeaderRow: skipHeaderRow ? '1' : '0' };
    if (fields) {
        searchParams.fields = fields.join(',');
    }
    const datasetItemsStream = got.stream(datasetItemsUrl, {
        searchParams,
    });

    console.log(`Saving ${paginationItemsOpts.offset} - ${paginationItemsOpts.offset + paginationItemsOpts.limit} items ...`);

    await pipeline(
        datasetItemsStream,
        fileWriteStream,
    );

    paginationItemsOpts.offset += paginationItemsOpts.limit;

    return paginationItemsOpts;
}

function printLargeStringToStdOut(largeString) {
    // You can output in stdout only 64 000 bit in docker container (in plain nodejs process it works at all)
    const maxChunkLength = 50000;
    for (let i = 0; i < largeString.length; i += maxChunkLength) {
        process.stdout.write(largeString.substring(i, i + maxChunkLength));
    }
}

const randomHostLikeString = () => `${Math.random().toString(36).substring(2)}-${Date.now().toString(36).substring(2)}`;

const uploadInputTable = async (apifyClient, inputFile) => {
    const store = await apifyClient.keyValueStores().getOrCreate(NAME_OF_KEBOOLA_INPUTS_STORE);
    const storeId = store.id;
    const key = randomHostLikeString();
    await apifyClient.keyValueStore(storeId).setRecord({
        key,
        value: inputFile,
        contentType: 'text/csv',
    });
    return { storeId, key };
};

const timeoutsRun = async (runId, actorId) => {
    console.log('Error: Extractor reached it\'s maximum running time. Saving the component state, you can resume the run.');
    const stateOutFile = path.join(DATA_DIR, STATE_OUT_FILE);
    await saveJson(stateOutFile, { runId, actorId });
    console.log('State saved. Exiting.');
    process.exit(0);
};

module.exports = {
    saveItemsToFile,
    waitUntilRunFinished,
    printLargeStringToStdOut,
    randomHostLikeString,
    uploadInputTable,
    timeoutsRun,
};
