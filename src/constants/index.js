// Apify constants
exports.APIFY_API_BASE_URL = 'https://api.apify.com/v1';

// Default constants of the application.
exports.CONFIG_FILE = 'config.json';
exports.DEFAULT_EXTRACTOR_TIMEOUT = 55 * 60 * 1000;
exports.DEFAULT_DATA_DIR = '/data';
exports.DEFAULT_TABLES_IN_DIR = '/in/tables';
exports.DEFAULT_TABLES_OUT_DIR = '/out/tables';
exports.STATE_IN_FILE = '/in/state.json';
exports.STATE_OUT_FILE = '/out/state.json';

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
};

exports.ACTION_TYPES = {
    runExecution: 'runExecution',
    getDatasetItems: 'getDatasetItems',
};
