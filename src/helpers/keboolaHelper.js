/**
 * Checks whether the input configuration is valid.
 * If so, the particular object with relevant parameters is returned.
 * If not, rejected promise is returned.
 */
export function parseConfiguration(configObject) {
    return new Promise((resolve, reject) => {
        const action = configObject.get('action') || 'run';
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
        } else if (action === 'run') {
            const executionId = configObject.get('parameters:executionId');
            const crawlerId = configObject.get('parameters:crawlerId');
            if (!executionId && !userId) reject('Parameter userId is not defined!');
            if (!executionId && !token) reject('Parameter token is not defined!');
            if (!executionId && !crawlerId) reject('Parameter crawlerId is not defined!');

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
            });
        } else if (action === 'getDatasetItems') {
            if (!userId) reject('Parameter userId is not defined!');
            if (!token) reject('Parameter token is not defined!');
            const datasetId = configObject.get('parameters:datasetId');
            if (!datasetId) reject('Parameter datasetId is not defined!');

            resolve({
                action,
                userId,
                token,
                datasetId,
            });
        }
    });
}
