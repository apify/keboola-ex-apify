import * as apifyClient from 'apify-client';
import path from 'path';

import command from './helpers/cliHelper';
import { getConfig } from './helpers/configHelper';
import { parseConfiguration } from './helpers/keboolaHelper';
import { CONFIG_FILE, DEFAULT_TABLES_OUT_DIR } from './constants';

import runAction from './actions/run';

/**
 * This is the main part of the program.
 */
(async () => {
  try {
    // Reading of the input configuration.
    const {
      action,
      userId,
      token,
      crawlerId,
      crawlerSettings,
    } = await parseConfiguration(getConfig(path.join(command.data, CONFIG_FILE)));
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    const crawlerClient = apifyClient.default({ userId, token }).crawlers;

    if (action === 'run') {
      await runAction(crawlerClient, crawlerId, crawlerSettings, tableOutDir);
    }

    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
