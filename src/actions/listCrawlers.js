/**
 * Outputs list of crawlers to console
 */
export default async function listCrawlersAction(crawlerClient) {
    const crawlers = await crawlerClient.listCrawlers();
    const res = [];
    crawlers.items.forEach((crawler) => {
        const url = `https://www.apifier.com/crawlers/${crawler._id}`;
        res.push({
            id: crawler._id,
            customId: crawler.customId,
            url,
        });
    });
    process.stdout.write(JSON.stringify(res));
}
