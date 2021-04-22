const path = require('path');
const apifyHelper = require('../helpers/apify_helper');
const { loadJson } = require('../helpers/fs_helper');
const { STATE_IN_FILE, DATA_DIR,
    DEFAULT_EXTRACTOR_TIMEOUT } = require('../constants');
const getDatasetItems = require('./get_dataset_items');
const { getInputFile } = require('../helpers/keboola_helper');

/**
 * This action starts actor task and wait until finish.
 * Then get data from default dataset of actor to out files.
 * If there is file with data on input, the data will be uploaded into key-value store
 * and the store record will be pass on into task run input.
 * @param apifyClient
 * @param actorId
 * @param input
 * @param memory
 * @param build
 * @param timeout
 * @return {Promise<void>}
 */
module.exports = async function runActorTask({ apifyClient, actorTaskId, input, memory, build, timeout = DEFAULT_EXTRACTOR_TIMEOUT, fields }) {
    const stateInFile = path.join(DATA_DIR, STATE_IN_FILE);
    const state = await loadJson(stateInFile);
    const { tasks } = apifyClient;
    let { runId, actorId } = state;

    // If no run ID, starts new one
    let taskRun;
    if (!runId) {
        // Actor run options
        let opts = { taskId: actorTaskId };
        if (memory) opts.memory = parseInt(memory, 10);
        if (build) opts.build = build;

        const inputFile = await getInputFile();
        // If there is file with data on input, the data will be uploaded into key-value store
        // and the store record will be pass on into task run input.
        if (inputFile) {
            const inputTableRecord = await apifyHelper.uploadInputTable(apifyClient, inputFile);
            if (input) input = { ...input, inputTableRecord };
            else input = { inputTableRecord };
        }
        if (input) opts = { ...opts, input };

        taskRun = await tasks.runTask(opts);
        runId = taskRun.id;
        actorId = taskRun.actId;
        console.log(`Task run started with runId: ${runId}`);
    }

    if (timeout) apifyHelper.setRunTimeout(timeout, runId, actorId);
    const { defaultDatasetId } = await apifyHelper.waitUntilRunFinished(runId, actorId, apifyClient);
    if (!defaultDatasetId) throw new Error('There is no dataset for this run!');
    console.log(`Task run ${actorTaskId} finished.`);
    await getDatasetItems(apifyClient, defaultDatasetId, { fields });
};
