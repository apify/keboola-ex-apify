const { expect } = require('chai');
const sinon = require('sinon');
const { apifyClient } = require('../src/config');
const listActorsAction = require('../../src/actions/list_actors');
const { SORT_BY } = require('../../src/constants');

describe('List Actors action', () => {
    beforeEach(() => {
        sinon.spy(process.stdout, 'write');
    });
    it('should returns actors list to stdout', async () => {
        const actors = await apifyClient.actors().list({ limit: 100000, sortBy: SORT_BY.LAST_RUN_STARTED_AT, desc: true });

        await listActorsAction(apifyClient);

        const callsArguments = process.stdout.write.args;
        const actorsInStdOut = JSON.parse(callsArguments.map((call) => call[0]).join(''));

        expect(actorsInStdOut.length).to.eql(actors.items.length);
        actors.items.forEach((actor, i) => {
            const actorId = actor.id;
            expect(actorId).to.eql(actorsInStdOut[i].id);
        });
    });
    afterEach(() => {
        process.stdout.write.restore();
    });
});
