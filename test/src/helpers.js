const { ACTOR_SOURCE_TYPES } = require('@apify/consts');
const { apifyClient } = require('./config');

const createAndBuildDummyActor = async () => {
    // Create test actor
    const sourceCode = `
        const Apify = require('apify');
        Apify.main(async () => {
            const input = await Apify.getInput();
            if (input.throw) throw new Error('Test error');
            await Apify.pushData(input.items);
        });
        `;
    const inputSchema = {
        title: 'Test',
        type: 'object',
        schemaVersion: 1,
        properties: {
            throw: {
                title: 'Throw',
                description: 'Bla',
                type: 'boolean',
            },
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
                sourceType: ACTOR_SOURCE_TYPES.SOURCE_FILES,
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
                        content: '{ "name": "my-actor", "version": "0.0.1", "dependencies": { "apify": "^1.1.2" }, "scripts": { "start": "node main.js" }, "author": "Me!"}',
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
    const actor = await apifyClient.actors().create(actorConf);
    console.log(`Testing actor created ${actor.id}`);
    await apifyClient.actor(actor.id).build('0.0', { tag: 'latest', waitForFinish: 120 });
    return actor;
};

const generateTaskName = () => {
    return `my-task-${Math.random().toString().replace('.', '')}`;
};

module.exports = {
    createAndBuildDummyActor,
    generateTaskName,
};
