import {
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { SlashCommand } from "../../types";
import { generateErrorEmbed } from "../../lib/embeds/ErrorEmbed";
import { verifyEvent } from "../../lib/verify/event";
import { EventAutocomplete } from "../../lib/autocomplete/eventAutocomplete";
import {
  subscribeToEvent,
} from "../../lib/notifications/subscribe";
import { getSubscriptionsEmbedFromGuildId } from "../../lib/embeds/notifications/GetSubscriptionsEmbed";
import { getSuccessfulSubscriptionEmbed } from "../../lib/embeds/notifications/GetSuccessfulEmbed";

const ping: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription("Enables notifications for a channel or team.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "The Discord Channel you want match notifications for this team or event to be sent to."
        )
        .addChannelTypes(ChannelType.GuildText, ChannelType.PublicThread)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("event")
        .setAutocomplete(true)
        .setDescription("The event you want Bear Metal notifications for")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction: ChatInputCommandInteraction) {
    const event = interaction.options.get("event")?.value as string;
    const channel = interaction.options.getChannel("channel") as TextChannel;

    if (!event) {
      await interaction.reply({
        embeds: [
          generateErrorEmbed({
            error: "Missing event to enable notifications for",
            command: "/subscribe",
          }),
        ], options: { flags: MessageFlags.Ephemeral }
      });

      return;
    }

    await interaction.reply({ content: "Adding subscription...", options: { flags: MessageFlags.Ephemeral } });

    if (event) {
      // if its an event passed through
      if (!(await verifyEvent(event)) && event.toLowerCase() != "all") {
        await interaction.editReply({
          embeds: [
            generateErrorEmbed({
              error:
                "Invalid event key. Make sure the event you provided exists.",
              command: "/subscribe",
            }),
          ],
        });

        return;
      }

      await subscribeToEvent(interaction.guildId!, channel.id, event);
    }

    const successfulEmbed = getSuccessfulSubscriptionEmbed();
    const subscriptionsEmbed = await getSubscriptionsEmbedFromGuildId(interaction.guild?.id!);
    await interaction.editReply({ content: null, embeds: [successfulEmbed, subscriptionsEmbed] });
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused(true);

    const event = interaction.options.getString("event") || "";

    try {
      if (focusedValue.name == "event") {
        const data = await EventAutocomplete(event, 24);
        data.unshift({
          name: "All Events (Will send every notification received for every event)",
          value: "all",
        });

        await interaction.respond(data);
      }
    } catch (e) {
      console.error(e);
    }
  },
};

export default ping;
