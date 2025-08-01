import { Events, Interaction, MessageFlags } from "discord.js";
import { BotEvent } from "../../types/bot";
import { BotManager } from "../BotManager"; // <--- ADD THIS IMPORT

const event: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction, botManager: BotManager): Promise<void> {
    // console.log("bot Manager\n", botManager);
    
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        const command = botManager.getSlashCommand(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
      }
      // Handle buttons, modals, menus, etc.
      else if (
        interaction.isButton() ||
        interaction.isModalSubmit() ||
        interaction.isAnySelectMenu()
      ) {
        const component = botManager.getComponent(interaction.customId);
        if (!component) return;
        await component.execute(interaction);
      }
    } catch (error) {
      console.error("Error handling interaction:", error);
      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "❌ There was an error executing this interaction.",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "❌ There was an error executing this interaction.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    }
  },
};

export default event;
