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

        const { defaultDatasetId, defaultKeyValueStoreId } = await apifyClient.run(runId).get();

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        const runInput = await apifyClient.keyValueStore(defaultKeyValueStoreId).getRecord('INPUT');

        checkRows(localCsvRows, apiRows);
        expect(actorInput).to.eql(runInput.value);
    });

    it('Run actor with input file', async () => {
        const inputFileString = 'column,column2,column3\ntest,value,1\ntest2,value2,2\n';
        await saveInputFile(inputFileString);
        sinon.spy(console, 'log');
        await runActorAction({ apifyClient, actorId: TEST_ACTOR_ID, input: {} });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId, defaultKeyValueStoreId } = await apifyClient.run(runId).get();

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        checkRows(localCsvRows, apiRows);
        // Check input files in customData of execution
        const runInput = await apifyClient.keyValueStore(defaultKeyValueStoreId).getRecord('INPUT');
        const kvsFile = await apifyClient.keyValueStore(runInput.value.inputTableRecord.storeId).getRecord(runInput.value.inputTableRecord.key);
        expect(kvsFile.value.toString()).to.eql(inputFileString);
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

        const { defaultDatasetId, defaultKeyValueStoreId } = await apifyClient.run(runId).get();

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId, { fields });

        const runInput = await apifyClient.keyValueStore(defaultKeyValueStoreId).getRecord('INPUT');

        checkRows(localCsvRows, apiRows);
        expect(actorInput).to.eql(runInput.value);
    });

    // Teardown test
    afterEach(actionsTestsTeardown);
});
