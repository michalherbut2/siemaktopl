import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  GuildMember,
  TextChannel,
  EmbedBuilder,
  Colors
} from 'discord.js';
import { PrismaClient, PunishmentType } from '@prisma/client';

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName('super_break_28_days')
  .setDescription('Apply a 28-day timeout to a user')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The user to timeout')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for the timeout')
      .setRequired(false)
      .setMaxLength(512)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.member) {
    return await interaction.reply({ 
      content: 'This command can only be used in servers.', 
      ephemeral: true 
    });
  }

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const moderator = interaction.user;

  // Get target member
  const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  
  if (!targetMember) {
    return await interaction.reply({ 
      content: 'User not found in this server.', 
      ephemeral: true 
    });
  }

  // Permission checks
  const moderatorMember = interaction.member as GuildMember;
  
  if (!moderatorMember.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return await interaction.reply({ 
      content: 'You do not have permission to timeout members.', 
      ephemeral: true 
    });
  }

  // Check if bot can timeout the target
  if (!targetMember.moderatable) {
    return await interaction.reply({ 
      content: 'I cannot timeout this user. They may have higher permissions or be the server owner.', 
      ephemeral: true 
    });
  }

  // Check role hierarchy
  if (moderatorMember.roles.highest.position <= targetMember.roles.highest.position && 
      interaction.guild.ownerId !== moderator.id) {
    return await interaction.reply({ 
      content: 'You cannot timeout someone with equal or higher role permissions.', 
      ephemeral: true 
    });
  }

  // Self-timeout check
  if (targetUser.id === moderator.id) {
    return await interaction.reply({ 
      content: 'You cannot timeout yourself.', 
      ephemeral: true 
    });
  }

  // Bot self-check
  if (targetUser.id === interaction.client.user.id) {
    return await interaction.reply({ 
      content: 'I cannot timeout myself.', 
      ephemeral: true 
    });
  }

  try {
    // 28 days in milliseconds
    const duration = 28 * 24 * 60 * 60 * 1000;
    const durationSeconds = Math.floor(duration / 1000);
    const expiresAt = new Date(Date.now() + duration);

    // Apply timeout
    await targetMember.timeout(duration, reason);

    // Log to database
    const punishmentLog = await prisma.punishmentLog.create({
      data: {
        guildId: interaction.guild.id,
        type: PunishmentType.TIMEOUT,
        targetUserId: targetUser.id,
        moderatorUserId: moderator.id,
        reason,
        durationSeconds,
        expiresAt,
      },
    });

    // Send success response
    const embed = new EmbedBuilder()
      .setTitle('🔇 User Timed Out')
      .setDescription(`**${targetUser.tag}** has been timed out for 28 days`)
      .addFields(
        { name: 'Moderator', value: `<@${moderator.id}>`, inline: true },
        { name: 'Target', value: `<@${targetUser.id}>`, inline: true },
        { name: 'Duration', value: '28 days', inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>`, inline: false }
      )
      .setColor(Colors.Orange)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Send log message if configured
    await sendLogMessage(interaction, {
      type: 'timeout',
      moderator: moderator.tag,
      moderatorId: moderator.id,
      target: targetUser.tag,
      targetId: targetUser.id,
      duration: '28 days',
      reason,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Error executing super_break_28_days command:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    await interaction.reply({ 
      content: `Failed to timeout user: ${errorMessage}`, 
      ephemeral: true 
    });
  }
}

// Helper function to send log messages
async function sendLogMessage(interaction: ChatInputCommandInteraction, logData: {
  type: string;
  moderator: string;
  moderatorId: string;
  target: string;
  targetId: string;
  duration: string;
  reason: string;
  timestamp: Date;
}) {
  try {
    const guildConfig = {timeoutLogEnabled:1,timeoutLogChannelId:"2",timeoutLogMessageTemplate:"3"}
    // const guildConfig = await prisma.guildConfig.findUnique({
    //   where: { interaction.guild.id },
    //   include: { guild: true }
    // });

    if (!guildConfig?.timeoutLogEnabled || !guildConfig.timeoutLogChannelId) {
      return;
    }

    const channel = await interaction.client.channels.fetch(guildConfig.timeoutLogChannelId) as TextChannel;
    if (!channel) return;

    // Template replacement
    const template = guildConfig.timeoutLogMessageTemplate || 
      "**{moderator}** timed out **{target}** for **{duration}**\n**Reason:** {reason}";

    const message = template
      .replace(/\{moderator\}/g, logData.moderator)
      .replace(/\{moderatorId\}/g, logData.moderatorId)
      .replace(/\{target\}/g, logData.target)
      .replace(/\{targetId\}/g, logData.targetId)
      .replace(/\{duration\}/g, logData.duration)
      .replace(/\{reason\}/g, logData.reason)
      .replace(/\{timestamp\}/g, `<t:${Math.floor(logData.timestamp.getTime() / 1000)}:F>`);

    const embed = new EmbedBuilder()
      .setDescription(message)
      .setColor(Colors.Orange)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending log message:', error);
  }
}

// Export for command registration
// export { data, execute };