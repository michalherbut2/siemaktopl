// backend/src/bot/events/messageCreate.ts
import { Events, Message } from 'discord.js';
import { BotEvent } from '../../types/bot';
import { DatabaseManager } from '../../db/DatabaseManager';

const event: BotEvent = {
  name: Events.MessageCreate,
  async execute(message: Message, botManager: any) {
    
    if (message.author.bot) return;

    // Get guild settings
    let guildSettings;
    if (message.guildId) {
      guildSettings = await DatabaseManager.getGuild(message.guildId);
    }

    const prefix = guildSettings?.prefix || process.env.PREFIX || '!';
    
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
   
    if (!commandName) return;

    // Get command from bot manager
    const command = botManager.getPrefixCommand(commandName);

    if (!command) return;

    try {
      await command.execute(message, args);
      
      // // Log command usage
      // if (message.guildId) {
      //   await DatabaseManager.logCommand(commandName, message.guildId, message.author.id);
      // }
    } catch (error) {
      console.error('Error executing prefix command:', error);
      await message.reply('❌ There was an error executing that command.');
    }
  }
};

export default event;