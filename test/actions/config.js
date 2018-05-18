const ApifyClient = require('apify-client');
const rimraf = require('rimraf');
const path = require('path');
const { createFolderPromised } = require('../../src/helpers/fsHelper');

if (!process.env.APIFY_TEST_USER_ID || !process.env.APIFY_TEST_TOKEN) {
    throw new Error('Missing APIFY_TEST_USER_ID or APIFY_TEST_TOKEN environment variable for tests!');
}

// setup
before(async () => {
    console.log('<-- Test set up -->');
    const folderToCreate = [];
    folderToCreate.push(process.env.DATA_DIR);
    folderToCreate.push(path.join(process.env.DATA_DIR, 'in'));
    folderToCreate.push(path.join(process.env.DATA_DIR, 'in', 'tables'));
    folderToCreate.push(path.join(process.env.DATA_DIR, 'out'));
    folderToCreate.push(path.join(process.env.DATA_DIR, 'out', 'tables'));
    console.log(`Creating folders for input and output data ${folderToCreate.join(', ')}`);
    for (const folder of folderToCreate) {
        await createFolderPromised(folder);
    }
    console.log('<-- Test set up -->');
});

// teardown
after(() => {
    console.log('<-- Test tear down -->');
    console.log(`Deleting folder ${process.env.DATA_DIR}`);
    // rimraf.sync(process.env.DATA_DIR);
    console.log('<-- Test tear down -->');

});

module.exports = new ApifyClient({ userId: process.env.APIFY_TEST_USER_ID, token: process.env.APIFY_TEST_TOKEN });
