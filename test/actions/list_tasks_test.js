const { expect } = require('chai');
const sinon = require('sinon');
const { apifyClient } = require('../src/config');
const listTasksAction = require('../../src/actions/list_tasks');

describe('List tasks action', () => {
    beforeEach(() => {
        sinon.spy(process.stdout, 'write');
    });
    it('should returns tasks list to stdout', async () => {
        const tasks = await apifyClient.tasks().list({ limit: 100000 });

        await listTasksAction(apifyClient);

        const callsArguments = process.stdout.write.args;
        const actorsInStdOut = JSON.parse(callsArguments.map((call) => call[0]).join(''));

        expect(actorsInStdOut.length).to.eql(tasks.items.length);
        tasks.items.forEach((task, i) => {
            const taskId = task.id;
            expect(taskId).to.eql(actorsInStdOut[i].id);
        });
    });
    afterEach(() => {
        process.stdout.write.restore();
    });
});
