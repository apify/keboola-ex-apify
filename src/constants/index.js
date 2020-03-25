// Default constants of the application.
exports.CONFIG_FILE = 'config.json';
exports.DEFAULT_EXTRACTOR_TIMEOUT = 55 * 60 * 1000;
exports.DEFAULT_DATA_DIR = '/data';
exports.DEFAULT_TABLES_IN_DIR = '/in/tables';
exports.DEFAULT_TABLES_OUT_DIR = '/out/tables';
exports.STATE_IN_FILE = '/in/state.json';
exports.STATE_OUT_FILE = '/out/state.json';
exports.RESULTS_FILE_NAME = 'crawler-result.csv';
exports.DATASET_FILE_NAME = 'dataset-items.csv';

// Data dir
exports.DATA_DIR = process.env.DATA_DIR || exports.DEFAULT_DATA_DIR;

// Event constants
exports.EVENT_FINISH = 'finish';
exports.EVENT_CLOSE = 'close';
exports.EVENT_ERROR = 'error';
exports.EVENT_DATA = 'data';
exports.EVENT_END = 'end';

exports.ACTIONS = {
    run: 'run',
    listCrawlers: 'listCrawlers',
    listActors: 'listActors',
};

exports.ACTION_TYPES = {
    runExecution: 'runExecution', // This should be runCrawler like other variables name
    getDatasetItems: 'getDatasetItems',
    runActor: 'runActor',
};

exports.NAME_OF_KEBOOLA_INPUTS_STORE = 'KEBOOLA-INPUTS'; // Name of Apify keyvalue store for Keboola inputs files
