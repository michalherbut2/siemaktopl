// backend/src/bot/commands/prefix/help.ts
import {
  EmbedBuilder,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { SlashCommand } from "../../../types/bot";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows all available commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("📚 Help Menu")
      .setDescription("Here are all available commands:")
      .addFields(
        { name: '🏓 Ping', value: '`/ping` - Check bot latency', inline: false },
        { name: "❓ Help", value: "`!help` - Show this menu", inline: false }
      )
      .setColor("#0099ff")
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};

export default command;
