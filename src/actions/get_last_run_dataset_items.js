const { ACTOR_JOB_STATUSES } = require('@apify/consts');
const getDatasetItems = require('./get_dataset_items');

const getActorLastRunDatasetItems = async (apifyClient, actorId, datasetOptions = {}) => {
    const actorClient = await apifyClient.actor(actorId);
    if (!await actorClient.get()) {
        throw new Error(`Error: Actor with id ${actorId} not found.`);
    }

    const lastRun = await actorClient.lastRun({ status: ACTOR_JOB_STATUSES.SUCCEEDED }).get();
    if (!lastRun) {
        throw new Error(`Error: Actor with id ${actorId} has no ${ACTOR_JOB_STATUSES.SUCCEEDED.toLowerCase()} runs.`);
    }

    await getDatasetItems(apifyClient, lastRun.defaultDatasetId, datasetOptions);
};

const getTaskLastRunDatasetItems = async (apifyClient, taskId, datasetOptions) => {
    const taskClient = await apifyClient.task(taskId);
    if (!await taskClient.get()) {
        throw new Error(`Error: Task with id ${taskId} not found.`);
    }

    const lastRun = await taskClient.lastRun({ status: ACTOR_JOB_STATUSES.SUCCEEDED }).get();
    if (!lastRun) {
        throw new Error(`Error: Task with id ${taskId} has no ${ACTOR_JOB_STATUSES.SUCCEEDED.toLowerCase()} runs.`);
    }

    await getDatasetItems(apifyClient, lastRun.defaultDatasetId, datasetOptions);
};

module.exports = {
    getActorLastRunDatasetItems,
    getTaskLastRunDatasetItems,
};
