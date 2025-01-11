import { DatabaseEvent } from "../../models/DatabaseModels/Notitfications/EventModel";
import { DatabaseGuild } from "../../models/DatabaseModels/Notitfications/GuildModel";
import db from "../azuretables";
import { Document } from "../azuretables";


export async function subscribeToEvent(
  guild: string,
  channel: string,
  event: string
) {
  const guildDoc: Document<DatabaseGuild> = db.collection("guilds").doc(guild);
  const guildRef: DatabaseGuild = await guildDoc.get() ?? { events: {}, teams: {} };

  guildRef.events[event] = channel;

  const eventDoc: Document<DatabaseEvent> = db.collection("events").doc(event);
  const eventRef = await eventDoc.get() ?? { guilds: [] };

  eventRef.guilds.push(guild);

  await guildDoc.set(guildRef)

  await eventDoc.set(eventRef);
}

export async function subscribeToTeam(
  guild: string,
  channel: string,
  team: string | number
) {
  const teamStr = typeof team == "string" ? team : `${team}`;
  const guildDoc: Document<DatabaseGuild> = db.collection("guilds").doc(guild);
  const guildRef: DatabaseGuild = await guildDoc.get() ?? { events: {}, teams: {} };

  guildRef.teams[team] = channel;

  const teamDoc: Document<DatabaseEvent> = db.collection("teams").doc(teamStr);
  const teamRef = await teamDoc.get() ?? { guilds: [] };

  teamRef.guilds.push(guild);

  await guildDoc.set(guildRef)

  await teamDoc.set(teamRef);
};
