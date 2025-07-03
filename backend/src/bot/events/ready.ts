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
  },
};

export default event;
