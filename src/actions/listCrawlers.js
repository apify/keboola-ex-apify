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
    // You can output in stdout only 64 000 bit in docker container (in plain nodejs process it works at all)
    const maxChunkLength = 50000;
    for (let i = 0; i < crawlersListOut.length; i += maxChunkLength) {
        process.stdout.write(crawlersListOut.substring(i, i + maxChunkLength));
    }
};
