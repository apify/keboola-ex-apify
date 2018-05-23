const { apifyClient, getLocalResultRows, checkRows,
    actionsTestsSetup, actionsTestsTeardown, getDatasetItemsRows } = require('./config');
const sinon = require('sinon');
const runActorAction = require('../../src/actions/runActor');

const TEST_ACTOR_ID = 'g4kx2tPptErWMFCra';

describe('Run Actor', () => {
    // Setup test
    beforeEach(actionsTestsSetup);

    it('Works', async () => {
        sinon.spy(console, 'log');
        await runActorAction(apifyClient, TEST_ACTOR_ID, { pages: 1 });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId } = await apifyClient.acts.getRun({ runId, actId: TEST_ACTOR_ID });

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        checkRows(localCsvRows, apiRows);
    });

    // Teardown test
    afterEach(actionsTestsTeardown);
});
