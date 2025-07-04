import { PrismaClient, PunishmentType } from '@prisma/client';

const prisma = new PrismaClient();

export interface PunishmentStats {
  topModerators: ModeratorStats[];
  topTargets: TargetStats[];
  averageDuration: number;
  mostRemovedPunishments: RemovalStats[];
  longestPunishments: PunishmentDuration[];
  shortestPunishments: PunishmentDuration[];
  totalPunishments: number;
  activePunishments: number;
  punishmentsByType: TypeStats[];
  punishmentsByMonth: MonthlyStats[];
}

export interface ModeratorStats {
  moderatorUserId: string;
  count: number;
  types: { [key in PunishmentType]: number };
}

export interface TargetStats {
  targetUserId: string;
  count: number;
  types: { [key in PunishmentType]: number };
}

export interface RemovalStats {
  targetUserId: string;
  removalCount: number;
  totalPunishments: number;
  removalRate: number;
}

export interface PunishmentDuration {
  id: string;
  targetUserId: string;
  moderatorUserId: string;
  durationSeconds: number;
  type: PunishmentType;
  createdAt: Date;
  reason?: string;
}

export interface TypeStats {
  type: PunishmentType;
  count: number;
  averageDuration?: number;
}

export interface MonthlyStats {
  month: string;
  year: number;
  count: number;
  types: { [key in PunishmentType]: number };
}

export class StatisticsService {
  /**
   * Get comprehensive punishment statistics for a guild
   */
  async getPunishmentStats(guildId: string, options: {
    limit?: number;
    timeframe?: { start: Date; end: Date };
    type?: PunishmentType;
  } = {}): Promise<PunishmentStats> {
    const { limit = 10, timeframe, type } = options;
    
    const baseWhere = {
      guildId,
      ...(timeframe && {
        createdAt: {
          gte: timeframe.start,
          lte: timeframe.end,
        },
      }),
      ...(type && { type }),
    };

    const [
      topModerators,
      topTargets,
      averageDuration,
      mostRemovedPunishments,
      longestPunishments,
      shortestPunishments,
      totalPunishments,
      activePunishments,
      punishmentsByType,
      punishmentsByMonth,
    ] = await Promise.all([
      this.getTopModerators(baseWhere, limit),
      this.getTopTargets(baseWhere, limit),
      this.getAverageDuration(baseWhere),
      this.getMostRemovedPunishments(baseWhere, limit),
      this.getLongestPunishments(baseWhere, limit),
      this.getShortestPunishments(baseWhere, limit),
      this.getTotalPunishments(baseWhere),
      this.getActivePunishments(baseWhere),
      this.getPunishmentsByType(baseWhere),
      this.getPunishmentsByMonth(baseWhere),
    ]);

    return {
      topModerators,
      topTargets,
      averageDuration,
      mostRemovedPunishments,
      longestPunishments,
      shortestPunishments,
      totalPunishments,
      activePunishments,
      punishmentsByType,
      punishmentsByMonth,
    };
  }

  /**
   * Get top moderators by punishment count
   */
  private async getTopModerators(where: any, limit: number): Promise<ModeratorStats[]> {
    const results = await prisma.punishmentLog.groupBy({
      by: ['moderatorUserId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const moderatorStats = await Promise.all(
      results.map(async (result) => {
        const typeBreakdown = await prisma.punishmentLog.groupBy({
          by: ['type'],
          where: {
            ...where,
            moderatorUserId: result.moderatorUserId,
          },
          _count: { id: true },
        });

        const types = Object.values(PunishmentType).reduce((acc, type) => {
          acc[type] = typeBreakdown.find(t => t.type === type)?._count.id || 0;
          return acc;
        }, {} as { [key in PunishmentType]: number });

        return {
          moderatorUserId: result.moderatorUserId,
          count: result._count.id,
          types,
        };
      })
    );

    return moderatorStats;
  }

  /**
   * Get top targets by punishment count
   */
  private async getTopTargets(where: any, limit: number): Promise<TargetStats[]> {
    const results = await prisma.punishmentLog.groupBy({
      by: ['targetUserId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const targetStats = await Promise.all(
      results.map(async (result) => {
        const typeBreakdown = await prisma.punishmentLog.groupBy({
          by: ['type'],
          where: {
            ...where,
            targetUserId: result.targetUserId,
          },
          _count: { id: true },
        });

        const types = Object.values(PunishmentType).reduce((acc, type) => {
          acc[type] = typeBreakdown.find(t => t.type === type)?._count.id || 0;
          return acc;
        }, {} as { [key in PunishmentType]: number });

        return {
          targetUserId: result.targetUserId,
          count: result._count.id,
          types,
        };
      })
    );

    return targetStats;
  }

  /**
   * Get average punishment duration
   */
  private async getAverageDuration(where: any): Promise<number> {
    const result = await prisma.punishmentLog.aggregate({
      where: {
        ...where,
        durationSeconds: { not: null },
      },
      _avg: { durationSeconds: true },
    });

    return result._avg.durationSeconds || 0;
  }

  /**
   * Get users with most removed punishments
   */
  private async getMostRemovedPunishments(where: any, limit: number): Promise<RemovalStats[]> {
    const results = await prisma.punishmentLog.groupBy({
      by: ['targetUserId'],
      where,
      _count: { id: true },
      having: { id: { _count: { gt: 0 } } },
    });

    const removalStats = await Promise.all(
      results.map(async (result) => {
        const removedCount = await prisma.punishmentLog.count({
          where: {
            ...where,
            targetUserId: result.targetUserId,
            removedAt: { not: null },
          },
        });

        return {
          targetUserId: result.targetUserId,
          removalCount: removedCount,
          totalPunishments: result._count.id,
          removalRate: result._count.id > 0 ? (removedCount / result._count.id) * 100 : 0,
        };
      })
    );

    return removalStats
      .filter(stat => stat.removalCount > 0)
      .sort((a, b) => b.removalCount - a.removalCount)
      .slice(0, limit);
  }

  /**
   * Get longest punishments
   */
  private async getLongestPunishments(where: any, limit: number): Promise<PunishmentDuration[]> {
    return await prisma.punishmentLog.findMany({
      where: {
        ...where,
        durationSeconds: { not: null },
      },
      orderBy: { durationSeconds: 'desc' },
      take: limit,
      select: {
        id: true,
        targetUserId: true,
        moderatorUserId: true,
        durationSeconds: true,
        type: true,
        createdAt: true,
        reason: true,
      },
    }) as PunishmentDuration[];
  }

  /**
   * Get shortest punishments
   */
  private async getShortestPunishments(where: any, limit: number): Promise<PunishmentDuration[]> {
    return await prisma.punishmentLog.findMany({
      where: {
        ...where,
        durationSeconds: { not: null, gt: 0 },
      },
      orderBy: { durationSeconds: 'asc' },
      take: limit,
      select: {
        id: true,
        targetUserId: true,
        moderatorUserId: true,
        durationSeconds: true,
        type: true,
        createdAt: true,
        reason: true,
      },
    }) as PunishmentDuration[];
  }

  /**
   * Get total punishment count
   */
  private async getTotalPunishments(where: any): Promise<number> {
    return await prisma.punishmentLog.count({ where });
  }

  /**
   * Get active punishment count
   */
  private async getActivePunishments(where: any): Promise<number> {
    return await prisma.punishmentLog.count({
      where: {
        ...where,
        removedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  /**
   * Get punishments by type
   */
  private async getPunishmentsByType(where: any): Promise<TypeStats[]> {
    const results = await prisma.punishmentLog.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
      _avg: { durationSeconds: true },
    });

    return results.map(result => ({
      type: result.type,
      count: result._count.id,
      averageDuration: result._avg.durationSeconds || undefined,
    }));
  }

  /**
   * Get punishments by month
   */
  private async getPunishmentsByMonth(where: any): Promise<MonthlyStats[]> {
    const results = await prisma.$queryRaw<Array<{
      month: number;
      year: number;
      count: bigint;
      type: PunishmentType;
    }>>`
      SELECT 
        EXTRACT(MONTH FROM "createdAt") as month,
        EXTRACT(YEAR FROM "createdAt") as year,
        COUNT(*) as count,
        type
      FROM "punishment_logs"
      WHERE "guildId" = ${where.guildId}
      GROUP BY EXTRACT(MONTH FROM "createdAt"), EXTRACT(YEAR FROM "createdAt"), type
      ORDER BY year DESC, month DESC
    `;

    const monthlyMap = new Map<string, MonthlyStats>();

    results.forEach(result => {
      const key = `${result.year}-${result.month}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: new Date(result.year, result.month - 1).toLocaleString('default', { month: 'long' }),
          year: result.year,
          count: 0,
          types: Object.values(PunishmentType).reduce((acc, type) => {
            acc[type] = 0;
            return acc;
          }, {} as { [key in PunishmentType]: number }),
        });
      }

      const monthStats = monthlyMap.get(key)!;
      monthStats.count += Number(result.count);
      monthStats.types[result.type] += Number(result.count);
    });

    return Array.from(monthlyMap.values());
  }

  /**
   * Get user-specific punishment history
   */
  async getUserPunishmentHistory(guildId: string, userId: string, options: {
    limit?: number;
    offset?: number;
    type?: PunishmentType;
  } = {}) {
    const { limit = 50, offset = 0, type } = options;

    return await prisma.punishmentLog.findMany({
      where: {
        guildId,
        targetUserId: userId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
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
   * Get moderator activity
   */
  async getModeratorActivity(guildId: string, moderatorId: string, options: {
    limit?: number;
    offset?: number;
    type?: PunishmentType;
  } = {}) {
    const { limit = 50, offset = 0, type } = options;

    return await prisma.punishmentLog.findMany({
      where: {
        guildId,
        moderatorUserId: moderatorId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
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
}

export const statisticsService = new StatisticsService();