const { delayPromise } = require('apify-shared/utilities');
const { apifyClient, getLocalResultRows, checkRows,
    actionsTestsSetup, actionsTestsTeardown, getDatasetItemsRows } = require('./config');
const { randomHostLikeString } = require('../../src/helpers/apify_helper');
const getDatasetItems = require('../../src/actions/get_dataset_items');

const { datasets } = apifyClient;

const createDatasetWithItems = async (rowCount) => {
    const dataset = await datasets.getOrCreateDataset({ datasetName: randomHostLikeString() });
    const datasetId = dataset.id || dataset._id;
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
        await datasets.deleteDataset({ datasetId: dataset.id })
    });

    it('Works with dataset name', async () => {
        const dataset = await createDatasetWithItems(1100);

        await getDatasetItems(apifyClient, dataset.name);

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(dataset.id);

        checkRows(localCsvRows, apiRows);
        await datasets.deleteDataset({ datasetId: dataset.id })
    });

    it('Works for 100K+ items', async () => {
        const dataset = await createDatasetWithItems(111000);
        await delayPromise(30000);

        await getDatasetItems(apifyClient, dataset.id);

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(dataset.id, { skipHeaderRow: true });

        checkRows(localCsvRows, apiRows);
        await datasets.deleteDataset({ datasetId: dataset.id })
    });

    it('Returns just clean items', async () => {
        const dataset = await datasets.getOrCreateDataset({ datasetName: randomHostLikeString() });
        const datasetId = dataset.id || dataset._id;
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

    // Teardown test
    afterEach(actionsTestsTeardown);
});
