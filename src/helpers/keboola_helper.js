const path = require('path');
const { ACTIONS, ACTION_TYPES, DATA_DIR, DEFAULT_TABLES_IN_DIR } = require('../constants');
const {
    fileStatPromied,
    readDirPromised,
    readFilePromised,
} = require('./fs_helper');

function parseConfig(configObject) {
    const config = {
        action: configObject.get('action') || ACTIONS.run,
        token: configObject.get('parameters:#token'),
        datasetId: configObject.get('parameters:datasetId'),
        actId: configObject.get('parameters:actId'),
        actorTaskId: configObject.get('parameters:actorTaskId'),
        input: configObject.get('parameters:input'),
        memory: configObject.get('parameters:memory'),
        build: configObject.get('parameters:build'),
        executionId: configObject.get('parameters:executionId'),
        crawlerId: configObject.get('parameters:crawlerId'),
        crawlerSettings: configObject.get('parameters:crawlerSettings') || {},
        timeout: configObject.get('parameters:timeout'),
        fields: configObject.get('parameters:fields'),
    };
    if (config.action === ACTIONS.run) {
        config.actionType = configObject.get('parameters:actionType') || ACTION_TYPES.runActor;
    }
    return config;
}

/**
 * Checks whether the input configuration is valid.
 * If so, the particular object with relevant parameters is returned.
 * If not, throw error.
 */
function parseConfigurationOrThrow(configObject) {
    const config = parseConfig(configObject);
    if (config.action === ACTIONS.listActors) {
        // These actions don't need any other parameters
        if (!config.token) throw new Error('Parameter token is not defined!');
    } else if (config.action === ACTIONS.listTasks) {
        // These actions don't need any other parameters
        if (!config.token) throw new Error('Parameter token is not defined!');
    } else if (config.action === ACTIONS.run) {
        if (config.actionType === ACTION_TYPES.getDatasetItems
            || config.actionType === ACTION_TYPES.runActor) {
            if (!config.token) throw new Error('Parameter token is not defined!');
        }
        if (config.actionType === ACTION_TYPES.getDatasetItems) {
            if (!config.datasetId) throw new Error('Parameter datasetId is not defined!');
        } else if (config.actionType === ACTION_TYPES.runActor) {
            if (!config.actId) throw new Error('Parameter actId is not defined!');
        } else if (config.actionType === ACTION_TYPES.runTask) {
            if (!config.actorTaskId) throw new Error('Parameter actorTaskId is not defined!');
        } else {
            if (!config.executionId && !config.token) throw new Error('Parameter token is not defined!');
            if (!config.executionId && !config.crawlerId) throw new Error('Parameter crawlerId and executionId is not defined!');
        }
    } else {
        throw new Error('Unknown action!');
    }

    // BugFix: The empty object({}) on input was parsed by Keboola into empty array([]) (PHP stuff -> json_decode($configuration, true))
    // It is known issue in Keboola, but we need to handle this properly. Otherwise input validation failed.
    if (config.input && Array.isArray(config.input) && config.input.length === 0) {
        config.input = {};
    }

    return config;
}

/**
 * Get files from default table in directory as Buffer
 * @return {Promise<Buffer>||Promise<null>}
 */
const getInputFile = async () => {
    const tablesInDirPath = path.join(DATA_DIR, DEFAULT_TABLES_IN_DIR);
    try {
        await fileStatPromied(tablesInDirPath);
    } catch (e) {
        // Folder doesn't exist, input file wasn't pass
        return null;
    }

    const files = await readDirPromised(tablesInDirPath);
    if (files.length) {
        const fileBuffer = await readFilePromised(path.join(tablesInDirPath, files[0]));
        return fileBuffer;
    }
};

module.exports = {
    parseConfigurationOrThrow,
    getInputFile,
};
