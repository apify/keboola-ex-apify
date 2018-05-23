const { apifyClient } = require('./config');
const { expect } = require('chai');
const sinon = require('sinon');
const listActorsAction = require('../../src/actions/listActors');

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
            const actorId = actor.id || actor._id;
            expect(actorId).to.eql(actorsInStdOut[i].id);
        });
    });
    afterEach(() => {
        process.stdout.write.restore();
    });
});
