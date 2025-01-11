import { FieldValue } from "firebase-admin/firestore";
import db from "../azuretables";

export async function unsubscribeFromEvent(guild: string, event: string) {
  const guildRef = db
    .collection("guilds")
    .doc(guild);

  const eventRef = db
    .collection("events")
    .doc(event);

//   await guildRef.set({
//     [`events.${event}`]: FieldValue.delete(),
//   });

//   await eventRef.set({
//     guilds: FieldValue.arrayRemove(guild),
//   });
}

export async function unsubscribeFromTeam(
  guild: string,
  team: string | number
) {
  const teamStr = typeof team == "string" ? team : `${team}`;

  const guildRef = db
    .collection("guilds")
    .doc(guild);

  const teamRef = db
    .collection("teams")
    .doc(teamStr);

  // await db
  //   .runTransaction(async (transaction) => {
  //     const guildDoc = await guildRef.get();
  //     const teamDoc = await teamRef.get();

  //     if (guildDoc.exists) {
  //       transaction.update(guildRef, {
  //         [`teams.${teamStr}`]: FieldValue.delete(),
  //       });
  //     }

  //     if (teamDoc.exists) {
  //       transaction.update(teamRef, {
  //         guilds: FieldValue.arrayRemove(guildRef),
  //       });
  //     }
  //   })
  //   .catch((err) => console.error(err));
}
