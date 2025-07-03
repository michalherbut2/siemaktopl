// backend/src/bot/commands/prefix/help.ts
import { Message, EmbedBuilder } from 'discord.js';
import { PrefixCommand } from '../../../types/bot';

const command: PrefixCommand = {
  name: 'help',
  description: 'Shows all available commands',
  aliases: ['h', 'commands'],
  usage: 'help [command]',

  async execute(message: Message, args: string[]) {
    const embed = new EmbedBuilder()
      .setTitle('📚 Help Menu')
      .setDescription('Here are all available commands:')
      .addFields(
        { name: '🏓 Ping Commands', value: '`!ping` - Check bot latency', inline: false },
        { name: '❓ Help', value: '`!help` - Show this menu', inline: false }
      )
      .setColor('#0099ff')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};

export default command;