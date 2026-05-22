const { auditRepository } = require('../repositories');

const SECURITY_ACTIONS = [
  'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET_CONFIRM', 'AUTHORIZATION_CHECK', 'SESSION_EXPIRED', 'LOGOUT',
];

class AuditService {
  async log(userId, action, entityType, entityId, changes, ipAddress, userAgent) {
    try {
      return await auditRepository.create({
        userId, action, entityType, entityId,
        changes: changes ? JSON.stringify(changes) : null,
        ipAddress, userAgent, status: 'SUCCESS',
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  }

  async findAll(skip = 0, take = 10, userId, action) {
    const result = await auditRepository.findAllWithUser(
      parseInt(skip), parseInt(take),
      userId ? parseInt(userId) : undefined,
      action
    );
    return { logs: result.data, total: result.total };
  }

  async findByUsername(username, skip = 0, take = 10) {
    const result = await auditRepository.search({ skip: parseInt(skip), take: parseInt(take) });
    return { logs: result.data.filter(l => l.user?.username === username), total: result.total };
  }

  async findByAction(action, skip = 0, take = 10) {
    const result = await auditRepository.findAllWithUser(parseInt(skip), parseInt(take), undefined, action);
    return { logs: result.data, total: result.total };
  }

  async findByEntityType(entityType, skip = 0, take = 10) {
    const result = await auditRepository.search({ entityType, skip: parseInt(skip), take: parseInt(take) });
    return { logs: result.data, total: result.total };
  }

  async findByIpAddress(ipAddress, skip = 0, take = 10) {
    const result = await auditRepository.getByIpAddress(ipAddress, parseInt(skip), parseInt(take));
    return { logs: result.data, total: result.total };
  }

  async getStatistics(days = 30) {
    return await auditRepository.getStatistics(parseInt(days));
  }

  // These three return plain arrays directly from repository
  async getSecurityLogs(days = 1) {
    return await auditRepository.getSecurityLogs(0, 100);
  }

  async getHighSeverityLogs(days = 1) {
    return await auditRepository.getHighSeverityLogs(0, 100);
  }

  async findSuspiciousActivity(days = 1, actionThreshold = 50) {
    const logs = await auditRepository.getSuspiciousActivity(0, 200);
    const ipMap = new Map();
    logs.forEach(l => {
      if (!l.ipAddress) return;
      const entry = ipMap.get(l.ipAddress) || { actionCount: 0, userIds: new Set(), usernames: new Set() };
      entry.actionCount++;
      if (l.userId) entry.userIds.add(l.userId);
      if (l.user?.username) entry.usernames.add(l.user.username);
      ipMap.set(l.ipAddress, entry);
    });
    const threshold = parseInt(actionThreshold);
    return Array.from(ipMap.entries())
      .filter(([, entry]) => entry.actionCount > threshold)
      .map(([ipAddress, entry]) => ({
        ipAddress,
        actionCount: entry.actionCount,
        userCount: entry.userIds.size,
        usernames: Array.from(entry.usernames).join(', ') || 'Unknown',
        riskLevel: entry.actionCount > threshold * 2 ? 'HIGH' : 'MEDIUM',
      }))
      .sort((a, b) => b.actionCount - a.actionCount);
  }

  async cleanup(retentionDays = 90) {
    return await auditRepository.cleanOldLogs(parseInt(retentionDays));
  }

  async countUserActivity(userId, days = 1) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    return await auditRepository.count({ userId: parseInt(userId), createdAt: { gte: since } });
  }

  async countIpActivity(ipAddress, days = 1) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    return await auditRepository.count({ ipAddress, createdAt: { gte: since } });
  }
}

module.exports = new AuditService();
