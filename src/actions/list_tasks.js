const { printLargeStringToStdOut } = require('../helpers/apify_helper');

/**
 * Outputs list of tasks to stdout
 */
module.exports = async function listActorsAction(apifyClient) {
    const tasks = await apifyClient.tasks().list({ limit: 100000 });
    const taskList = [];
    tasks.items.forEach((task) => {
        const actorTaskId = task.id;
        const taskName = (task.username) ? `${task.username}/${task.name}` : task.name;
        const settingsLink = `https://console.apify.com/actors/tasks/${actorTaskId}`;
        taskList.push({
            id: actorTaskId,
            name: taskName,
            settingsLink,
        });
    });
    const tasksListOut = JSON.stringify(taskList);
    printLargeStringToStdOut(tasksListOut);
};
