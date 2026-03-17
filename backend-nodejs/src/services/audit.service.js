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
  const logs = await prisma.auditLogEntry.findMany({ where: { createdAt: { gte: since } } });
  const actionCounts = {};
  const entityTypeCounts = {};
  const userActivityMap = new Map();
  logs.forEach(l => {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    entityTypeCounts[l.entityType] = (entityTypeCounts[l.entityType] || 0) + 1;
    if (l.userId) userActivityMap.set(l.userId, (userActivityMap.get(l.userId) || 0) + 1);
  });
  const mostActiveUsers = Array.from(userActivityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([userId, activityCount]) => ({ userId, activityCount }));
  return { totalLogs: logs.length, actionCounts, entityTypeCounts, mostActiveUsers, period: `Last ${days} days` };
}

async function getSecurityLogs(days = 1) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  return prisma.auditLogEntry.findMany({ where: { createdAt: { gte: since } }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
}

async function getHighSeverityLogs(days = 1) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  return prisma.auditLogEntry.findMany({ where: { createdAt: { gte: since }, action: { in: ['DELETE'] } }, include: { user: true }, orderBy: { createdAt: 'desc' } });
}

async function findSuspiciousActivity(days = 1, actionThreshold = 50) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  const logs = await prisma.auditLogEntry.findMany({ where: { createdAt: { gte: since } }, include: { user: true } });
  const userActivityMap = new Map();
  logs.forEach(l => { if (l.userId) userActivityMap.set(l.userId, (userActivityMap.get(l.userId) || 0) + 1); });
  return Array.from(userActivityMap.entries())
    .filter(([, count]) => count > parseInt(actionThreshold))
    .map(([userId, count]) => ({ userId, activityCount: count, suspicionLevel: count > parseInt(actionThreshold) * 2 ? 'HIGH' : 'MEDIUM' }));
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
