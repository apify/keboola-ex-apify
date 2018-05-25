const apifyHelper = require('../helpers/apify_helper');
const path = require('path');
const { loadJson, saveJson } = require('../helpers/fs_helper');
const { STATE_IN_FILE, STATE_OUT_FILE, DATA_DIR, DEFAULT_EXTRACTOR_TIMEOUT } = require('../constants');
const getDatasetItems = require('./get_dataset_items');

/**
 * This action starts actor and wait util finish.
 * Then get data from default dataset of actor to out files.
 * @param apifyClient
 * @param actId
 * @param input
 * @param memory
 * @param build
 * @param timeout
 * @return {Promise<void>}
 */
module.exports = async function runActor(apifyClient, actId, input, memory, build, timeout = DEFAULT_EXTRACTOR_TIMEOUT) {
    const stateInFile = path.join(DATA_DIR, STATE_IN_FILE);
    const state = await loadJson(stateInFile);
    const { acts } = apifyClient;
    let runId = state.runId;

    // If no run ID, starts new one
    if (!runId) {
        // Actor run options
        const opts = { actId };
        if (input) {
            Object.assign(opts, {
                body: JSON.stringify(input),
                contentType: 'application/json; charset=utf-8',
            });
        }
        if (memory) opts.memory = parseInt(memory, 10);
        if (build) opts.build = build;

        const actRun = await acts.runAct(opts);
        runId = actRun.id || actRun._id;
        console.log(`Actor run started with runId: ${runId}`);
    }

    if (timeout) {
        setTimeout(async () => {
            console.log('Extractor timeouts. Saving the state');
            const stateOutFile = path.join(DATA_DIR, STATE_OUT_FILE);
            await saveJson({ runId }, stateOutFile);
            console.log('State saved. Exiting.');
            process.exit(0);
        }, timeout);
    }

    const { defaultDatasetId } = await apifyHelper.waitUntilRunFinished(runId, actId, acts);
    if (!defaultDatasetId) throw new Error('Actor run pushs no results to default dataset!');
    console.log(`Actor run ${actId} finished.`);
    await getDatasetItems(apifyClient, defaultDatasetId);
};
