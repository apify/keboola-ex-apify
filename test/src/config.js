const { ApifyClient, DownloadItemsFormat } = require('apify-client');
const fs = require('fs');
const { expect } = require('chai');
const { promisify } = require('util');
const rimraf = require('rimraf');
const path = require('path');
const stripEof = require('strip-eof');
const { RESULTS_FILE_NAME, DATASET_FILE_NAME, DEFAULT_TABLES_OUT_DIR, KEBOOLA_REQUEST_HEADERS } = require('../../src/constants');
const { createFolderPromised } = require('../../src/helpers/fs_helper');

if (!process.env.APIFY_TEST_TOKEN) {
    throw new Error('Missing APIFY_TEST_TOKEN environment variable for tests!');
}

const apifyClient = new ApifyClient({
    token: process.env.APIFY_TEST_TOKEN,
    requestInterceptors: [
        (requestOptions) => {
            requestOptions.headers = {
                ...(requestOptions.headers || {}),
                ...KEBOOLA_REQUEST_HEADERS,
            };
            return requestOptions;
        }
    ]
});

const getLocalResultRows = async (dataset) => {
    const fileName = (dataset) ? DATASET_FILE_NAME : RESULTS_FILE_NAME;
    const resultsPath = path.join(process.env.DATA_DIR, DEFAULT_TABLES_OUT_DIR, fileName);
    const stat = await promisify(fs.lstat)(resultsPath);
    let rows = [];
    if (stat.isFile()) {
        const localCsv = fs.readFileSync(resultsPath);
        rows = localCsv.toString().split(/\r?\n/);
    } else {
        const files = await promisify(fs.readdir)(resultsPath);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const localCsv = fs.readFileSync(path.join(resultsPath, file));
            rows = (i + 1 !== files.length)
                ? rows.concat(stripEof(localCsv.toString()).split(/\r?\n/))
                : rows.concat(localCsv.toString().split(/\r?\n/));
        }
    }
    return rows;
};

const getManifest = () => {
    const manifestPath = path.join(process.env.DATA_DIR, DEFAULT_TABLES_OUT_DIR, `${RESULTS_FILE_NAME}.manifest`);
    return JSON.parse(fs.readFileSync(manifestPath));
};

const checkRows = (localCsvRows, apiRows) => {
    expect(localCsvRows.length).to.eql(apiRows.length);
    localCsvRows.forEach((localRow, i) => {
        expect(localRow.trim()).to.eql(apiRows[i].trim());
    });
};

const actionsTestsSetup = async () => {
    console.log('<-- Test set up -->');
    const folderToCreate = [];
    folderToCreate.push(process.env.DATA_DIR);
    folderToCreate.push(path.join(process.env.DATA_DIR, 'in'));
    folderToCreate.push(path.join(process.env.DATA_DIR, 'in', 'tables'));
    folderToCreate.push(path.join(process.env.DATA_DIR, 'out'));
    folderToCreate.push(path.join(process.env.DATA_DIR, 'out', 'tables'));
    console.log(`Creating folders for input and output data ${folderToCreate.join(', ')}`);
    for (const folder of folderToCreate) {
        await createFolderPromised(folder);
    }
    console.log('<-- Test set up -->');
};

const actionsTestsTeardown = () => {
    console.log('<-- Test tear down -->');
    console.log(`Deleting folder ${process.env.DATA_DIR}`);
    rimraf.sync(process.env.DATA_DIR);
    console.log('<-- Test tear down -->');
};

const saveInputFile = async (content) => {
    const filePath = path.join(process.env.DATA_DIR, 'in', 'tables', 'input.csv');
    fs.writeFileSync(filePath, content);
};

const getDatasetItemsRows = async (datasetId, opts = {}) => {
    const apiResults = await apifyClient.dataset(datasetId).downloadItems(DownloadItemsFormat.CSV, { ...opts });
    return apiResults.toString().split(/\r?\n/);
};

module.exports = {
    apifyClient,
    getLocalResultRows,
    getManifest,
    actionsTestsTeardown,
    actionsTestsSetup,
    checkRows,
    saveInputFile,
    getDatasetItemsRows,
};
