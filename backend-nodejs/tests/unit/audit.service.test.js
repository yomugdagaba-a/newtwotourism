/**
 * Unit Tests — Audit Service
 * Covers: UT-16, UT-17
 */

jest.mock('../../src/lib/prisma', () => ({
  auditLogEntry: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: { findMany: jest.fn() },
}));

const prisma = require('../../src/lib/prisma');
const auditService = require('../../src/services/audit.service');

beforeEach(() => jest.clearAllMocks());

// ── UT-16: Logging never throws even when DB raises an error ─────────────────
test('UT-16 log() never throws even when database raises an error', async () => {
  prisma.auditLogEntry.create.mockRejectedValue(new Error('DB connection lost'));

  // Suppress the expected console.error output from the audit service itself
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // audit.service.log() signature: log(userId, action, entityType, entityId, changes, ipAddress, userAgent)
  await expect(auditService.log(1, 'CREATE', 'TourismPlace', 1, null, '127.0.0.1', 'test-agent'))
    .resolves.not.toThrow();

  consoleSpy.mockRestore();
});

// ── UT-17: Statistics aggregation ────────────────────────────────────────────
test('UT-17 getStatistics returns correct action count totals', async () => {
  // getStatistics uses findMany internally (not groupBy) — mock findMany
  prisma.auditLogEntry.findMany.mockResolvedValue([
    { action: 'CREATE', entityType: 'TourismPlace', userId: 1 },
    { action: 'CREATE', entityType: 'TourismPlace', userId: 1 },
    { action: 'UPDATE', entityType: 'Hotel', userId: 2 },
    { action: 'UPDATE', entityType: 'Hotel', userId: 2 },
    { action: 'UPDATE', entityType: 'Hotel', userId: 2 },
    { action: 'DELETE', entityType: 'Road', userId: 1 },
    { action: 'DELETE', entityType: 'Road', userId: 3 },
    { action: 'LOGIN', entityType: 'User', userId: 1 },
    { action: 'LOGIN', entityType: 'User', userId: 2 },
    { action: 'LOGOUT', entityType: 'User', userId: 1 },
  ]);

  const stats = await auditService.getStatistics(1);
  expect(stats.totalLogs).toBe(10);
  expect(stats.actionCounts).toBeDefined();
  expect(stats.actionCounts['CREATE']).toBe(2);
  expect(stats.actionCounts['UPDATE']).toBe(3);
  expect(stats.actionCounts['DELETE']).toBe(2);
});

// ── log() with minimal positional args still works ───────────────────────────
test('log() works with minimal required positional args', async () => {
  prisma.auditLogEntry.create.mockResolvedValue({ id: 1 });
  await expect(auditService.log(null, 'LOGIN', 'User', null, null, null, null))
    .resolves.not.toThrow();
});
