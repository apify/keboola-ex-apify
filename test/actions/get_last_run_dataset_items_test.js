const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const { actionsTestsSetup, actionsTestsTeardown, apifyClient,
    getLocalResultRows,
    getDatasetItemsRows,
    checkRows,
} = require('../src/config');
const { createAndBuildDummyActor, generateTaskName } = require('../src/helpers');
const {
    getActorLastRunDatasetItems,
    getTaskLastRunDatasetItems,
} = require('../../src/actions/get_last_run_dataset_items');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Get Last Run Dataset Items Actions', () => {
    let actorId;
    before(async () => {
        // Create test actor
        const actor = await createAndBuildDummyActor();
        actorId = actor.id;
    });
    after(async () => {
        // await apifyClient.actor(actorId).delete();
    });

    // Setup test
    beforeEach(actionsTestsSetup);
    // Teardown test
    afterEach(actionsTestsTeardown);

    describe('Get Actor Last Run Dataset Items Actions', () => {
        it('throws error it there is no run for actor', async () => {
            await expect(getActorLastRunDatasetItems(apifyClient, actorId)).be.rejected;
        });

        it('returns dataset items from last actor success run', async () => {
            const actorClient = await apifyClient.actor(actorId);
            const expectedItems = [{ a: 1 }, { b: 2 }, { c: 3 }];
            const [_, run] = await Promise.all([
                actorClient.call({ throw: true, items: [{ a: 1 }] }),
                actorClient.call({ items: expectedItems }),
                actorClient.call({ throw: true, items: [{ a: 1 }] }),
            ]);

            await getActorLastRunDatasetItems(apifyClient, actorId);

            const localCsvRows = await getLocalResultRows(true);
            const apiRows = await getDatasetItemsRows(run.defaultDatasetId);

            checkRows(localCsvRows, apiRows);
        });
    });

    describe('Get Task Last Run Dataset Items Actions', () => {
        let taskId;
        before(async () => {
            const task = await apifyClient.tasks().create({ actId: actorId, name: generateTaskName(), input: { items: [{ a: 1 }] } });
            taskId = task.id;
        });
        after(async () => {
            await apifyClient.task(taskId).delete();
        });

        it('throws error it there is no run for task', async () => {
            await expect(getTaskLastRunDatasetItems(apifyClient, taskId)).be.rejected;
        });

        it('returns dataset items from last task success run', async () => {
            const taskClient = await apifyClient.task(taskId);
            const expectedItems = [{ foo: 'bar1' }, { foo: 'bar2' }, { foo: 'bar3' }];
            const [_, run] = await Promise.all([
                taskClient.call({ throw: true, items: [{ a: 1 }] }),
                taskClient.call({ items: expectedItems }),
                taskClient.call({ throw: true, items: [{ a: 1 }] }),
            ]);

            await getTaskLastRunDatasetItems(apifyClient, taskId);

            const localCsvRows = await getLocalResultRows(true);
            const apiRows = await getDatasetItemsRows(run.defaultDatasetId);

            checkRows(localCsvRows, apiRows);
        });
    });
});
