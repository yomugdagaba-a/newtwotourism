import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: number | null,
    action: AuditAction,
    entityType: string,
    entityId?: number,
    changes?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      return await this.prisma.auditLogEntry.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          changes: changes ? JSON.stringify(changes) : null,
          ipAddress,
          userAgent,
          status: 'SUCCESS',
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  async findAll(skip = 0, take = 10, userId?: number, action?: AuditAction) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      this.prisma.auditLogEntry.findMany({
        where,
        skip,
        take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLogEntry.count({ where }),
    ]);

    return { logs, total };
  }

  async findByUsername(username: string, skip = 0, take = 10) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLogEntry.findMany({
        where: {
          user: {
            username,
          },
        },
        skip,
        take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLogEntry.count({
        where: {
          user: {
            username,
          },
        },
      }),
    ]);

    return { logs, total };
  }

  async findByAction(action: AuditAction, skip = 0, take = 10) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLogEntry.findMany({
        where: { action },
        skip,
        take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLogEntry.count({ where: { action } }),
    ]);

    return { logs, total };
  }

  async findByEntityType(entityType: string, skip = 0, take = 10) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLogEntry.findMany({
        where: { entityType },
        skip,
        take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLogEntry.count({ where: { entityType } }),
    ]);

    return { logs, total };
  }

  async findByIpAddress(ipAddress: string, skip = 0, take = 10) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLogEntry.findMany({
        where: { ipAddress },
        skip,
        take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLogEntry.count({ where: { ipAddress } }),
    ]);

    return { logs, total };
  }

  async getStatistics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.prisma.auditLogEntry.findMany({
      where: { createdAt: { gte: since } },
    });

    const actionCounts = logs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const entityTypeCounts = logs.reduce(
      (acc, log) => {
        acc[log.entityType] = (acc[log.entityType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const userActivityMap = new Map<number, number>();
    logs.forEach((log) => {
      if (log.userId) {
        userActivityMap.set(log.userId, (userActivityMap.get(log.userId) || 0) + 1);
      }
    });

    const mostActiveUsers = Array.from(userActivityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, activityCount: count }));

    return {
      totalLogs: logs.length,
      actionCounts,
      entityTypeCounts,
      mostActiveUsers,
      period: `Last ${days} days`,
    };
  }

  async getSecurityLogs(days = 1) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Query without filtering by specific actions to avoid enum issues
    return this.prisma.auditLogEntry.findMany({
      where: {
        createdAt: { gte: since },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getHighSeverityLogs(days = 1) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const highSeverityActions: AuditAction[] = ['DELETE'];

    return this.prisma.auditLogEntry.findMany({
      where: {
        createdAt: { gte: since },
        action: { in: highSeverityActions },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSuspiciousActivity(days = 1, actionThreshold = 50) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.prisma.auditLogEntry.findMany({
      where: { createdAt: { gte: since } },
      include: { user: true },
    });

    const userActivityMap = new Map<number, number>();
    logs.forEach((log) => {
      if (log.userId) {
        userActivityMap.set(log.userId, (userActivityMap.get(log.userId) || 0) + 1);
      }
    });

    return Array.from(userActivityMap.entries())
      .filter(([userId, count]) => count > actionThreshold)
      .map(([userId, count]) => ({
        userId,
        activityCount: count,
        suspicionLevel: count > actionThreshold * 2 ? 'HIGH' : 'MEDIUM',
      }));
  }

  async cleanup(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLogEntry.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    return { deletedCount: result.count };
  }

  async countUserActivity(userId: number, days = 1) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.auditLogEntry.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });
  }

  async countIpActivity(ipAddress: string, days = 1) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.auditLogEntry.count({
      where: {
        ipAddress,
        createdAt: { gte: since },
      },
    });
  }
}
