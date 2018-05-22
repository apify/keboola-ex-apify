const { apifyClient, getLocalResultRows, getManifest,
    checkRows, actionsTestsSetup, actionsTestsTeardown,
    saveInputFile } = require('./config');
const { expect } = require('chai');
const sinon = require('sinon');
const run = require('../../src/actions/run');

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

describe('Run action', () => {
    // setup
    beforeEach(actionsTestsSetup);

    // teardown
    afterEach(actionsTestsTeardown);

    it('Run with finished executionId', async () => {
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
        await run(apifyClient, executionId);

        const localCsvRows = await getLocalResultRows();
        const apiRows = await getExecutionResultRows(executionId);

        checkRows(localCsvRows, apiRows);
    });

    it('Run with crawlerId', async () => {
        sinon.spy(console, 'log');
        await run(apifyClient, null, TEST_CRAWLER_ID);
        const executionId = console.log.args[0][0].match(/ExecutionId:\s(\w+)/)[1];
        console.log.restore();

        const localCsvRows = await getLocalResultRows();
        const apiRows = await getExecutionResultRows(executionId);

        checkRows(localCsvRows, apiRows);
    });


    it('Run with finished crawlerId and crawlerSettings, which returns 100K+ results', async () => {
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
        await run(apifyClient, null, TEST_CRAWLER_ID, crawlerSettings);
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

    // TODO: Comments out this, when we have getExecutionDetails with executionId
    // it('Run crawler with input file', async () => {
    //     const inputFileString = 'column,column2,column3\ntest,value,1\ntest2,value2,2\n';
    //     saveInputFile(inputFileString);
    //     sinon.spy(console, 'log');
    //     await run(apifyClient, null, TEST_CRAWLER_ID);
    //     const executionId = console.log.args[0][0].match(/ExecutionId:\s(\w+)/)[1];
    //     console.log.restore();
    //
    //     const localCsvRows = await getLocalResultRows();
    //     const apiRows = await getExecutionResultRows(executionId, { skipHeaderRow: 1 });
    //
    //     checkRows(localCsvRows, apiRows);
    //     // Check input files in customData of execution
    //     const crawlerSettings = await apifyClient.crawlers.getExecutionDetails({ crawlerId: TEST_CRAWLER_ID, executionId });
    //     console.log(crawlerSettings);
    //     const kvsFile = await apifyClient.keyValueStores.getRecord(Object.assign(crawlerSettings.customData));
    //     expect(kvsFile.body.toString()).to.eql(inputFileString);
    // });
});
