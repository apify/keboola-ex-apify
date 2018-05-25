const { printLargeStringToStdOut } = require('../helpers/apify_helper');

/**
 * Outputs list of crawlers to stdout
 */
module.exports = async function listCrawlersAction(apifyClient) {
    const crawlers = await apifyClient.crawlers.listCrawlers();
    const res = [];
    crawlers.items.forEach((crawler) => {
        const settingsLink = `https://my.apify.com/crawlers/${crawler._id}`;
        res.push({
            id: crawler._id,
            customId: crawler.customId,
            settingsLink,
        });
    });
    const crawlersListOut = JSON.stringify(res);
    printLargeStringToStdOut(crawlersListOut);
};
