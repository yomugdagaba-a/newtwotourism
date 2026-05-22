const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class AuditRepository extends BaseRepository {
  constructor() {
    super(prisma.auditLogEntry);
  }

  async findAllWithUser(skip, take, userId, action) {
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    return await this.findAll(
      skip, take, where,
      { user: { select: { id: true, username: true, fullName: true } } },
      { createdAt: 'desc' }
    );
  }

  async getStatistics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.model.findMany({
      where: { createdAt: { gte: startDate } },
      select: { action: true, status: true, userId: true, user: { select: { username: true } } },
    });

    const totalLogs = logs.length;
    const successLogs = logs.filter(l => l.status === 'SUCCESS').length;
    const failedLogs = logs.filter(l => l.status === 'FAILED').length;
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});
    const uniqueUsers = new Set(logs.map(l => l.userId).filter(Boolean)).size;

    const userActivityMap = new Map();
    logs.forEach(l => {
      if (!l.userId) return;
      const key = l.user?.username || `User#${l.userId}`;
      userActivityMap.set(key, (userActivityMap.get(key) || 0) + 1);
    });
    const mostActiveUsers = Array.from(userActivityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([username, activityCount]) => ({ username, activityCount }));

    return { totalLogs, successLogs, failedLogs, actionCounts, uniqueUsers, mostActiveUsers, period: `Last ${days} days` };
  }

  async search(filters) {
    const { userId, action, entityType, startDate, endDate, status, skip, take } = filters;
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    return await this.findAll(
      skip || 0, take || 50, where,
      { user: { select: { id: true, username: true, fullName: true } } },
      { createdAt: 'desc' }
    );
  }

  // Returns plain array (not { data, total })
  async getSecurityLogs(skip = 0, take = 100) {
    const securityActions = [
      'LOGIN', 'LOGOUT', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM',
      'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'AUTHORIZATION_CHECK',
    ];
    return await this.model.findMany({
      where: { action: { in: securityActions } },
      include: { user: { select: { id: true, username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // Returns plain array (not { data, total })
  async getHighSeverityLogs(skip = 0, take = 100) {
    return await this.model.findMany({
      where: {
        OR: [
          { status: 'FAILED' },
          { action: 'ACCOUNT_LOCKED' },
          { action: 'DELETE' },
        ],
      },
      include: { user: { select: { id: true, username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // Returns plain array (not { data, total })
  async getSuspiciousActivity(skip = 0, take = 100) {
    const recentTime = new Date();
    recentTime.setHours(recentTime.getHours() - 1);
    return await this.model.findMany({
      where: { createdAt: { gte: recentTime }, status: 'FAILED' },
      include: { user: { select: { id: true, username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getByIpAddress(ipAddress, skip, take) {
    return await this.findAll(
      skip, take, { ipAddress },
      { user: { select: { id: true, username: true, fullName: true } } },
      { createdAt: 'desc' }
    );
  }

  async cleanOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return await this.deleteMany({ createdAt: { lt: cutoffDate } });
  }
}

module.exports = new AuditRepository();
