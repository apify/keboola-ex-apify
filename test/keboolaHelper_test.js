const { expect } = require('chai');
const path = require('path');
const { ACTIONS, ACTION_TYPES } = require('../src/constants');
const { parseConfiguration } = require('../src/helpers/keboolaHelper');
const getConfig = require('../src/helpers/configHelper');

describe('Keboola Heplers', () => {
    describe('parseConfiguration()', () => {
        it('parse exectuionId configuration', async () => {
            const config = await parseConfiguration(getConfig(path.join(__dirname, 'configs', 'executionId.json')));
            expect(config.executionId).to.equal('testExecutionId');
            expect(config.action).to.equal(ACTIONS.run);
        });

        it('parse crawlerId configuration', async () => {
            const config = await parseConfiguration(getConfig(path.join(__dirname, 'configs', 'crawlerId.json')));
            expect(config.userId).to.equal('myUserId');
            expect(config.token).to.equal('myToken');
            expect(config.crawlerId).to.equal('Example_Hacker_News');
            expect(config.action).to.equal(ACTIONS.run);
            expect(config.actionType).to.equal(ACTION_TYPES.runExecution);
        });

        it('parse crawler list configuration', async () => {
            const config = await parseConfiguration(getConfig(path.join(__dirname, 'configs', 'crawlers-list.json')));
            expect(config.userId).to.equal('myUserId');
            expect(config.token).to.equal('myToken');
            expect(config.action).to.equal(ACTIONS.listCrawlers);
        });

        it('parse dataset configuration', async () => {
            const config = await parseConfiguration(getConfig(path.join(__dirname, 'configs', 'dataset.json')));
            expect(config.userId).to.equal('myUserId');
            expect(config.token).to.equal('myToken');
            expect(config.datasetId).to.equal('test-dataset');
            expect(config.action).to.equal(ACTIONS.run);
            expect(config.actionType).to.equal(ACTION_TYPES.getDatasetItems);
        });
    });
});