// Default constants of the application.
exports.CONFIG_FILE = 'config.json';
exports.DEFAULT_EXTRACTOR_TIMEOUT = 12 * 60 * 60 * 1000;
exports.TIME_TO_SAVE_STATE_MILLIS = 30 * 1000;
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
    listTasks: 'listTasks',
};

exports.ACTION_TYPES = {
    getDatasetItems: 'getDatasetItems',
    runActor: 'runActor',
    runTask: 'runTask',
    getActorLastRunDatasetItems: 'getActorLastRunDatasetItems',
    getTaskLastRunDatasetItems: 'getTaskLastRunDatasetItems',
};

exports.NAME_OF_KEBOOLA_INPUTS_STORE = 'KEBOOLA-INPUTS'; // Name of Apify keyvalue store for Keboola inputs files

exports.KEBOOLA_USER_AGENT = 'Keboola';
