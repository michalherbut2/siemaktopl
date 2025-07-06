// backend/src/db/DatabaseManager.ts
import {
  PrismaClient,
  PunishmentType,
  Guild,
  GuildConfig,
  PunishmentLog,
  User,
} from "@prisma/client";
// import { PrismaClient, PunishmentType, Guild, PunishmentLog, User } from "@prisma/client";
import { GuildConfig as GC } from "../types";
import { Guild as GuildDC } from "discord.js";
type GuildConfigInput = Partial<
  Omit<GuildConfig, "id" | "guildId" | "createdAt" | "updatedAt">
>;
type UserData = Partial<Omit<User, "createdAt" | "updatedAt">> & { id: string };

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
  static async upsertGuildConfig(
    guildDC: GuildDC,
    config: GC
  ): Promise<GuildConfig> {
    await this.ensureGuild(guildDC);
    const guildId = guildDC.id;
    console.log("config", config);

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
  // static async removePunishment(
  //   punishmentId: string,
  //   removedByUserId: string,
  //   removalReason?: string
  // ): Promise<PunishmentLog> {
  //   return await this.db.punishmentLog.update({
  //     where: { id: punishmentId },
  //     data: {
  //       removedAt: new Date(),
  //       removedByUserId,
  //       removalReason,
  //     },
  //   });
  // }

  // /**
  //  * Get active punishments for a guild
  //  */
  // static async getActivePunishments(
  //   guildId: string,
  //   type?: PunishmentType
  // ): Promise<PunishmentLog[]> {
  //   return await this.db.punishmentLog.findMany({
  //     where: {
  //       guildId,
  //       ...(type && { type }),
  //       removedAt: null,
  //       OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  //     },
  //     orderBy: { createdAt: "desc" },
  //   });
  // }

  // /**
  //  * Get punishment history for a user
  //  */
  // static async getUserPunishments(
  //   guildId: string,
  //   userId: string,
  //   options: {
  //     limit?: number;
  //     offset?: number;
  //     type?: PunishmentType;
  //     includeRemoved?: boolean;
  //   } = {}
  // ): Promise<PunishmentLog[]> {
  //   const { limit = 50, offset = 0, type, includeRemoved = true } = options;

  //   return await this.db.punishmentLog.findMany({
  //     where: {
  //       guildId,
  //       targetId: userId,
  //       ...(type && { type }),
  //       ...(!includeRemoved && { removedAt: null }),
  //     },
  //     orderBy: { createdAt: "desc" },
  //     take: limit,
  //     skip: offset,
  //   });
  // }

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


 // ==================== PUNISHMENT METHODS ====================

  /**
   * Log a punishment action
   */
  static async logPunishment(data: {
    guild: GuildDC;
    type: PunishmentType;
    targetId: string;
    executorId: string;
    reason?: string;
    expiresAt?: Date;
  }): Promise<PunishmentLog> {
    // Ensure guild exists (create minimal guild if needed)
    await this.db.guild.upsert({
      where: { id: data.guild.id },
      update: {},
      create: {
        id: data.guild.id,
        name: data.guild.name,
        icon: data.guild.icon,
      },
    });
    
    return await this.db.punishmentLog.create({
      data: {
        guildId: data.guild.id,
        type: data.type,
        targetId: data.targetId,
        executorId: data.executorId,
        reason: data.reason,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Log a timeout punishment
   */
  static async logTimeout(data: {
    guild: GuildDC;
    targetId: string;
    executorId: string;
    expiresAt: Date;
    reason?: string;
  }): Promise<PunishmentLog> {
    
    return await this.logPunishment({
      ...data,
      type: PunishmentType.TIMEOUT,
    });
  }

  /**
   * Log a ban punishment
   */
  static async logBan(data: {
    guild: GuildDC;
    targetId: string;
    executorId: string;
    reason?: string;
    expiresAt: Date;
  }): Promise<PunishmentLog> {

    return await this.logPunishment({
      ...data,
      type: PunishmentType.BAN,
    });
  }

  /**
   * Log a warning punishment
   */
  static async logWarning(data: {
    guild: GuildDC;
    targetId: string;
    executorId: string;
    reason?: string;
  }): Promise<PunishmentLog> {
    return await this.logPunishment({
      ...data,
      type: PunishmentType.WARN,
    });
  }

  /**
   * Log a kick punishment
   */
  static async logKick(data: {
    guild: GuildDC;
    targetId: string;
    executorId: string;
    reason?: string;
    metadata?: any;
  }): Promise<PunishmentLog> {
    return await this.logPunishment({
      ...data,
      type: PunishmentType.KICK,
    });
  }

  /**
   * Log a mute punishment
   */
  static async logMute(data: {
    guild: GuildDC;
    targetId: string;
    executorId: string;
    durationSeconds?: number;
    reason?: string;
    metadata?: any;
  }): Promise<PunishmentLog> {
    const expiresAt = data.durationSeconds 
      ? new Date(Date.now() + data.durationSeconds * 1000)
      : undefined;

    return await this.logPunishment({
      ...data,
      type: PunishmentType.MUTE,
      expiresAt,
    });
  }

  static async removeActiveTimeout(targetId: string, guildId: string, removedByUserId: string): Promise<PunishmentLog | null> {
    const now = new Date();

    // Find the active timeout for the user
    const activeTimeout = await this.db.punishmentLog.findFirst({
      where: {
        type: 'TIMEOUT',
        targetId,
        guild: { id: guildId },
        removedAt: null, // still active
        expiresAt: {
          gt: now,
        },
      },
      orderBy: { createdAt: 'desc' }, // in case there are multiple
    });
  
    if (!activeTimeout) return null;
  
    // Mark it as removed
    return await this.db.punishmentLog.update({
      where: { id: activeTimeout.id },
      data: {
        removedAt: new Date(),
        removedByUserId,
      },
    });
  }
  

  /**
   * Remove/revoke a punishment
   */
  static async removePunishment(punishmentId: string, removedByUserId: string): Promise<PunishmentLog> {
    return await this.db.punishmentLog.update({
      where: { id: punishmentId },
      data: {
        removedAt: new Date(),
        removedByUserId
      },
    });
  }

  /**
   * Remove punishment by criteria (useful for automated removal)
   */
  static async removePunishmentByCriteria(data: {
    guildId: string;
    targetId: string;
    type: PunishmentType;
    removedByUserId: string;
  }): Promise<PunishmentLog[]> {
    const activePunishments = await this.db.punishmentLog.findMany({
      where: {
        guildId: data.guildId,
        targetId: data.targetId,
        type: data.type,
        removedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    const updated = [];
    for (const punishment of activePunishments) {
      const updatedPunishment = await this.db.punishmentLog.update({
        where: { id: punishment.id },
        data: {
          removedAt: new Date(),
          removedByUserId: data.removedByUserId,
        },
      });
      updated.push(updatedPunishment);
    }

    return updated;
  }

  /**
   * Get a specific punishment log
   */
  static async getPunishmentLog(punishmentId: string): Promise<PunishmentLog | null> {
    return await this.db.punishmentLog.findUnique({
      where: { id: punishmentId },
      include: {
        guild: {
          select: {
            name: true,
            icon: true,
          },
        },
      },
    });
  }

  /**
   * Check if user has active punishment of specific type
   */
  static async hasActivePunishment(guildId: string, targetId: string, type: PunishmentType): Promise<boolean> {
    const count = await this.db.punishmentLog.count({
      where: {
        guildId,
        targetId,
        type,
        removedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return count > 0;
  }

  /**
   * Get user's active punishments
   */
  static async getUserActivePunishments(guildId: string, targetId: string): Promise<PunishmentLog[]> {
    return await this.db.punishmentLog.findMany({
      where: {
        guildId,
        targetId,
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
   * Get expired punishments that need to be processed
   */
  static async getExpiredPunishments(guildId?: string): Promise<PunishmentLog[]> {
    return await this.db.punishmentLog.findMany({
      where: {
        ...(guildId && { guildId }),
        removedAt: null,
        expiresAt: {
          not: null,
          lte: new Date(),
        },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  /**
   * Mark expired punishments as automatically removed
   */
  static async processExpiredPunishments(guildId?: string): Promise<PunishmentLog[]> {
    const expiredPunishments = await this.getExpiredPunishments(guildId);
    
    const processed = [];
    for (const punishment of expiredPunishments) {
      const updated = await this.db.punishmentLog.update({
        where: { id: punishment.id },
        data: {
          removedAt: new Date(),
          removedByUserId: 'SYSTEM',
        },
      });
      processed.push(updated);
    }

    return processed;
  }

  /**
   * Get warning count for a user
   */
  static async getUserWarningCount(guildId: string, targetId: string, timeframe?: { start: Date; end: Date }): Promise<number> {
    return await this.db.punishmentLog.count({
      where: {
        guildId,
        targetId,
        type: PunishmentType.WARN,
        removedAt: null,
        ...(timeframe && {
          createdAt: {
            gte: timeframe.start,
            lte: timeframe.end,
          },
        }),
      },
    });
  }

  /**
   * Get recent punishment logs for a guild
   */
  static async getRecentPunishments(guildId: string, options: {
    limit?: number;
    type?: PunishmentType;
    executorId?: string;
    targetId?: string;
  } = {}): Promise<PunishmentLog[]> {
    const { limit = 50, type, executorId, targetId } = options;

    return await this.db.punishmentLog.findMany({
      where: {
        guildId,
        ...(type && { type }),
        ...(executorId && { executorId }),
        ...(targetId && { targetId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        guild: {
          select: {
            name: true,
            icon: true,
          },
        },
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
        targetId: userId,
        ...(type && { type }),
        ...(!includeRemoved && { removedAt: null }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }


}


