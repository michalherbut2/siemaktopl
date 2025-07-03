// backend/src/bot/components/exampleButton.ts
import { ButtonInteraction } from 'discord.js';
import { ComponentHandler } from '../../types/bot';

const component: ComponentHandler = {
  customId: 'example_button',
  async execute(interaction: ButtonInteraction) {
    await interaction.reply({
      content: '✅ Button clicked!',
      ephemeral: true
    });
  }
};

export default component;