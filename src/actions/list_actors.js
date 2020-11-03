const { printLargeStringToStdOut } = require('../helpers/apify_helper');

/**
 * Outputs list of actors to stdout
 */
module.exports = async function listActorsAction(apifyClient) {
    const actors = await apifyClient.acts.listActs({ limit: 100000 });
    const actorsList = [];
    actors.items.forEach((actor) => {
        const actorId = actor.id || actor._id;
        const actorName = (actor.username) ? `${actor.username}/${actor.name}` : actor.name;
        const settingsLink = `https://my.apify.com/acts/${actorId}`;
        actorsList.push({
            id: actorId,
            name: actorName,
            settingsLink,
        });
    });
    const actorsListOut = JSON.stringify(actorsList);
    printLargeStringToStdOut(actorsListOut);
};
