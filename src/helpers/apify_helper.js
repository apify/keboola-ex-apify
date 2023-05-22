const fs = require('fs');
const got = require('got');
const { promisify } = require('util');
const stream = require('stream');
const path = require('path');
const { saveJson } = require('./fs_helper');
const {
    STATE_OUT_FILE, DATA_DIR,
    NAME_OF_KEBOOLA_INPUTS_STORE,
} = require('../constants');

const pipeline = promisify(stream.pipeline);

/**
 * Stream logs into stdout, shallow errors
 * @param apifyClient
 * @param runId
 * @returns {Promise<void>}
 */
const followRunLogs = async (apifyClient, runId) => {
    const logStream = await apifyClient.run(runId).log().stream();
    try {
        console.log('=== Run logs starts ===');
        for await (const logLine of logStream) {
            process.stdout.write(logLine.toString());
        }
        console.log('=== Run logs ends ===');
    } catch (err) {
        console.log('Error occurred during log streaming, but it is not critical. The run is still running.');
    }
};

/**
 * Asynchronously waits until run is finished
 */
async function waitUntilRunFinished(runId, apifyClient, timeoutMillis) {
    const runPromise = apifyClient.run(runId).waitForFinish({ waitSecs: timeoutMillis / 1000 });
    const [run] = await Promise.all([runPromise, followRunLogs(apifyClient, runId)]);

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
    console.log('Extractor timeouts. Saving the state, you can resume the run later.');
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
