// backend/src/db/DatabaseManager.ts
import { PrismaClient, PunishmentType, Guild, GuildConfig, PunishmentLog, User } from "@prisma/client";
// import { PrismaClient, PunishmentType, Guild, PunishmentLog, User } from "@prisma/client";
import { GuildConfig as GC } from "../types";
import { Guild as GuildDC } from "discord.js";
type GuildConfigInput = Partial<Omit<GuildConfig, 'id' | 'guildId' | 'createdAt' | 'updatedAt'>>;
type UserData = Partial<Omit<User, 'createdAt' | 'updatedAt'>> & { id: string };

export class DatabaseManager {
  private static instance: PrismaClient;

  static async initialize(): Promise<PrismaClient> {
    if (!this.instance) {
      this.instance = new PrismaClient();
      await this.instance.$connect();
    }
    return this.instance;
  }

  static get db(): PrismaClient {
    if (!this.instance) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
    }
  }

  /**
   * Ensure a guild exists in the database
   */
  static async ensureGuild(guild: GuildDC): Promise<Guild> {
    return await this.db.guild.upsert({
      where: { id: guild.id },
      update: {
        name: guild.name,
        icon: guild.icon,
      },
      create: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
      },
    });
  }

  /**
   * Get guild configuration with defaults
   */
  static async getGuildConfig(guild: GuildDC): Promise<GuildConfig | null> {
    await this.ensureGuild(guild);
    
    let config = await this.db.guildConfig.findUnique({
      where: { guildId: guild.id },
      include: { guild: true },
    });
  
    if (!config) {
      config = await this.db.guildConfig.create({
        data: {
          guildId: guild.id,
          // Optionally: override any default values here
        },
        include: { guild: true },
      });
    }
  
    return config;
  }

  /**
   * Create or update guild configuration
   */
  static async upsertGuildConfig(guildDC: GuildDC, config: GC): Promise<GuildConfig> {
    await this.ensureGuild(guildDC);
    const guildId = guildDC.id;
    console.log("config",config);

    // Usuń pola, których Prisma nie przyjmuje w update/create
  const {
    id,
    createdAt,
    updatedAt,
    guild,
    guildId: _ignoredGuildId,
    ...sanitizedConfig
  } = config;

    return await this.db.guildConfig.upsert({
      where: { guildId },
      update: sanitizedConfig,
      create: {
        guildId,
        ...sanitizedConfig,
      },
      include: { guild: true },
    });
  }

  /**
   * Log a punishment action
   */
  // static async logPunishment(data: {
  //   guildId: string;
  //   type: PunishmentType;
  //   targetUserId: string;
  //   moderatorUserId: string;
  //   reason?: string;
  //   durationSeconds?: number;
  //   expiresAt?: Date;
  //   metadata?: any;
  // }): Promise<PunishmentLog> {
  //   await this.ensureGuild(data.guildId, { name: 'Unknown Guild' });
  //   return this.db.punishmentLog.create({ data });

  //   // return await this.db.punishmentLog.create({
  //   //   data: {
  //   //     guildId: data.guildId,
  //   //     type: data.type,
  //   //     targetUserId: data.targetUserId,
  //   //     moderatorUserId: data.moderatorUserId,
  //   //     reason: data.reason,
  //   //     durationSeconds: data.durationSeconds,
  //   //     expiresAt: data.expiresAt,
  //   //     metadata: data.metadata,
  //   //   },
  //   // });
  // }

  /**
   * Remove/revoke a punishment
   */
  static async removePunishment(punishmentId: string, removedByUserId: string, removalReason?: string): Promise<PunishmentLog> {
    return await this.db.punishmentLog.update({
      where: { id: punishmentId },
      data: {
        removedAt: new Date(),
        removedByUserId,
        removalReason,
      },
    });
  }

  /**
   * Get active punishments for a guild
   */
  static async getActivePunishments(guildId: string, type?: PunishmentType): Promise<PunishmentLog[]> {
    return await this.db.punishmentLog.findMany({
      where: {
        guildId,
        ...(type && { type }),
        removedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get punishment history for a user
   */
  static async getUserPunishments(guildId: string, userId: string, options: {
    limit?: number;
    offset?: number;
    type?: PunishmentType;
    includeRemoved?: boolean;
  } = {}): Promise<PunishmentLog[]> {
    const { limit = 50, offset = 0, type, includeRemoved = true } = options;

    return await this.db.punishmentLog.findMany({
      where: {
        guildId,
        targetUserId: userId,
        ...(type && { type }),
        ...(!includeRemoved && { removedAt: null }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  // // Guild methods
  // static async getGuild(guildId: string) {
  //   return await this.db.guild.findUnique({
  //     where: { id: guildId },
  //     include: {
  //       commands: true,
  //       customCommands: true,
  //       channelConfigs: true,
  //     },
  //   });
  // }

  // static async createGuild(guild: {
  //   id: string;
  //   name: string;
  //   prefix?: string;
  //   enabled?: boolean;
  //   timeoutLogChannelId?: string | null;
  // }) {
  //   // return await this.db.guild.create({
  //   await this.db.guild.create({
  //     data: {
  //       id: guild.id,
  //       name: guild.name,
  //       prefix: guild.prefix ?? "!",
  //       enabled: guild.enabled ?? true,
  //       timeoutLogChannelId: guild.timeoutLogChannelId ?? "bans",
  //     },
  //   });
  //   return this.getGuild(guild.id);
  // }

  // static async createDefaultGuild(guild: {
  //   id: string;
  //   name: string;
  //   icon?: string;
  // }) {
  //   // return await this.db.guild.create({
  //   await this.db.guild.create({
  //     data: {
  //       id: guild.id,
  //       name: guild.name,
  //       icon: guild.icon ?? "!",
  //     },
  //   });
  //   return this.getGuild(guild.id);
  // }

  // static async updateGuild(guildId: string, data: any) {
  //   return await this.db.guild.update({
  //     where: { id: guildId },
  //     data,
  //   });
  // }

  // User methods
  static async getUser(userId: string) {
    return await this.db.user.findUnique({
      where: { id: userId },
    });
  }

  static async createOrUpdateUser(userData: any) {
    return await this.db.user.upsert({
      where: { id: userData.id },
      update: userData,
      create: userData,
    });
  }

  static async createUser(userData: any) {
    return await this.db.user.create({
      data: userData,
    });
  }

  static async updateUser(id: string, userData: any) {
    return await this.db.user.update({
      where: { id },
      data: userData,
    });
  }

}
