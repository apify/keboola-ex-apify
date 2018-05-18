/* eslint-disable */
const { DATA_DIR } = require('./constants');
const ApifyClient = require('apify-client');
const path = require('path');
const getConfig = require('./helpers/configHelper');
const { parseConfiguration } = require('./helpers/keboolaHelper');
const { CONFIG_FILE, ACTIONS, ACTION_TYPES } = require('./constants');

const runAction = require('./actions/run');
const listCrawlersAction = require('./actions/listCrawlers');
const getDatasetItems = require('./actions/getDatasetItems');


/**
 * Main part of the program.
 */
(async () => {
    try {
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
        } = await parseConfiguration(getConfig(path.join(DATA_DIR, CONFIG_FILE)));

        const apifyClient = new ApifyClient({ userId, token });

        switch (action) {
            case ACTIONS.run:
                if (actionType === ACTION_TYPES.getDatasetItems) {
                    await getDatasetItems(apifyClient, datasetId);
                } else {
                    await runAction(apifyClient, executionId, crawlerId, crawlerSettings, timeout);
                }
                break;
            case ACTIONS.listCrawlers:
                await listCrawlersAction(apifyClient);
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
