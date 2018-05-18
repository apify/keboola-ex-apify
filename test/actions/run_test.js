const apifyClient = require('./config');
const { expect } = require('chai');
const run = require('../../src/actions/run');

describe('Run action', () => {

    it('Run with finished executionId', async () => {
        const executionId = '3crY42GX5Kge2Fhwv';
        await run(apifyClient, executionId);

        // TODO

        expect(true).to.eql(true);
    });

    // it('Run with finished crawlerId', async () => {
    //
    // };

});
