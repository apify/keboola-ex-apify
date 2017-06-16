/**
 * Outputs list of crawlers to stdout
 */
export default async function listCrawlersAction(crawlerClient) {
    const crawlers = await crawlerClient.listCrawlers();
    const res = [];
    crawlers.items.forEach((crawler) => {
        const settingsLink = `https://www.apifier.com/crawlers/${crawler._id}`;
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
}
