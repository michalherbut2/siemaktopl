// backend/src/bot/BotManager.ts
import { Client, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { SlashCommand, BotEvent } from '../types/bot';

export class BotManager {
  public slashCommands = new Collection<string, SlashCommand>();
  public components = new Collection<string, any>();

  constructor(private client: Client) {}

  async initialize() {
    await this.loadSlashCommands();
    await this.loadEvents();
    await this.loadComponents();
  }

  private async loadSlashCommands() {
    const commandsPath = join(__dirname, 'commands', 'slash');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = require(filePath).default as SlashCommand;
      
      if (command?.data?.name) {
        this.slashCommands.set(command.data.name, command);
        console.log(`📥 Loaded slash command: ${command.data.name}`);
      }
    }
  }

  private async loadEvents() {
    const eventsPath = join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      const event = require(filePath).default as BotEvent;
      
      if (event?.name) {
        if (event.once) {
          this.client.once(event.name, (...args) => event.execute(...args, this.client));
        } else {
          this.client.on(event.name, (...args) => event.execute(...args, this));
        }
        console.log(`📥 Loaded event: ${event.name}`);
      }
    }
  }

  private async loadComponents() {
    const componentsPath = join(__dirname, 'components');
    const componentFiles = readdirSync(componentsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of componentFiles) {
      const filePath = join(componentsPath, file);
      const component = require(filePath).default;
      
      if (component?.customId) {
        this.components.set(component.customId, component);
        console.log(`📥 Loaded component: ${component.customId}`);
      }
    }
  }

  getSlashCommand(name: string): SlashCommand | undefined {
    return this.slashCommands.get(name);
  }

  getComponent(customId: string) {
    return this.components.get(customId);
  }
}