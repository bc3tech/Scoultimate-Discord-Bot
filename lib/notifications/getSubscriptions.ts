import { DatabaseGuild } from "../../models/DatabaseModels/Notitfications/GuildModel";
import db from "../azuretables";

export async function getSubscriptions(
  id: string
): Promise<DatabaseGuild | undefined> {
  const data = await db
    .collection("guilds")
    .doc<DatabaseGuild>(id)
    .get();

  if (!data) {
    return undefined;
  }

  return data;
}
