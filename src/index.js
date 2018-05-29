/* eslint-disable */
const { DATA_DIR } = require('./constants');
const ApifyClient = require('apify-client');
const path = require('path');
const getConfig = require('./helpers/config_helper');
const { parseConfigurationOrThrow } = require('./helpers/keboola_helper');
const { CONFIG_FILE, ACTIONS, ACTION_TYPES } = require('./constants');

const runAction = require('./actions/run');
const listCrawlersAction = require('./actions/list_crawlers');
const listActorsAction = require('./actions/list_actors');
const getDatasetItems = require('./actions/get_dataset_items');
const runActorAction = require('./actions/run_actor');


/**
 * Main part of the program.
 */
(async () => {
    try {
        const config = parseConfigurationOrThrow(getConfig(path.join(DATA_DIR, CONFIG_FILE)));
        console.log(config);
        const {
            action,
            userId,
            token,
            crawlerId,
            crawlerSettings,
            timeout,
            executionId,
            datasetId,
            actionType,
            actId,
            input,
            memory,
            build,
        } = config;

        const apifyClient = new ApifyClient({ userId, token });

        switch (action) {
            case ACTIONS.run:
                if (actionType === ACTION_TYPES.getDatasetItems) {
                    await getDatasetItems(apifyClient, datasetId);
                } else if (actionType === ACTION_TYPES.runActor) {
                    await runActorAction(apifyClient, actId, input, memory, build);
                } else {
                    await runAction(apifyClient, executionId, crawlerId, crawlerSettings, timeout);
                }
                break;
            case ACTIONS.listCrawlers:
                await listCrawlersAction(apifyClient);
                break;
            case ACTIONS.listActors:
                await listActorsAction(apifyClient);
                break;
            default:
                throw new Error(`Error: Unknown Action ${action}`);
        }

        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})();
