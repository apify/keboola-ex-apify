const { printLargeStringToStdOut } = require('../helpers/apify_helper');

/**
 * Outputs list of actors to stdout
 */
module.exports = async function listActorsAction(apifyClient) {
    const actors = await apifyClient.actors().list({ limit: 100000 });
    const actorsList = [];
    actors.items.forEach((actor) => {
        const actorId = actor.id;
        const actorName = (actor.username) ? `${actor.username}/${actor.name}` : actor.name;
        const settingsLink = `https://my.apify.com/actors/${actorId}`;
        actorsList.push({
            id: actorId,
            name: actorName,
            settingsLink,
        });
    });
    const actorsListOut = JSON.stringify(actorsList);
    printLargeStringToStdOut(actorsListOut);
};
