import { Events, GuildMember, TextChannel } from "discord.js";
import { BotEvent } from "../../types/bot";
import { DatabaseManager } from "../../db/DatabaseManager";
import { ConfigManager } from "../utils/ConfigManager";

const event: BotEvent = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember, client: any) {
    // Check if the member was just timed out
    const oldTimeout = oldMember.communicationDisabledUntil;
    const newTimeout = newMember.communicationDisabledUntil;
    // console.log("old member", oldMember);
    // console.log("new member", newMember);
    console.log("Updated member!");
    
    if (
      (!oldTimeout || oldTimeout < new Date()) &&
      newTimeout &&
      newTimeout > new Date()
    ) {
      // Member was just timed out
      // Fetch log channel ID from the database
      const configManager = ConfigManager.getInstance();
      const config = await configManager.get(newMember.guild)
      const logChannelId = config?.timeoutLogChannelId
      // const logChannelId = await DatabaseManager.getTimeoutLogChannelId(
      //   newMember.guild.id
      // );
      if (logChannelId) {
        const channel = newMember.guild.channels.cache.get(
          logChannelId
        ) as TextChannel;
        console.log("channel", channel);
        
        if (channel && channel.isTextBased()) {

          function fillTemplate(template: string, vars: Record<string, string>) {
            return template.replace(/{(\w+)}/g, (_, key) => vars[key] ?? `{${key}}`);
          }
          // const template = "**{moderator}** timed out **{target}** for **{duration}**";
          const template = config?.timeoutLogMessageTemplate || ""
          
          const result = fillTemplate(template, {
            moderator: "admin",
            target: newMember.user.tag,
            duration: `<t:${Math.floor(newTimeout.getTime() / 1000)}:F>`
          });


          // await channel.send(
          //   `🚫 **${newMember.user.tag}** was timed out until <t:${Math.floor(
          //     newTimeout.getTime() / 1000
          //   )}:F> by a moderator.`
          // );
          await channel.send(result);
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
