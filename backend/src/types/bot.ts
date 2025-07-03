// backend/src/types/bot.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, Message, Client, ClientEvents } from 'discord.js';

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface PrefixCommand {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  execute: (message: Message, args: string[]) => Promise<void>;
}

export interface BotEvent {
  name: keyof ClientEvents;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}

export interface ComponentHandler {
  customId: string;
  execute: (interaction: any) => Promise<void>;
}