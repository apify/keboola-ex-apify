export default async function runAction(crawlerClient) {
    const crawlers = await crawlerClient.listCrawlers();
    const res = [];
    crawlers.forEach((crawler) => {
        const settingsLink = `https://www.apifier.com/crawlers/${crawler._id}`;
        res.push({
            id: crawler._id,
            customId: crawler.customId,
            settingsLink,
        });
    });
    console.log(JSON.stringify(res));
}
