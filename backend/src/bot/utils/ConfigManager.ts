import { GuildConfig } from "@prisma/client";
import { DatabaseManager } from "../../db/DatabaseManager";
import { Guild } from "discord.js";

export class ConfigManager {
  private static instance: ConfigManager;
  private cache = new Map<string, GuildConfig>();

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!this.instance) {
      this.instance = new ConfigManager();
    }
    return this.instance;
  }

  public async get(guild: Guild, forceRefresh = false): Promise<GuildConfig | null> {
    if (!forceRefresh && this.cache.has(guild.id)) {
      return this.cache.get(guild.id
      )!;
    }

    const config = await DatabaseManager.getGuildConfig(guild);
    if (config) {
      this.cache.set(guild.id, config);
    }

    return config;
  }

  public set(guildId: string, config: GuildConfig) {
    this.cache.set(guildId, config);
  }

  public clear(guildId?: string) {
    if (guildId) {
      this.cache.delete(guildId);
    } else {
      this.cache.clear();
    }
  }

  async getTimeoutTemplate(guild: Guild, action: "add" | "remove"): Promise<string> {
    const config = await this.get(guild); // or however you store it
    // return config?.timeoutTemplates?.[action] || ""; // fallback to empty or default template
    return config?.timeoutLogAddTemplate || ""; // fallback to empty or default template
  }
}
