const { expect } = require('chai');
const sinon = require('sinon');
const { apifyClient, getLocalResultRows, getManifest,
    checkRows, actionsTestsSetup, actionsTestsTeardown,
    saveInputFile } = require('./config');
const runCrawlerAction = require('../../src/actions/run_crawler');

const TEST_CRAWLER_ID = 'KEBOOLA_EX_TEST';

const getExecutionResultRows = async (executionId, opts) => {
    const apiResults = await apifyClient.crawlers.getExecutionResults(Object.assign({}, {
        executionId,
        format: 'csv',
        simplified: 1,
        hideUrl: 1,
        skipFailedPages: 1,
    }, opts));

    return apiResults.items.split(/\r?\n/);
};

describe('Run Crawler action', () => {
    // setup
    beforeEach(actionsTestsSetup);

    // teardown
    afterEach(actionsTestsTeardown);

    it('Run crawler with finished executionId', async () => {
        const testExecution = await apifyClient.crawlers.startExecution({
            crawlerId: TEST_CRAWLER_ID,
            wait: 60,
            settings: {
                pageFunction: `function pageFunction(context) {
                    var results = [];
                    for(var i=0;i<10000;i++) {
                        results.push({
                           i: i,
                           value: Math.random()
                        });
                    }
                    return results;
                }`,
                customData: {
                    test: 'test',
                },
            },
        });
        const executionId = testExecution._id;
        await runCrawlerAction(apifyClient, executionId);

        const localCsvRows = await getLocalResultRows();
        const apiRows = await getExecutionResultRows(executionId);

        checkRows(localCsvRows, apiRows);
    });

    it('Run crawler with crawlerId', async () => {
        sinon.spy(console, 'log');
        await runCrawlerAction(apifyClient, null, TEST_CRAWLER_ID);
        const executionId = console.log.args[0][0].match(/ExecutionId:\s(\w+)/)[1];
        console.log.restore();

        const localCsvRows = await getLocalResultRows();
        const apiRows = await getExecutionResultRows(executionId);

        checkRows(localCsvRows, apiRows);
    });


    it('Run crawler with finished crawlerId and crawlerSettings, which returns 100K+ results', async () => {
        const crawlerSettings = {
            customData: {
                test: 'data',
            },
            pageFunction: `function pageFunction(context) {
                if (context.request.type === 'StartUrl') {
                    for (var i=0;i<153;i++) {
                        context.enqueuePage({url: context.request.url+'#'+i});
                    }
                    context.skipOutput();
                } else {
                    var results = [];
                    for(var i=0;i<1000;i++) {
                        results.push({
                            i: (parseInt(context.request.url.match(/\\d+/)[0])*1000) +i,
                            value: Math.random(),
                            value2: Math.random(),
                            value3: Math.random(),
                        });
                    }
                    return results;
                }
                return;
            }`,
        };
        sinon.spy(console, 'log');
        await runCrawlerAction(apifyClient, null, TEST_CRAWLER_ID, crawlerSettings);
        const executionId = console.log.args[0][0].match(/ExecutionId:\s(\w+)/)[1];
        console.log.restore();

        const localCsvRows = await getLocalResultRows();
        const apiRows = await getExecutionResultRows(executionId, { skipHeaderRow: 1 });

        checkRows(localCsvRows, apiRows);

        // Check manifest file
        const expectedManifest = {
            columns: ['i', 'value', 'value2', 'value3'],
        };
        const manifest = getManifest();
        expect(manifest).to.eql(expectedManifest);
    });

    it('Run crawler with input file', async () => {
        const inputFileString = 'column,column2,column3\ntest,value,1\ntest2,value2,2\n';
        saveInputFile(inputFileString);
        sinon.spy(console, 'log');
        await runCrawlerAction(apifyClient, null, TEST_CRAWLER_ID);
        const executionId = console.log.args[0][0].match(/ExecutionId:\s(\w+)/)[1];
        console.log.restore();

        const localCsvRows = await getLocalResultRows();
        const apiRows = await getExecutionResultRows(executionId);

        checkRows(localCsvRows, apiRows);
        // Check input files in customData of execution
        const crawlerSettings = await apifyClient.crawlers.getCrawlerSettings({ crawlerId: TEST_CRAWLER_ID, executionId });
        const kvsFile = await apifyClient.keyValueStores.getRecord(Object.assign(crawlerSettings.customData));
        expect(kvsFile.body.toString()).to.eql(inputFileString);
    });
});
