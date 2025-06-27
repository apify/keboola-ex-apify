import { ActorListSortBy } from 'apify-client';

const { printLargeStringToStdOut } = require('../helpers/apify_helper');

/**
 * Outputs list of actors to stdout
 */
module.exports = async function listActorsAction(apifyClient) {
    const actors = await apifyClient.actors().list({ limit: 100000, sortBy: ActorListSortBy.LAST_RUN_STARTED_AT, desc: true });
    const actorsList = [];
    actors.items.forEach((actor) => {
        const actorId = actor.id;
        const actorName = (actor.username) ? `${actor.username}/${actor.name}` : actor.name;
        const settingsLink = `https://console.apify.com/actors/${actorId}`;
        actorsList.push({
            id: actorId,
            name: actorName,
            settingsLink,
        });
    });
    const actorsListOut = JSON.stringify(actorsList);
    printLargeStringToStdOut(actorsListOut);
};
