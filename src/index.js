import * as apifyClient from 'apify-client';
import path from 'path';

import command from './helpers/cliHelper';
import getConfig from './helpers/configHelper';
import { parseConfiguration } from './helpers/keboolaHelper';
import { CONFIG_FILE, DEFAULT_TABLES_OUT_DIR } from './constants';

import runAction from './actions/run';
import listCrawlersAction from './actions/listCrawlers';

/**
 * Main part of the program.
 */
(async () => {
    try {
        const {
          action,
          userId,
          token,
          crawlerId,
          crawlerSettings,
          timeout,
        } = await parseConfiguration(getConfig(path.join(command.data, CONFIG_FILE)));

        const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
        const crawlerClient = apifyClient.default({ userId, token }).crawlers;

        if (action === 'run') {
            await runAction(crawlerClient, crawlerId, crawlerSettings, tableOutDir, timeout);
        } else if (action === 'listCrawlers') {
            await listCrawlersAction(crawlerClient);
        } else {
            throw new Error(`Error: Unknown Action ${action}`);
        }

        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})();
