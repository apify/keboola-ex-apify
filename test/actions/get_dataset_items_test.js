const { delayPromise } = require('@apify/utilities');
const { apifyClient, getLocalResultRows, checkRows,
    actionsTestsSetup, actionsTestsTeardown, getDatasetItemsRows } = require('./config');
const { randomHostLikeString } = require('../../src/helpers/apify_helper');
const getDatasetItems = require('../../src/actions/get_dataset_items');

const { datasets } = apifyClient;

const createDatasetWithItems = async (rowCount, datasetName) => {
    const dataset = await datasets.getOrCreateDataset({ datasetName: datasetName || randomHostLikeString() });
    const datasetId = dataset.id;
    const batchSize = 10000;
    console.log(`Dataset created ${datasetId}`);
    let rows = [];
    for (let i = 0; i < rowCount; i++) {
        rows.push({
            i,
            value: Math.random(),
        });
        // Put items to datasets bigger by chunks
        if (rows.length === batchSize || i + 1 === rowCount) {
            console.time(`Inserting ${batchSize} to dataset ${datasetId}`);
            await datasets.putItems({ datasetId, data: rows });
            rows = [];
            console.timeEnd(`Inserting ${batchSize} to dataset ${datasetId}`);
        }
        await delayPromise(100);
    }
    return dataset;
};

describe('Get dataset items', () => {
    // Setup test
    beforeEach(actionsTestsSetup);

    it('Works with datasetId', async () => {
        const dataset = await createDatasetWithItems(1100);

        await getDatasetItems(apifyClient, dataset.id);

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(dataset.id);

        checkRows(localCsvRows, apiRows);
        await datasets.deleteDataset({ datasetId: dataset.id });
    });

    it('Works with dataset name', async () => {
        const dataset = await createDatasetWithItems(1100);

        await getDatasetItems(apifyClient, dataset.name);

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(dataset.id);

        checkRows(localCsvRows, apiRows);
        await datasets.deleteDataset({ datasetId: dataset.id });
    });

    // it('Works for 100K+ items', async () => {
    //     const datasetName = '100K-plus';
    //     const expectedItemCount = 111000;
    //     let dataset = await datasets.getOrCreateDataset({ datasetName });
    //     let datasetId = dataset.id;
    //
    //     // NOTE: We want to save push data operations so we reuse dataset if it is possible.
    //     if (dataset.itemCount !== expectedItemCount) {
    //         await datasets.deleteDataset({ datasetId });
    //         dataset = await createDatasetWithItems(111000, datasetName);
    //         datasetId = dataset.id;
    //     }
    //     await delayPromise(3000);
    //
    //     await getDatasetItems(apifyClient, datasetId);
    //
    //     const localCsvRows = await getLocalResultRows(true);
    //     const apiRows = await getDatasetItemsRows(datasetId, { skipHeaderRow: true });
    //
    //     checkRows(localCsvRows, apiRows);
    // });

    it('Returns just clean items', async () => {
        const dataset = await datasets.getOrCreateDataset({ datasetName: randomHostLikeString() });
        const datasetId = dataset.id;
        const items = [
            { i: '0', foo: 'bar', myTest: 'Hello!' },
            { i: '1', foo: 'bar', myTest: 'Hello!', '#debug': 'BlaBla', '#error': 'Error' },
            { i: '2', foo: 'bar', myTest: 'Hello!' },
            { i: '3', foo: 'bar', '#debug': 'BlaBla' },
            { i: '4', '#error': 'Error', aa: 'bb' },
        ];
        await datasets.putItems({ datasetId, data: items });

        await getDatasetItems(apifyClient, datasetId);

        await delayPromise(1000);

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(datasetId, { clean: true });

        checkRows(localCsvRows, apiRows);
        await datasets.deleteDataset({ datasetId });
    });

    it('Returns columns from fields options', async () => {
        const dataset = await datasets.getOrCreateDataset({ datasetName: randomHostLikeString() });
        const datasetId = dataset.id;
        const fields = ['line', 'col1', 'col4'];
        const items = [
            { line: '1', col1: 'test', col2: 'test2', col3: 'test3', col4: 'test4' },
            { line: '2', col1: 'test', col2: 'test2' },
            { line: '3', col1: 'test', col2: 'test2', col3: 'test3', col4: 'test4' },
            { line: '4', col3: 'test3', col4: 'test4' },
            { line: '5', col1: 'test', col2: 'test2', col3: 'test3', col4: 'test4' },
            { line: '6', col1: 'test', col2: 'test2', col3: 'test3', col4: 'test4' },
        ];
        await datasets.putItems({ datasetId, data: items });

        await getDatasetItems(apifyClient, datasetId, { fields: fields.join(',') });

        await delayPromise(1000);

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(datasetId, { clean: true, fields });

        checkRows(localCsvRows, apiRows);
        await datasets.deleteDataset({ datasetId });
    });

    // Teardown test
    afterEach(actionsTestsTeardown);
});
