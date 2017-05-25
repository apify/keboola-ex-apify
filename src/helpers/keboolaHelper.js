/**
 * Helper that checks whether the input configuration is valid.
 * If so, the particular object with relevant parameters is returned.
 * If not, rejected promise is returned.
 */
export function parseConfiguration(configObject) {
    return new Promise((resolve, reject) => {
        const action = configObject.get('action') || 'run';

        const userId = configObject.get('parameters:userId');
        if (!userId) {
            reject('Parameter userId is not defined!');
        }
        const token = configObject.get('parameters:#token');
        if (!token) {
            reject('Parameter token is not defined!');
        }

        if (action === 'listCrawlers') {
            resolve({
                action,
                userId,
                token,
            });
        } else {
            const crawlerId = configObject.get('parameters:crawlerId');
            if (!crawlerId) {
                reject('Parameter crawlerId is not defined!');
            }

            const crawlerSettings = configObject.get('parameters:crawlerSettings') || {};
            const timeout = configObject.get('parameters:timeout');

            resolve({
                action,
                userId,
                token,
                crawlerId,
                crawlerSettings,
                timeout,
            });
        }
    });
}
