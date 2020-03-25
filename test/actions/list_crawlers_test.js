const { expect } = require('chai');
const sinon = require('sinon');
const { apifyClient } = require('./config');
const listCrawlers = require('../../src/actions/list_crawlers');

describe('List Crawlers action', () => {
    beforeEach(() => {
        sinon.spy(process.stdout, 'write');
    });
    it('should returns crawlers list to stdout', async () => {
        const crawlers = await apifyClient.crawlers.listCrawlers();

        await listCrawlers(apifyClient);

        const callsArguments = process.stdout.write.args;
        const crawlersInStdOut = JSON.parse(callsArguments.map(call => call[0]).join(''));

        expect(crawlersInStdOut.length).to.eql(crawlers.items.length);
        crawlers.items.forEach((crawler, i) => expect(crawler._id).to.eql(crawlersInStdOut[i].id));
    });
    afterEach(() => {
        process.stdout.write.restore();
    });
});
