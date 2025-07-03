// backend/src/bot/events/ready.ts
import { Client, Events, ActivityType } from "discord.js";
import { BotEvent } from "../../types/bot";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log(`✅ Bot ready! Logged in as ${client.user?.tag}`);

    // Set bot activity
    client.user?.setActivity("discord.js v14", { type: ActivityType.Playing });

    // In development, register slash commands to test guild only
    if (process.env.NODE_ENV === "development") {
      const testGuildId = process.env.TEST_GUILD_ID;
      if (testGuildId) {
        const guild = client.guilds.cache.get(testGuildId);
        if (guild) {
          await registerSlashCommands(guild.commands);
        }
      }
    }
    // For production/global registration, use scripts/deploy-commands.ts
  },
};

async function registerSlashCommands(commands: any) {
  // This would register your slash commands for the test guild in development only
  // For global registration, use scripts/deploy-commands.ts
}

export default event;
