// backend/src/bot/components/exampleButton.ts
import { ButtonInteraction, MessageFlags } from 'discord.js';
import { ComponentHandler } from '../../types/bot';

const component: ComponentHandler = {
  customId: 'example_button',
  async execute(interaction: ButtonInteraction) {
    await interaction.reply({
      content: '✅ Button clicked!',
      flags: MessageFlags.Ephemeral
    });
  }
};

export default component;