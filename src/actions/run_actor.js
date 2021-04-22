const path = require('path');
const apifyHelper = require('../helpers/apify_helper');
const { loadJson } = require('../helpers/fs_helper');
const { STATE_IN_FILE, DATA_DIR,
    DEFAULT_EXTRACTOR_TIMEOUT } = require('../constants');
const getDatasetItems = require('./get_dataset_items');
const { getInputFile } = require('../helpers/keboola_helper');

/**
 * This action starts actor and wait util finish.
 * Then get data from default dataset of actor to out files.
 * @param apifyClient
 * @param actorId
 * @param input
 * @param memory
 * @param build
 * @param timeout
 * @return {Promise<void>}
 */
module.exports = async function runActor({ apifyClient, actorId, input, memory, build, timeout = DEFAULT_EXTRACTOR_TIMEOUT, fields }) {
    const stateInFile = path.join(DATA_DIR, STATE_IN_FILE);
    const state = await loadJson(stateInFile);
    const { acts } = apifyClient;
    let { runId } = state;

    // If no run ID, starts new one
    if (!runId) {
        // Actor run options
        let opts = { actId: actorId };
        if (memory) opts.memory = parseInt(memory, 10);
        if (build) opts.build = build;

        const inputFile = await getInputFile();
        // If there is file with data on input, the data will be uploaded into key-value store
        // and the store record will be pass on into actor run input.
        if (inputFile) {
            const inputTableRecord = await apifyHelper.uploadInputTable(apifyClient, inputFile);
            if (input) input = { ...input, inputTableRecord };
            else input = { inputTableRecord };
        }
        if (input) {
            opts = {
                ...opts,
                body: JSON.stringify(input),
                contentType: 'application/json; charset=utf-8',
            };
        }

        const actRun = await acts.runAct(opts);
        runId = actRun.id;
        console.log(`Actor run started with runId: ${runId}`);
    }

    if (timeout) apifyHelper.setRunTimeout(timeout, runId, actorId);
    const { defaultDatasetId } = await apifyHelper.waitUntilRunFinished(runId, actorId, apifyClient);
    if (!defaultDatasetId) throw new Error('There is no dataset for this run!');
    console.log(`Actor run ${actorId} finished.`);
    await getDatasetItems(apifyClient, defaultDatasetId, { fields });
};
