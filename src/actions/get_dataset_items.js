const path = require('path');
const apifyHelper = require('../helpers/apify_helper');
const parseCsvPromised = require('../helpers/csv_helpers');
const { createFilePromised, createFolderPromised } = require('../helpers/fs_helper');
const { DEFAULT_TABLES_OUT_DIR, DATA_DIR, DATASET_FILE_NAME } = require('../constants');

const RESULTS_FILE_LIMIT = 50000;
const DEFAULT_PAGINATION_LIMIT = 5000;


/**
 * Outputs all data from Apify datasets to data/out
 */
module.exports = async function getDatasetItems(apifyClient, maybeDatasetId, datasetOptions = {}) {
    const apifyDatasets = await apifyClient.datasets;
    const { fields } = datasetOptions;
    let dataset = await apifyDatasets.getDataset({ datasetId: maybeDatasetId });
    if (!dataset) {
        // Try to find by name
        // TODO: Fix when we can get dataset by name
        const datasetByName = await apifyHelper.findDatasetByName(apifyDatasets, maybeDatasetId);
        if (datasetByName) dataset = await apifyDatasets.getDataset({ datasetId: datasetByName.id });
    }

    if (!dataset) throw new Error(`Error: Apify dataset with ${maybeDatasetId} name or id doesn't exist.`);

    const datasetId = dataset.id || dataset._id; // TODO: Use only id, when we fix _id for test user
    const tableOutDir = path.join(DATA_DIR, DEFAULT_TABLES_OUT_DIR);
    const getItemsOpts = {
        datasetId,
        format: 'csv',
        clean: true,
    };

    if (fields) {
        getItemsOpts.fields = typeof fields === 'string' ? fields.split(',') : fields;
    }

    const sampleItems = await apifyDatasets.getItems(Object.assign(getItemsOpts, { limit: 10 }));
    // HOTFIX: Enlarge max_limit_on_data_read to be able handle large fields
    const parsedCsv = await parseCsvPromised(sampleItems.items, { max_limit_on_data_read: 128000 * 5 });
    const headerRowColumns = parsedCsv[0];

    console.log(`Start saving ${dataset.itemCount} results from datasetId ${datasetId}`);

    let paginationItemsOpts = Object.assign(getItemsOpts, {
        limit: DEFAULT_PAGINATION_LIMIT,
        offset: 0,
    });
    if (dataset.itemCount > RESULTS_FILE_LIMIT) {
        // save results by chunks to sliced tables
        // fix empty header row column
        const headerRowColumnsClean = headerRowColumns.map((column) => {
            return (column === '') ? 'x' : column;
        });
        const manifest = {
            columns: headerRowColumnsClean,
        };
        const resultDir = path.join(tableOutDir, DATASET_FILE_NAME);
        await createFolderPromised(resultDir);

        let fileCounter = 1;
        while (true) {
            const resultFile = path.join(resultDir, `slice${fileCounter}`);

            if (dataset.itemCount <= paginationItemsOpts.offset) break;

            paginationItemsOpts = await apifyHelper.saveItemsToFile(datasetId,
                paginationItemsOpts, RESULTS_FILE_LIMIT, resultFile, true);
            fileCounter += 1;
        }

        await createFilePromised(path.join(tableOutDir, `${DATASET_FILE_NAME}.manifest`), JSON.stringify(manifest));
    } else {
        // save result to one file
        const resultFile = path.join(tableOutDir, DATASET_FILE_NAME);
        await createFilePromised(resultFile, '');
        await apifyHelper.saveItemsToFile(datasetId, paginationItemsOpts, RESULTS_FILE_LIMIT, resultFile, false);
    }
    console.log(`Items from dataset ${datasetId} were saved!`);
};
