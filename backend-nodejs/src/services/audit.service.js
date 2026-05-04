const prisma = require('../lib/prisma');

async function log(userId, action, entityType, entityId, changes, ipAddress, userAgent) {
  try {
    return await prisma.auditLogEntry.create({
      data: { userId, action, entityType, entityId, changes: changes ? JSON.stringify(changes) : null, ipAddress, userAgent, status: 'SUCCESS' },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

async function findAll(skip = 0, take = 10, userId, action) {
  const where = {};
  if (userId) where.userId = parseInt(userId);
  if (action) where.action = action;
  const [logs, total] = await Promise.all([
    prisma.auditLogEntry.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: { user: true }, orderBy: { createdAt: 'desc' } }),
    prisma.auditLogEntry.count({ where }),
  ]);
  return { logs, total };
}

async function findByUsername(username, skip = 0, take = 10) {
  const where = { user: { username } };
  const [logs, total] = await Promise.all([
    prisma.auditLogEntry.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: { user: true }, orderBy: { createdAt: 'desc' } }),
    prisma.auditLogEntry.count({ where }),
  ]);
  return { logs, total };
}

async function findByAction(action, skip = 0, take = 10) {
  const [logs, total] = await Promise.all([
    prisma.auditLogEntry.findMany({ where: { action }, skip: parseInt(skip), take: parseInt(take), include: { user: true }, orderBy: { createdAt: 'desc' } }),
    prisma.auditLogEntry.count({ where: { action } }),
  ]);
  return { logs, total };
}

async function findByEntityType(entityType, skip = 0, take = 10) {
  const [logs, total] = await Promise.all([
    prisma.auditLogEntry.findMany({ where: { entityType }, skip: parseInt(skip), take: parseInt(take), include: { user: true }, orderBy: { createdAt: 'desc' } }),
    prisma.auditLogEntry.count({ where: { entityType } }),
  ]);
  return { logs, total };
}

async function findByIpAddress(ipAddress, skip = 0, take = 10) {
  const [logs, total] = await Promise.all([
    prisma.auditLogEntry.findMany({ where: { ipAddress }, skip: parseInt(skip), take: parseInt(take), include: { user: true }, orderBy: { createdAt: 'desc' } }),
    prisma.auditLogEntry.count({ where: { ipAddress } }),
  ]);
  return { logs, total };
}

async function getStatistics(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  const logs = await prisma.auditLogEntry.findMany({ where: { createdAt: { gte: since } }, include: { user: true } });
  const actionCounts = {};
  const entityTypeCounts = {};
  const userActivityMap = new Map();
  logs.forEach(l => {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    entityTypeCounts[l.entityType] = (entityTypeCounts[l.entityType] || 0) + 1;
    if (l.userId) {
      const key = l.user?.username || `User#${l.userId}`;
      userActivityMap.set(key, (userActivityMap.get(key) || 0) + 1);
    }
  });
  const mostActiveUsers = Array.from(userActivityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([username, activityCount]) => ({ username, activityCount }));
  return { totalLogs: logs.length, actionCounts, entityTypeCounts, mostActiveUsers, period: `Last ${days} days` };
}

// Security events = actions that indicate a potential threat or policy violation.
// Normal operations (LOGIN success, CREATE, UPDATE) are audit trail entries, NOT security events.
// Security-relevant actions — must all be valid AuditAction enum values from the Prisma schema
const SECURITY_ACTIONS = [
  'ACCOUNT_LOCKED',         // SEC-02: account locked after repeated failures
  'ACCOUNT_UNLOCKED',       // admin unlocked an account
  'PASSWORD_RESET_REQUEST', // SEC-14: password reset initiated
  'PASSWORD_RESET_CONFIRM', // password changed via reset
  'AUTHORIZATION_CHECK',    // SEC-03/04/11/12: tampered/expired token, privilege escalation
  'SESSION_EXPIRED',        // SEC-04: expired token used
  'LOGOUT',                 // explicit logout — useful for session audit
];

async function getSecurityLogs(days = 1) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  return prisma.auditLogEntry.findMany({
    where: {
      createdAt: { gte: since },
      action: { in: SECURITY_ACTIONS },
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

// High severity = active attack attempts against the system.
// SESSION_EXPIRED is NORMAL — JWT tokens expire after 15 minutes by design.
// High severity = brute force lockouts, privilege escalation, tampered/invalid tokens.
async function getHighSeverityLogs(days = 1) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  return prisma.auditLogEntry.findMany({
    where: {
      createdAt: { gte: since },
      action: { in: ['ACCOUNT_LOCKED', 'AUTHORIZATION_CHECK'] },
      // AUTHORIZATION_CHECK with reason=INSUFFICIENT_PERMISSIONS = privilege escalation attempt
      // AUTHORIZATION_CHECK with reason=TokenExpiredError is SESSION_EXPIRED — excluded here
      NOT: {
        changes: { contains: '"reason":"TokenExpiredError"' }
      }
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function findSuspiciousActivity(days = 1, actionThreshold = 50) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  const logs = await prisma.auditLogEntry.findMany({
    where: { createdAt: { gte: since }, ipAddress: { not: null } },
    include: { user: true },
  });

  // Group by IP address
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

async function cleanup(retentionDays = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(retentionDays));
  const result = await prisma.auditLogEntry.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return { deletedCount: result.count };
}

async function countUserActivity(userId, days = 1) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  return prisma.auditLogEntry.count({ where: { userId: parseInt(userId), createdAt: { gte: since } } });
}

async function countIpActivity(ipAddress, days = 1) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  return prisma.auditLogEntry.count({ where: { ipAddress, createdAt: { gte: since } } });
}

module.exports = { log, findAll, findByUsername, findByAction, findByEntityType, findByIpAddress, getStatistics, getSecurityLogs, getHighSeverityLogs, findSuspiciousActivity, cleanup, countUserActivity, countIpActivity };
