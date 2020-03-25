const { delayPromise } = require('apify-shared/utilities');
const { apifyClient, getLocalResultRows, checkRows,
    actionsTestsSetup, actionsTestsTeardown, getDatasetItemsRows } = require('./config');
const { randomHostLikeString } = require('../../src/helpers/apify_helper');
const getDatasetItems = require('../../src/actions/get_dataset_items');

const createDatasetWithItems = async (rowCount) => {
    const dataset = await apifyClient.datasets.getOrCreateDataset({ datasetName: randomHostLikeString() });
    const datasetId = dataset.id || dataset._id;
    let rows = [];
    for (let i = 0; i < rowCount; i++) {
        rows.push({
            i,
            value: Math.random(),
        });
        // Put items to datasets bigger by chunks
        if (rows.length === 10000 || i + 1 === rowCount) {
            await apifyClient.datasets.putItems({ datasetId, data: rows });
            rows = [];
        }
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
    });

    it('Works with dataset name', async () => {
        const dataset = await createDatasetWithItems(1100);

        await getDatasetItems(apifyClient, dataset.name);

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(dataset.id);

        checkRows(localCsvRows, apiRows);
    });

    it('Works for 100K+ items', async () => {
        const dataset = await createDatasetWithItems(111000);
        await delayPromise(30000);

        await getDatasetItems(apifyClient, dataset.id);

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(dataset.id, { skipHeaderRow: 1 });

        checkRows(localCsvRows, apiRows);
    });

    // Teardown test
    afterEach(actionsTestsTeardown);
});
