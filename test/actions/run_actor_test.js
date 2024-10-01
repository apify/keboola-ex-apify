const sinon = require('sinon');
const { expect } = require('chai');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { apifyClient, getLocalResultRows, checkRows, saveInputFile,
    actionsTestsSetup, actionsTestsTeardown, getDatasetItemsRows } = require('../src/config');
const runActorAction = require('../../src/actions/run_actor');
const { createAndBuildDummyActor } = require('../src/helpers');

chai.use(chaiAsPromised);

const testingActorSourceCode = `
        const Apify = require('apify');
        Apify.main(async () => {
            const { pages = 10 } = await Apify.getInput();
            for (let i = 0; i < 100 * pages; i++) {
                await Apify.pushData({ i, sort: Math.random(), const: 'test' });
            }
        });
        `;

const testingActorInputSchema = {
    title: 'Test',
    type: 'object',
    schemaVersion: 1,
    properties: {
        pages: {
            title: 'Pages',
            description: 'Bla',
            type: 'integer',
        },
        test: {
            title: 'Items',
            description: 'Bla',
            type: 'object',
            editor: 'json',
        },
        inputTableRecord: {
            title: 'Input table',
            description: 'Bla',
            type: 'object',
            editor: 'json',
        },
    },
};

describe('Run Actor', () => {
    let actorId;
    before(async () => {
        // Create test actor
        const actor = await createAndBuildDummyActor({
            sourceCode: testingActorSourceCode,
            inputSchema: testingActorInputSchema,
        });
        actorId = actor.id;
    });
    after(async () => {
        await apifyClient.actor(actorId).delete();
    });

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
        await runActorAction({ apifyClient, actorId, input: actorInput });
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
        await runActorAction({ apifyClient, actorId, input: {} });
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
        await runActorAction({ apifyClient, actorId, input: actorInput, fields: fields.join(',') });
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
