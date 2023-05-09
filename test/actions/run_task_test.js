const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const _ = require('underscore');
const { apifyClient, getLocalResultRows, checkRows, saveInputFile,
    actionsTestsSetup, actionsTestsTeardown, getDatasetItemsRows } = require('./config');
const runTaskAction = require('../../src/actions/run_task');

const generatedName = () => {
    return `my-task-${Math.random().toString().replace('.', '')}`;
};

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Run Actor', () => {
    let actorId;
    before(async () => {
        // Create test actor
        const sourceCode = `
        const Apify = require('apify');
        Apify.main(async () => {
            const input = await Apify.getInput();
            await Apify.pushData(input.items);
        });
        `;
        const inputSchema = {
            title: 'Test',
            type: 'object',
            schemaVersion: 1,
            properties: {
                items: {
                    title: 'Items',
                    description: 'Bla',
                    type: 'array',
                    editor: 'json',
                },
            },
            required: ['items'],
        };
        const actorConf = {
            name: `Generated-${Math.random().toString().replace('.', '')}`,
            versions: [
                {
                    versionNumber: '0.0',
                    envVars: [],
                    sourceType: 'SOURCE_FILES',
                    buildTag: 'latest',
                    sourceFiles: [
                        {
                            name: 'Dockerfile',
                            format: 'TEXT',
                            content: "# First, specify the base Docker image. You can read more about\n# the available images at https://sdk.apify.com/docs/guides/docker-images\n# You can also use any other image from Docker Hub.\nFROM apify/actor-node\n\n# Second, copy just package.json and package-lock.json since those are the only\n# files that affect \"npm install\" in the next step, to speed up the build.\nCOPY package*.json ./\n\n# Install NPM packages, skip optional and development dependencies to\n# keep the image small. Avoid logging too much and print the dependency\n# tree for debugging\nRUN npm --quiet set progress=false \\\n && npm install --only=prod --no-optional \\\n && echo \"Installed NPM packages:\" \\\n && (npm list || true) \\\n && echo \"Node.js version:\" \\\n && node --version \\\n && echo \"NPM version:\" \\\n && npm --version\n\n# Next, copy the remaining files and directories with the source code.\n# Since we do this after NPM install, quick build will be really fast\n# for most source file changes.\nCOPY . ./\n\n# Optionally, specify how to launch the source code of your actor.\n# By default, Apify's base Docker images define the CMD instruction\n# that runs the Node.js source code using the command specified\n# in the \"scripts.start\" section of the package.json file.\n# In short, the instruction looks something like this:\n#\n# CMD npm start\n",
                        },
                        {
                            name: 'package.json',
                            format: 'TEXT',
                            content: '{\n    "name": "my-actor",\n    "version": "0.0.1",\n    "dependencies": {\n        "apify": "^1.1.2"\n    },\n    "scripts": {\n        "start": "node main.js"\n    },\n    "author": "Me!"\n}',
                        },
                        {
                            name: 'INPUT_SCHEMA.json',
                            format: 'TEXT',
                            content: JSON.stringify(inputSchema),
                        },
                        {
                            name: 'main.js',
                            format: 'TEXT',
                            content: sourceCode,
                        },
                    ],
                },
            ],
        };
        const actor = await apifyClient.acts.createAct({ act: actorConf });
        console.log(`Testing actor created ${actor.id}`);
        await apifyClient.acts.buildAct({ actId: actor.id, version: '0.0', tag: 'latest', waitForFinish: 120 });
        actorId = actor.id;
    });
    after(async () => {
        await apifyClient.acts.deleteAct({ actId: actorId });
    });
    // Setup test
    beforeEach(actionsTestsSetup);
    // Teardown test
    afterEach(actionsTestsTeardown);

    it('Run task and return dataset with fields', async () => {
        const items = _.times(1000, (i) => {
            return {
                i,
                test: Math.random(),
            };
        });
        const task = await apifyClient.tasks.createTask({ task: { actId: actorId, name: generatedName(), input: { items } } });
        sinon.spy(console, 'log');
        await runTaskAction({ apifyClient, actorTaskId: task.id });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId } = await apifyClient.acts.getRun({ runId, actId: task.actId });

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        checkRows(localCsvRows, apiRows);
    });

    it('Run with overridden input works', async () => {
        const items = _.times(1000, (i) => {
            return {
                i,
                test: Math.random(),
            };
        });
        const task = await apifyClient.tasks.createTask({ task: { actId: actorId, name: generatedName(), input: { items: [{}] } } });
        sinon.spy(console, 'log');
        await runTaskAction({ apifyClient, actorTaskId: task.id, input: { items } });
        const runId = console.log.args[0][0].match(/runId:\s(\w+)/)[1];
        console.log.restore();

        const { defaultDatasetId } = await apifyClient.acts.getRun({ runId, actId: task.actId });

        const localCsvRows = await getLocalResultRows(true);
        const apiRows = await getDatasetItemsRows(defaultDatasetId);

        checkRows(localCsvRows, apiRows);
    });

    it('throw error if didn\'t match input schema', async () => {
        const task = await apifyClient.tasks.createTask({ task: { actId: actorId, name: generatedName(), input: { items: [{}] } } });
        await expect(runTaskAction({ apifyClient, actorTaskId: task.id, input: { items: 'string but must be array' } })).be.rejectedWith('Input');
    });
});
