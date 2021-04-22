const fs = require('fs');
const got = require('got');
const { promisify } = require('util');
const stream = require('stream');
const { delayPromise } = require('apify-shared/utilities');
const { ACT_JOB_TERMINAL_STATUSES } = require('apify-shared/consts');
const path = require('path');
const { saveJson } = require('./fs_helper');
const {
    STATE_OUT_FILE, DATA_DIR,
    NAME_OF_KEBOOLA_INPUTS_STORE,
} = require('../constants');

const pipeline = promisify(stream.pipeline);

const DEFAULT_POOLING_INTERVAL_MILLIS = 5000;

/**
 * Asynchronously waits until run is finished
 */
async function waitUntilRunFinished(runId, actId, apifyClient, interval = DEFAULT_POOLING_INTERVAL_MILLIS) {
    let running = true;
    let actRun;

    while (running) {
        actRun = await apifyClient.acts.getRun({ actId, runId });
        console.log('The run is still running...');
        if (ACT_JOB_TERMINAL_STATUSES.includes(actRun.status)) {
            running = false;
        }
        await delayPromise(interval);
    }
    return actRun;
}

/**
 * Appends csv items from dataset to file using pagination.
 * @param apifyDatasets
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
    const searchParams = { ...paginationItemsOpts, skipHeaderRow: skipHeaderRow ? '1' : '0' };
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

async function findDatasetByName(apifyDatasets, maybeDatasetName) {
    let datasetsPage;
    let offset = 0;
    const limit = 1000;
    while (true) {
        datasetsPage = await apifyDatasets.listDatasets({ limit, offset });
        const datasetByName = datasetsPage.items.find((maybeDataset) => maybeDataset.name === maybeDatasetName);
        if (datasetByName) return datasetByName;
        if (datasetsPage.count === 0) return;
        offset += limit;
    }
}

const randomHostLikeString = () => `${Math.random().toString(36).substring(2)}-${Date.now().toString(36).substring(2)}`;

const uploadInputTable = async (apifyClient, inputFile) => {
    const { keyValueStores } = apifyClient;
    const store = await keyValueStores.getOrCreateStore({ storeName: NAME_OF_KEBOOLA_INPUTS_STORE });
    const storeId = store.id;
    const key = randomHostLikeString();
    await keyValueStores.putRecord({
        storeId,
        key,
        body: inputFile,
        contentType: 'text/csv',
    });
    return { storeId, key };
};

const setRunTimeout = (timeout, runId, actorId) => {
    setTimeout(async () => {
        console.log('Extractor timeouts. Saving the state');
        const stateOutFile = path.join(DATA_DIR, STATE_OUT_FILE);
        await saveJson(stateOutFile, { runId, actorId });
        console.log('State saved. Exiting.');
        process.exit(0);
    }, timeout);
};

module.exports = {
    saveItemsToFile,
    waitUntilRunFinished,
    printLargeStringToStdOut,
    findDatasetByName,
    randomHostLikeString,
    uploadInputTable,
    setRunTimeout,
};
