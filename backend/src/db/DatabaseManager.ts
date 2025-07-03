// backend/src/db/DatabaseManager.ts
import { PrismaClient } from "@prisma/client";

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

  // Guild methods
  static async getGuild(guildId: string) {
    return await this.db.guild.findUnique({
      where: { id: guildId },
      include: {
        commands: true,
        customCommands: true,
        channelConfigs: true,
      },
    });
  }

  static async createGuild(guild: {
    id: string;
    name: string;
    prefix?: string;
    enabled?: boolean;
    timeoutLogChannelId?: string | null;
  }) {
    // return await this.db.guild.create({
    await this.db.guild.create({
      data: {
        id: guild.id,
        name: guild.name,
        prefix: guild.prefix ?? "!",
        enabled: guild.enabled ?? true,
        timeoutLogChannelId: guild.timeoutLogChannelId ?? "bans",
      },
    });
    return this.getGuild(guild.id);
  }

  static async createDefaultGuild(guild: {
    id: string;
    name: string;
    icon?: string;
  }) {
    // return await this.db.guild.create({
    await this.db.guild.create({
      data: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon ?? "!",
      },
    });
    return this.getGuild(guild.id);
  }

  static async updateGuild(guildId: string, data: any) {
    return await this.db.guild.update({
      where: { id: guildId },
      data,
    });
  }

  static async getTimeoutLogChannelId(guildId: string): Promise<string | null> {
    const guild = await this.db.guild.findUnique({ where: { id: guildId } });
    return guild?.timeoutLogChannelId || null;
  }

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

  // Command logging
  static async logCommand(name: string, guildId: string, userId: string) {
    return await this.db.command.create({
      data: { name, guildId, userId },
    });
  }

  // Command methods
  static async getGuildCommands(guildId: string) {
    return await this.db.command.findMany({
      where: { guildId },
      orderBy: { name: 'asc' },
    });
  }

  static async createCommand(commandData: any) {
    return await this.db.command.create({
      data: commandData,
    });
  }

  static async updateCommand(id: number, commandData: any) {
    return await this.db.command.update({
      where: { id },
      data: commandData,
    });
  }

  static async deleteCommand(id: number) {
    return await this.db.command.delete({
      where: { id },
    });
  }

  // Custom command methods
  static async getCustomCommands(guildId: string) {
    return await this.db.customCommand.findMany({
      where: { guildId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createCustomCommand(commandData: any) {
    return await this.db.customCommand.create({
      data: commandData,
    });
  }

  static async updateCustomCommand(id: string, commandData: any) {
    return await this.db.customCommand.update({
      where: { id },
      data: commandData,
    });
  }

  static async deleteCustomCommand(id: string) {
    return await this.db.customCommand.delete({
      where: { id },
    });
  }

  // Channel config methods
  static async getChannelConfigs(guildId: string) {
    return await this.db.channelConfig.findMany({
      where: { guildId },
    });
  }

  static async createChannelConfig(configData: any) {
    return await this.db.channelConfig.create({
      data: configData,
    });
  }

  static async updateChannelConfig(id: string, configData: any) {
    return await this.db.channelConfig.update({
      where: { id },
      data: configData,
    });
  }

  static async deleteChannelConfig(id: string) {
    return await this.db.channelConfig.delete({
      where: { id },
    });
  }

  // Analytics methods
  static async getGuildAnalytics(guildId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.db.guildAnalytics.findMany({
      where: {
        guildId,
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });
  }

  static async createAnalyticsEntry(analyticsData: any) {
    return await this.db.guildAnalytics.create({
      data: analyticsData,
    });
  }

  static async updateAnalyticsEntry(guildId: string, date: Date, data: any) {
    return await this.db.guildAnalytics.upsert({
      where: {
        guildId_date: {
          guildId,
          date,
        },
      },
      update: data,
      create: {
        guildId,
        date,
        ...data,
      },
    });
  }

  // Command usage tracking
  static async logCommandUsage(commandName: string, guildId: string, userId: string, success: boolean = true, error?: string) {
    return await this.db.commandUsage.create({
      data: {
        commandName,
        guildId,
        userId,
        success,
        error,
      },
    });
  }

  static async getCommandUsageStats(guildId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.db.commandUsage.groupBy({
      by: ['commandName'],
      where: {
        guildId,
        timestamp: { gte: startDate },
      },
      _count: {
        commandName: true,
      },
      orderBy: {
        _count: {
          commandName: 'desc',
        },
      },
    });
  }

  // Bot status methods
  static async updateBotStatus(status: string, activity?: string, activityType?: string) {
    return await this.db.botStatus.create({
      data: {
        status,
        activity,
        activityType,
      },
    });
  }

  static async getLatestBotStatus() {
    return await this.db.botStatus.findFirst({
      orderBy: { timestamp: 'desc' },
    });
  }

  // Utility methods
  static async getAllGuilds() {
    return await this.db.guild.findMany({
      include: {
        _count: {
          select: {
            commands: true,
            customCommands: true,
          },
        },
      },
    });
  }

  static async getGuildCount() {
    return await this.db.guild.count();
  }

  static async getUserCount() {
    return await this.db.user.count();
  }

  static async cleanup() {
    await this.db.$disconnect();
  }
}
