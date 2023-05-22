const path = require('path');
const { DownloadItemsFormat } = require('apify-client');

const { parse } = require('csv-parse/sync');
const apifyHelper = require('../helpers/apify_helper');
const { createFilePromised, createFolderPromised } = require('../helpers/fs_helper');
const { DEFAULT_TABLES_OUT_DIR, DATA_DIR, DATASET_FILE_NAME } = require('../constants');

const RESULTS_FILE_LIMIT = 50000;
const DEFAULT_PAGINATION_LIMIT = 5000;

/**
 * Outputs all data from Apify datasets to data/out
 */
module.exports = async function getDatasetItems(apifyClient, datasetIdOrName, datasetOptions = {}) {
    const { fields } = datasetOptions;
    let dataset = await apifyClient.dataset(datasetIdOrName).get();
    if (!dataset) {
        // Try to find dataset by name
        const user = await apifyClient.user().get();
        dataset = await apifyClient.dataset(`${user.id}~${datasetIdOrName}`).get();
    }

    if (!dataset) throw new Error(`Error: There is no dataset with ${datasetIdOrName} name or ID.`);
    if (dataset.itemCount === 0) throw new Error(`Error: Dataset ${datasetIdOrName} is empty.`);

    const datasetId = dataset.id;
    const tableOutDir = path.join(DATA_DIR, DEFAULT_TABLES_OUT_DIR);
    const getItemsOpts = { clean: true };

    if (fields) {
        getItemsOpts.fields = typeof fields === 'string' ? fields.split(',') : fields;
    }

    const sampleItems = await apifyClient.dataset(datasetId).downloadItems(DownloadItemsFormat.CSV, { ...getItemsOpts, limit: 10 });
    // HOTFIX: Enlarge max_record_size to be able handle large fields
    const parsedCsv = parse(sampleItems.items, { max_record_size: 128000 * 5 });
    const headerRowColumns = parsedCsv[0];

    console.log(`Start saving ${dataset.itemCount} results from datasetId ${datasetId}`);

    let paginationItemsOpts = {
        ...getItemsOpts,
        limit: DEFAULT_PAGINATION_LIMIT,
        offset: 0,
    };
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

            paginationItemsOpts = await apifyHelper.saveItemsToFile(
                datasetId,
                paginationItemsOpts,
                RESULTS_FILE_LIMIT,
                resultFile,
                true,
            );
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
