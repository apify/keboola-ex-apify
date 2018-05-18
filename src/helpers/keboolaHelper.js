const { ACTIONS, ACTION_TYPES } = require('../constants');


/**
 * Checks whether the input configuration is valid.
 * If so, the particular object with relevant parameters is returned.
 * If not, rejected promise is returned.
 */
function parseConfiguration(configObject) {
    return new Promise((resolve, reject) => {
        const action = configObject.get('action') || ACTIONS.run;
        const userId = configObject.get('parameters:userId');
        const token = configObject.get('parameters:#token');
        if (action === 'listCrawlers') {
            if (!userId) reject('Parameter userId is not defined!');
            if (!token) reject('Parameter token is not defined!');
            resolve({
                action,
                userId,
                token,
            });
        } else if (action === ACTIONS.run) {
            // Action run means that is run asynchronous and resuls'll seve to data.out
            const actionType = configObject.get('parameters:actionType') || ACTION_TYPES.runExecution;
            if (actionType === ACTION_TYPES.getDatasetItems) {
                if (!userId) reject('Parameter userId is not defined!');
                if (!token) reject('Parameter token is not defined!');
                const datasetId = configObject.get('parameters:datasetId');
                if (!datasetId) reject('Parameter datasetId is not defined!');

                resolve({
                    action,
                    userId,
                    token,
                    datasetId,
                    actionType,
                });
            } else {
                // This is default action type for gets results from specific execution or
                // strarts execution and gets results after finished
                const executionId = configObject.get('parameters:executionId');
                const crawlerId = configObject.get('parameters:crawlerId');
                if (!executionId && !userId) reject('Parameter userId is not defined!');
                if (!executionId && !token) reject('Parameter token is not defined!');
                if (!executionId && !crawlerId) reject('Parameter crawlerId and executionId is not defined!');

                const crawlerSettings = configObject.get('parameters:crawlerSettings') || {};
                const timeout = configObject.get('parameters:timeout');

                resolve({
                    action,
                    userId,
                    token,
                    crawlerId,
                    crawlerSettings,
                    timeout,
                    executionId,
                    actionType,
                });
            }
        }
    });
}

module.exports = {
    parseConfiguration,
};
