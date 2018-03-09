import * as apifyHelper from '../helpers/apifyHelper';
import path from 'path';
import parseCsvPromised from '../helpers/csvHelpers';
import { createFilePromised, createFolderPromised } from '../helpers/fsHelper';
import command from '../helpers/cliHelper';
import { DEFAULT_TABLES_OUT_DIR } from '../constants';

const RESULTS_FILE_LIMIT = 50000;
const DEFAULT_PAGINATION_LIMIT = 1000;


/**
 * Outputs all data from Apify datasets to data/out
 */
export default async function getDatasetItems(apifyClient, maybeDatasetId) {
    const apifyDatasets = await apifyClient.datasets;
    let dataset = await apifyDatasets.getDataset({ datasetId: maybeDatasetId });
    if (!dataset) {
        // Try to find by name
        const datasets = await apifyDatasets.listDatasets({ limit: 99999 });
        for (const maybeDataset of datasets.items) {
            if (maybeDataset.name === maybeDatasetId) dataset = await apifyDatasets.getDataset({ datasetId: maybeDataset.id });
        }
    }

    if (!dataset) throw new Error(`Error: Apify dataset with ${maybeDatasetId} name or id doesn't exist.`);

    const datasetId = dataset.id;
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    const fileName = 'dataset-items.csv';
    const getItemsOpts = {
        datasetId,
        format: 'csv',
    };
    const sampleItems = await apifyDatasets.getItems(Object.assign(getItemsOpts, { limit: 10 }));
    const parsedCsv = await parseCsvPromised(sampleItems.items);
    const headerRowColumns = parsedCsv[0];

    console.log(`Start saving ${dataset.itemCount} results from datasetId ${datasetId}`);

    let paginationItemsOpts = Object.assign(getItemsOpts, {
        limit: DEFAULT_PAGINATION_LIMIT,
        offset: 0,
    });
    if (dataset.itemCount > RESULTS_FILE_LIMIT) {
        // save results by chunks to sliced tables
        // fix empty header row column
        const headerRowColumnsClean = headerRowColumns.map(column => {
            return (column === '') ? 'x' : column;
        });
        const manifest = {
            columns: headerRowColumnsClean,
        };
        const resultDir = path.join(tableOutDir, fileName);
        await createFolderPromised(resultDir);

        let fileCounter = 1;
        while (true) {
            const resultFile = path.join(resultDir, `slice${fileCounter}`);

            if (dataset.itemCount < paginationItemsOpts.offset) break;

            paginationItemsOpts = await apifyHelper.saveItemsToFile(apifyDatasets, paginationItemsOpts, RESULTS_FILE_LIMIT, resultFile, true);
            fileCounter += 1;
        }

        await createFilePromised(path.join(tableOutDir, `${fileName}.manifest`), JSON.stringify(manifest));
    } else {
        // save result to one file
        const resultFile = path.join(tableOutDir, fileName);
        await createFilePromised(resultFile, '');
        await apifyHelper.saveItemsToFile(apifyDatasets, paginationItemsOpts, RESULTS_FILE_LIMIT, resultFile, false);
    }
    console.log(`Items from dataset ${datasetId} were saved!`);
}
