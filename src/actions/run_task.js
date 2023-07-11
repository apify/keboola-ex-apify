const path = require('path');
const { ACTOR_JOB_TERMINAL_STATUSES, ACTOR_JOB_STATUSES } = require('@apify/consts');
const apifyHelper = require('../helpers/apify_helper');
const { loadJson } = require('../helpers/fs_helper');
const {
    STATE_IN_FILE,
    DATA_DIR,
    DEFAULT_EXTRACTOR_TIMEOUT,
} = require('../constants');
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
    let { runId, actorId } = state;

    if (runId) {
        // Check if actor run exists, it can be deleted meanwhile
        const runFromState = await apifyClient.actor(runId).get();
        if (!runFromState) {
            runId = null;
            actorId = null;
            console.log(`Actor run ${runId} loaded from the state does not exist, running the new one.`);
        }
    }

    // If no run ID, starts new one
    let taskRun;
    if (!runId) {
        // Actor run options
        const runOptions = {};
        if (memory) runOptions.memory = parseInt(memory, 10);
        if (build) runOptions.build = build;

        const inputFile = await getInputFile();
        // If there is file with data on input, the data will be uploaded into key-value store
        // and the store record will be pass on into task run input.
        if (inputFile) {
            const inputTableRecord = await apifyHelper.uploadInputTable(apifyClient, inputFile);
            if (input) input = { ...input, inputTableRecord };
            else input = { inputTableRecord };
        }

        taskRun = input
            ? await apifyClient.task(actorTaskId).start(input, runOptions)
            : await apifyClient.task(actorTaskId).start(runOptions);
        runId = taskRun.id;
        actorId = taskRun.actId;
        console.log(`Task run started with runId: ${runId}`);
    }

    const { defaultDatasetId, status } = await apifyHelper.waitUntilRunFinished(runId, apifyClient, timeout);
    if (!ACTOR_JOB_TERMINAL_STATUSES.includes(status)) {
        await apifyHelper.timeoutsRun(runId, actorId);
        throw new Error(`Actor run ${runId} did not finished!`);
    }
    if (!defaultDatasetId) throw new Error('There is no dataset for this run!');
    if (status === ACTOR_JOB_STATUSES.SUCCEEDED) {
        console.log(`Task run ${actorTaskId} finished.`);
    } else {
        console.log(`Task run finished with ${status.toLowerCase()} status!`);
    }
    await getDatasetItems(apifyClient, defaultDatasetId, { fields });
};
