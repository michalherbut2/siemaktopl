import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";

dotenv.config({ path: "../.env" });

const commands: any[] = [];
const commandsPath = join(__dirname, "../src/bot/commands/slash");
const commandFiles = readdirSync(commandsPath).filter(
  file => file.endsWith(".ts") || file.endsWith(".js")
);

for (const file of commandFiles) {
  const command = require(join(commandsPath, file)).default;
  if (command?.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    const clientId = process.env.VITE_DISCORD_CLIENT_ID!;
    const testGuildId = process.env.TEST_GUILD_ID;
    if (testGuildId && process.env.NODE_ENV === "development") {
      console.log("Registering slash commands to test guild...");
      await rest.put(Routes.applicationGuildCommands(clientId, testGuildId), {
        body: commands,
      });
      console.log("✅ Successfully registered guild slash commands.");
    } else {
      console.log("Registering slash commands globally...");
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("✅ Successfully registered global slash commands.");
    }
  } catch (error) {
    console.error("❌ Error registering slash commands:", error);
  }
})();
