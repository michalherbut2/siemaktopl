// backend/src/bot/commands/slash/ping.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../../types/bot';
import { DatabaseManager } from '../../../db/DatabaseManager';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),

  async execute(interaction: ChatInputCommandInteraction) {
    const start = Date.now();
    
    await interaction.reply('🏓 Pinging...');
    
    const end = Date.now();
    const ping = end - start;
    const apiPing = Math.round(interaction.client.ws.ping);
    
    await interaction.editReply(`🏓 Pong!\n**Bot Latency:** ${ping}ms\n**API Latency:** ${apiPing}ms`);
    
    // // Log command usage
    // if (interaction.guildId) {
    //   await DatabaseManager.logCommand('ping', interaction.guildId, interaction.user.id);
    // }
  }
};

export default command;