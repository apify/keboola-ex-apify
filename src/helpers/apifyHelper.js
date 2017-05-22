import { sleep } from 'wait-promise';

// todo: add timeout
export async function waitUntilFinished(executionId, crawlerClient , interval = 2000) {
  let running = true;
  while (running) {
    const executionState = await crawlerClient.getExecutionDetails({ executionId });
    console.log('Execution ' + executionState.status);
    if (executionState.status !== 'RUNNING') {
      running = false;
    }
    await sleep(interval);
  }
}
