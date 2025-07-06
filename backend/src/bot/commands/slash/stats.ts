// commands/stats.js or .ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../../../types/bot";
import { DatabaseManager } from "../../../db/DatabaseManager";
import { PunishmentType } from "@prisma/client";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View punishment statistics")
    .addSubcommand(sub =>
      sub
        .setName("punishments")
        .setDescription("Show punishment stats for this server")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const guild = interaction.guild;

    const allPunishments = await DatabaseManager.getRecentPunishments(
      guild.id,
      { limit: 1000 }
    );
    const activeTimeouts = await DatabaseManager.getActivePunishments(
      guild.id,
      PunishmentType.TIMEOUT
    );

    const countByType = allPunishments.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topModerators = allPunishments.reduce((acc, p) => {
      if (!p.executorId) return acc;
      acc[p.executorId] = (acc[p.executorId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedMods = Object.entries(topModerators)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const embed = {
      title: `📊 Punishment Statistics`,
      color: 0x0099ff,
      fields: [
        {
          name: "Total Punishments",
          value: allPunishments.length.toString(),
          inline: true,
        },
        ...Object.entries(countByType).map(([type, count]) => ({
          name: `${type}`,
          value: `${count}`,
          inline: true,
        })),
        {
          name: "Active Timeouts",
          value: `${activeTimeouts.length}`,
          inline: true,
        },
        {
          name: "Top Moderators",
          value:
            sortedMods.map(([id, count]) => `<@${id}> — ${count}`).join("\n") ||
            "N/A",
        },
      ],
      timestamp: new Date().toISOString(),
    };

    interaction.reply({ embeds: [embed] });
  },
};

export default command;
