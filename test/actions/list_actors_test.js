const { expect } = require('chai');
const sinon = require('sinon');
const { apifyClient } = require('./config');
const listActorsAction = require('../../src/actions/list_actors');

describe('List Actors action', () => {
    beforeEach(() => {
        sinon.spy(process.stdout, 'write');
    });
    it('should returns actors list to stdout', async () => {
        const actors = await apifyClient.acts.listActs({ limit: 100000 });

        await listActorsAction(apifyClient);

        const callsArguments = process.stdout.write.args;
        const actorsInStdOut = JSON.parse(callsArguments.map(call => call[0]).join(''));

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
