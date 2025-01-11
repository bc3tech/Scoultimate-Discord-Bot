import { DatabaseEvent } from "../../models/DatabaseModels/Notitfications/EventModel";
import { DatabaseGuild } from "../../models/DatabaseModels/Notitfications/GuildModel";
import { TBAMatchScoreNotification } from "../../models/WebhookModels/TBAMatchScoreNotificationModel";
import { TBAUpcomingMatchNotification } from "../../models/WebhookModels/TBAUpcomingMatchNotificationModel";
import db from "../azuretables";

export async function getChannelsForNotifications(
  data: TBAUpcomingMatchNotification | TBAMatchScoreNotification,
  event_key: string
): Promise<Set<string>> {
  const channels = new Set<string>();

  (await getChannelsForNotificationsFromEventKey(event_key)).forEach(
    (channel) => channels.add(channel)
  );

  (await getChannelsForNotificationsFromEventKey("all")).forEach((channel) =>
    channels.add(channel)
  );

  return channels;
}

async function getChannelsForNotificationsFromEventKey(
  key: string
): Promise<string[]> {
  const data = await db
    .collection("events")
    .doc<DatabaseEvent>(key)
    .get();

  // No followers of the event in the database
  if (!data) {
    return [];
  }

  // get documents for all the refs
  const newRefs = data.guilds;

  const channels: string[] = [];

  for (let i = 0; i < newRefs.length; i++) {
    const guildData = await db.collection("guilds").doc<DatabaseGuild>(newRefs[i]).get();

    // if there for some reason is an issue with the database storage, we'll just continue to the next object
    if (!guildData) {
      continue;
    }

    // add the channel
    channels.push(guildData.events[key]);
  }

  return channels;
}
