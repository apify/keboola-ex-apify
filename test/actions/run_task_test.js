const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const _ = require('underscore');
const {
    apifyClient,
    getLocalResultRows,
    checkRows,
    actionsTestsSetup,
    actionsTestsTeardown,
    getDatasetItemsRows,
} = require('../src/config');
const { createAndBuildDummyActor } = require('../src/helpers');
const runTaskAction = require('../../src/actions/run_task');
const { generateTaskName } = require('../src/helpers');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Run Task', () => {
    let actorId;
    before(async () => {
        // Create test actor
        const actor = await createAndBuildDummyActor();
        actorId = actor.id;
    });
    after(async () => {
        await apifyClient.actor(actorId).delete();
    });
    // Setup test
    beforeEach(actionsTestsSetup);
    // Teardown test
    afterEach(actionsTestsTeardown);

    it('Run task and return dataset with fields', async () => {
        const items = _.times(1000, (i) => {
            return {
                i,
                test: Math.random(),
            };
        });
        const task = await apifyClient.tasks().create({ actId: actorId, name: generateTaskName(), input: { items } });
        sinon.spy(console, 'log');
        await runTaskAction({ apifyClient, actorTaskId: task.id });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId } = await apifyClient.run(runId).get();

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        checkRows(localCsvRows, apiRows);
    });

    it('Run with overridden input works', async () => {
        const items = _.times(1000, (i) => {
            return {
                i,
                test: Math.random(),
            };
        });
        const task = await apifyClient.tasks().create({ actId: actorId, name: generateTaskName(), input: { items: [{}] } });
        sinon.spy(console, 'log');
        await runTaskAction({ apifyClient, actorTaskId: task.id, input: { items } });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId } = await apifyClient.run(runId).get();

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        checkRows(localCsvRows, apiRows);
    });

    it('throw error if didn\'t match input schema', async () => {
        const task = await apifyClient.tasks().create({ actId: actorId, name: generateTaskName(), input: { items: [{}] } });
        await expect(runTaskAction({ apifyClient, actorTaskId: task.id, input: { items: 'string but must be array' } })).be.rejectedWith('Input');
    });
});
