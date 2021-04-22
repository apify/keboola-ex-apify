/* eslint-disable */
const { DATA_DIR } = require('./constants');
const ApifyClient = require('apify-client');
const path = require('path');
const getConfig = require('./helpers/config_helper');
const { parseConfigurationOrThrow } = require('./helpers/keboola_helper');
const { CONFIG_FILE, ACTIONS, ACTION_TYPES } = require('./constants');

const listActorsAction = require('./actions/list_actors');
const listTasksAction = require('./actions/list_tasks');
const getDatasetItems = require('./actions/get_dataset_items');
const runActorAction = require('./actions/run_actor');
const runTaskAction = require('./actions/run_task');


/**
 * Main part of the program.
 */
(async () => {
    try {
        const config = parseConfigurationOrThrow(getConfig(path.join(DATA_DIR, CONFIG_FILE)));
        const {
            action,
            userId,
            token,
            timeout,
            datasetId,
            actionType,
            actId,
            actorId,
            actorTaskId,
            input,
            memory,
            build,
            fields,
        } = config;

        const apifyClient = new ApifyClient({ userId, token });

        switch (action) {
            case ACTIONS.run:
                if (actionType === ACTION_TYPES.getDatasetItems) {
                    await getDatasetItems(apifyClient, datasetId, { fields });
                } else if (actionType === ACTION_TYPES.runActor) {
                    await runActorAction({ apifyClient, actorId: actId || actorId, input, memory, build, timeout, fields });
                } else if (actionType === ACTION_TYPES.runTask) {
                    await runTaskAction({ apifyClient, actorTaskId, input, memory, build, timeout, fields });
                } else {
                    throw new Error(`Error: Unknown Action type ${actionType}`);
                }
                break;
            case ACTIONS.listActors:
                await listActorsAction(apifyClient);
                break;
            case ACTIONS.listTasks:
                await listTasksAction(apifyClient);
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
