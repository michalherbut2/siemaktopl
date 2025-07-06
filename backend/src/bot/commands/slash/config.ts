// src/bot/commands/config.ts
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../../types/bot';
import { DatabaseManager } from '../../../db/DatabaseManager';

const configFields = {
  timeoutLogEnabled: 'Enable timeout logging',
  banLogEnabled: 'Enable ban logging',
  warnLogEnabled: 'Enable warning logging',
  welcomeEnabled: 'Enable welcome message',
};

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View or edit this server\'s configuration')
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
      sub
        .setName('view')
        .setDescription('Show current guild configuration')
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
      sub
        .setName('update')
        .setDescription('Update a specific config field')
        .addStringOption(opt =>
          opt
            .setName('field')
            .setDescription('Which setting to update')
            .setRequired(true)
            .addChoices(
              ...Object.keys(configFields).map((key) => ({
                name: configFields[key as keyof typeof configFields],
                value: key,
              }))
            )
        )
        .addStringOption(opt =>
          opt
            .setName('value')
            .setDescription('New value (true / false)')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
      return;
    }

    const db = DatabaseManager.db;
    const config = await DatabaseManager.getGuildConfig(guild);

    if (!config) {
      await interaction.reply({ content: '⚠️ Could not load config for this server.', ephemeral: true });
      return;
    }

    if (subcommand === 'view') {
      const embed = new EmbedBuilder()
        .setTitle(`🔧 Configuration for ${guild.name}`)
        .setColor('#00b0f4')
        .setTimestamp()
        .addFields(
          {
            name: 'Timeout Logging',
            value: config.timeoutLogEnabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          },
          {
            name: 'Ban Logging',
            value: config.banLogEnabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          },
          {
            name: 'Warning Logging',
            value: config.warnLogEnabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          },
          {
            name: 'Welcome Message',
            value: config.welcomeEnabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          },
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'update') {
      const field = interaction.options.getString('field', true) as keyof typeof config;
      const rawValue = interaction.options.getString('value', true);
      const normalized = rawValue.toLowerCase();

      const newValue = normalized === 'true'
        ? true
        : normalized === 'false'
        ? false
        : null;

      if (newValue === null) {
        await interaction.reply({
          content: '❌ Value must be either `true` or `false`.',
          ephemeral: true,
        });
        return;
      }

      const updatedConfig = await DatabaseManager.upsertGuildConfig(guild, {
        [field]: newValue,
      });

      await interaction.reply({
        content: `✅ Updated **${field}** to \`${newValue}\`.`,
        ephemeral: true,
      });
    }
  },
};

export default command;
