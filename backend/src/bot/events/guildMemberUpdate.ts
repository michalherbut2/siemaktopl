import { Events, GuildMember, TextChannel } from "discord.js";
import { BotEvent } from "../../types/bot";
import { DatabaseManager } from "../../db/DatabaseManager";

const event: BotEvent = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember, client: any) {
    // Check if the member was just timed out
    const oldTimeout = oldMember.communicationDisabledUntil;
    const newTimeout = newMember.communicationDisabledUntil;
    
    if (
      (!oldTimeout || oldTimeout < new Date()) &&
      newTimeout &&
      newTimeout > new Date()
    ) {
      // Member was just timed out
      // Fetch log channel ID from the database
      const logChannelId = await DatabaseManager.getTimeoutLogChannelId(
        newMember.guild.id
      );
      if (logChannelId) {
        const channel = newMember.guild.channels.cache.get(
          logChannelId
        ) as TextChannel;
        console.log("channel", channel);
        
        if (channel && channel.isTextBased()) {
          await channel.send(
            `🚫 **${newMember.user.tag}** was timed out until <t:${Math.floor(
              newTimeout.getTime() / 1000
            )}:F> by a moderator.`
          );
        }
      }
      // Optionally DM the user
      try {
        await newMember.send(
          `You have been timed out in **${
            newMember.guild.name
          }** until <t:${Math.floor(
            newTimeout.getTime() / 1000
          )}:F>. Please contact a moderator if you have questions.`
        );
      } catch (e) {
        // Ignore if DMs are closed
      }
    }
  },
};

export default event;
