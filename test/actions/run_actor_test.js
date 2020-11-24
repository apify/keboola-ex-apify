const sinon = require('sinon');
const { expect } = require('chai');
const { apifyClient, getLocalResultRows, checkRows, saveInputFile,
    actionsTestsSetup, actionsTestsTeardown, getDatasetItemsRows } = require('./config');
const runActorAction = require('../../src/actions/run_actor');

// TODO: It not a good design that tests depend on an actor, fix this.
const TEST_ACTOR_ID = 'g4kx2tPptErWMFCra';

describe('Run Actor', () => {
    // Setup test
    beforeEach(actionsTestsSetup);

    it('Run actor with input', async () => {
        sinon.spy(console, 'log');
        const actorInput = {
            pages: 1,
            test: {
                hello: 'test',
            },
        };
        await runActorAction({ apifyClient, actorId: TEST_ACTOR_ID, input: actorInput });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId, defaultKeyValueStoreId } = await apifyClient.acts.getRun({ runId, actId: TEST_ACTOR_ID });

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        const runInput = await apifyClient.keyValueStores.getRecord({ storeId: defaultKeyValueStoreId, key: 'INPUT' });

        checkRows(localCsvRows, apiRows);
        expect(actorInput).to.eql(runInput.body);
    });

    it('Run actor with input file', async () => {
        const inputFileString = 'column,column2,column3\ntest,value,1\ntest2,value2,2\n';
        saveInputFile(inputFileString);
        sinon.spy(console, 'log');
        await runActorAction({ apifyClient, actorId: TEST_ACTOR_ID, input: {} });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId, defaultKeyValueStoreId } = await apifyClient.acts.getRun({ runId, actId: TEST_ACTOR_ID });

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        checkRows(localCsvRows, apiRows);
        // Check input files in customData of execution
        const runInput = await apifyClient.keyValueStores.getRecord({ storeId: defaultKeyValueStoreId, key: 'INPUT' });
        const kvsFile = await apifyClient.keyValueStores.getRecord(runInput.body.inputTableRecord);
        expect(kvsFile.body.toString()).to.eql(inputFileString);
    });

    it('Run actor and return dataset with fields', async () => {
        const actorInput = {
            pages: 1,
        };
        const fields = ['i', 'sort'];
        sinon.spy(console, 'log');
        await runActorAction({ apifyClient, actorId: TEST_ACTOR_ID, input: actorInput, fields: fields.join(',') });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId, defaultKeyValueStoreId } = await apifyClient.acts.getRun({ runId, actId: TEST_ACTOR_ID });

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId, { fields });

        const runInput = await apifyClient.keyValueStores.getRecord({ storeId: defaultKeyValueStoreId, key: 'INPUT' });

        checkRows(localCsvRows, apiRows);
        expect(actorInput).to.eql(runInput.body);
    });

    // Teardown test
    afterEach(actionsTestsTeardown);
});
