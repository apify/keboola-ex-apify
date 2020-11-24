const { expect } = require('chai');
const path = require('path');
const { ACTIONS, ACTION_TYPES } = require('../src/constants');
const { parseConfigurationOrThrow } = require('../src/helpers/keboola_helper');
const getConfig = require('../src/helpers/config_helper');

describe('Keboola Heplers', () => {
    describe('parseConfigurationOrThrow()', () => {
        it('parse actor should throw error', async () => {
            try {
                await parseConfigurationOrThrow(getConfig(path.join(__dirname, 'configs', 'noToken.json')));
            } catch (err) {
                return;
            }
            throw new Error('Error not thrown');
        });

        it('parse actors list configuration', async () => {
            const config = await parseConfigurationOrThrow(getConfig(path.join(__dirname, 'configs', 'actor-list.json')));
            expect(config.userId).to.equal('myUserId');
            expect(config.token).to.equal('myToken');
            expect(config.action).to.equal(ACTIONS.listActors);
        });

        it('parse dataset configuration', async () => {
            const config = await parseConfigurationOrThrow(getConfig(path.join(__dirname, 'configs', 'dataset.json')));
            expect(config.userId).to.equal('myUserId');
            expect(config.token).to.equal('myToken');
            expect(config.datasetId).to.equal('test-dataset');
            expect(config.action).to.equal(ACTIONS.run);
            expect(config.actionType).to.equal(ACTION_TYPES.getDatasetItems);
        });

        it('parse actor run configuration', async () => {
            const config = await parseConfigurationOrThrow(getConfig(path.join(__dirname, 'configs', 'actorRun.json')));
            expect(config.userId).to.equal('myUserId');
            expect(config.token).to.equal('myToken');
            expect(config.actId).to.equal('my-user-name/actor');
            expect(config.input).to.deep.include({ pages: 1 });
            expect(config.memory).to.equal('512');
            expect(config.build).to.equal('latest');
            expect(config.action).to.equal(ACTIONS.run);
            expect(config.actionType).to.equal(ACTION_TYPES.runActor);
        });
    });
});
