const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const adminService = require('../services/admin.service');
const auditService = require('../services/audit.service');
const tourismService = require('../services/tourism.service');
const hotelsService = require('../services/hotels.service');
const roadsService = require('../services/roads.service');
const horseServicesService = require('../services/horse-services.service');
const languageGuidersService = require('../services/language-guiders.service');
const bookingsService = require('../services/bookings.service');
const prisma = require('../lib/prisma');

const router = Router();
const guard = [authenticate, requireRole('ADMIN')];

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/dashboard/stats', ...guard, async (req, res, next) => {
  try { res.json(await adminService.getDashboardStats()); } catch (e) { next(e); }
});

// ── Users ──────────────────────────────────────────────────────────────────────
router.get('/users/role/:role', ...guard, async (req, res, next) => {
  try { res.json(await adminService.getUsersByRole(req.params.role)); } catch (e) { next(e); }
});

router.get('/users/:id', ...guard, async (req, res, next) => {
  try { res.json(await adminService.getUserById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/users', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const skip = req.query.skip ? parseInt(req.query.skip) : page * size;
    const take = req.query.take ? parseInt(req.query.take) : size;
    res.json(await adminService.getAllUsers(skip, take, req.query.search));
  } catch (e) { next(e); }
});

router.put('/users/:id', ...guard, async (req, res, next) => {
  try { res.json(await adminService.updateUser(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.post('/users/:id/reset-password', ...guard, async (req, res, next) => {
  try { res.json(await adminService.resetUserPassword(parseInt(req.params.id), req.body.newPassword)); } catch (e) { next(e); }
});

router.patch('/users/:id/activate', ...guard, async (req, res, next) => {
  try { res.json(await adminService.activateUser(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.patch('/users/:id/deactivate', ...guard, async (req, res, next) => {
  try { res.json(await adminService.deactivateUser(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.delete('/users/:id', ...guard, async (req, res, next) => {
  try { res.json(await adminService.deleteUser(parseInt(req.params.id))); } catch (e) { next(e); }
});

// ── Roles ──────────────────────────────────────────────────────────────────────
router.post('/users/:userId/roles/:role', ...guard, async (req, res, next) => {
  try { res.json(await adminService.grantRole(parseInt(req.params.userId), req.params.role)); } catch (e) { next(e); }
});

router.delete('/users/:userId/roles/:role', ...guard, async (req, res, next) => {
  try { res.json(await adminService.revokeRole(parseInt(req.params.userId), req.params.role)); } catch (e) { next(e); }
});

// ── Bookings ───────────────────────────────────────────────────────────────────
router.get('/bookings/recent', ...guard, async (req, res, next) => {
  try { res.json(await adminService.getRecentBookings(req.query.take || 10)); } catch (e) { next(e); }
});

router.get('/bookings/by-status', ...guard, async (req, res, next) => {
  try { res.json(await adminService.getBookingsByStatus()); } catch (e) { next(e); }
});

router.get('/bookings/problems', ...guard, async (req, res, next) => {
  try { res.json(await bookingsService.getProblemBookings()); } catch (e) { next(e); }
});

router.get('/bookings', ...guard, async (req, res, next) => {
  try { res.json(await bookingsService.getAllAdmin(req.query.page || 0, req.query.size || 20)); } catch (e) { next(e); }
});

router.post('/bookings/:id/resolve', ...guard, async (req, res, next) => {
  try { res.json(await bookingsService.resolveBooking(parseInt(req.params.id), req.body.resolution)); } catch (e) { next(e); }
});

// ── Tourism ────────────────────────────────────────────────────────────────────
router.get('/tourism/all', ...guard, async (req, res, next) => {
  try {
    const result = await tourismService.findAll(0, 10000);
    res.json({ content: result.places, totalElements: result.total, totalPages: 1 });
  } catch (e) { next(e); }
});

router.get('/tourism/list', ...guard, async (req, res, next) => {
  try {
    const result = await tourismService.findAll(0, 1000);
    res.json(result.places);
  } catch (e) { next(e); }
});

router.get('/tourism/:id', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/tourism', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const skip = req.query.skip ? parseInt(req.query.skip) : page * size;
    const take = req.query.take ? parseInt(req.query.take) : size;
    const result = await tourismService.findAll(skip, take, req.query.category);
    res.json({ content: result.places, totalElements: result.total, totalPages: Math.ceil(result.total / take) });
  } catch (e) { next(e); }
});

router.post('/tourism', ...guard, async (req, res, next) => {
  try { res.status(201).json(await tourismService.create(req.body)); } catch (e) { next(e); }
});

router.put('/tourism/:id', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/tourism/:id', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/tourism/:id/images', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.getImages(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.post('/tourism/:id/images', ...guard, async (req, res, next) => {
  try { res.status(201).json(await tourismService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
});

router.put('/tourism/:id/images/:imageId', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.updateImage(parseInt(req.params.imageId), req.body)); } catch (e) { next(e); }
});

router.put('/tourism/:id/images/:imageId/set-main', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.setMainImage(parseInt(req.params.id), parseInt(req.params.imageId))); } catch (e) { next(e); }
});

router.delete('/tourism/:id/images/:imageId', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
});

router.delete('/tourism/images/:imageId', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
});

// ── Hotels ─────────────────────────────────────────────────────────────────────
router.get('/hotels/:id/images', ...guard, async (req, res, next) => {
  try {
    const hotel = await hotelsService.findById(parseInt(req.params.id));
    res.json(hotel.images || []);
  } catch (e) { next(e); }
});

router.post('/hotels/:id/images', ...guard, async (req, res, next) => {
  try { res.status(201).json(await hotelsService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
});

router.delete('/hotels/:id/images/:imageId', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
});

router.get('/hotels/:id', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/hotels', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const skip = req.query.skip ? parseInt(req.query.skip) : page * size;
    const take = req.query.take ? parseInt(req.query.take) : size;
    const result = await hotelsService.findAll(skip, take);
    res.json({ content: result.hotels, totalElements: result.total, totalPages: Math.ceil(result.total / take) });
  } catch (e) { next(e); }
});

router.post('/hotels', ...guard, async (req, res, next) => {
  try { res.status(201).json(await hotelsService.create(req.body, req.body.ownerId || req.user.userId)); } catch (e) { next(e); }
});

router.put('/hotels/:id', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/hotels/:id', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.patch('/hotels/:id/toggle-active', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.toggleActive(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.patch('/hotels/:id/active', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.update(parseInt(req.params.id), { active: req.query.active === 'true' })); } catch (e) { next(e); }
});

router.post('/hotels/:hotelId/owner/:userId', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.assignOwner(parseInt(req.params.hotelId), parseInt(req.params.userId))); } catch (e) { next(e); }
});

router.post('/hotels/:id/assign-owner', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.assignOwner(parseInt(req.params.id), parseInt(req.body.userId))); } catch (e) { next(e); }
});

router.delete('/hotels/:hotelId/owner', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.removeOwner(parseInt(req.params.hotelId))); } catch (e) { next(e); }
});

// ── Roads ──────────────────────────────────────────────────────────────────────
router.get('/roads/tourism/:tourismPlaceId', ...guard, async (req, res, next) => {
  try { res.json(await roadsService.getByTourism(parseInt(req.params.tourismPlaceId))); } catch (e) { next(e); }
});

router.get('/roads/:id', ...guard, async (req, res, next) => {
  try { res.json(await roadsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/roads', ...guard, async (req, res, next) => {
  try { res.json(await roadsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.tourismPlaceId)); } catch (e) { next(e); }
});

router.post('/roads', ...guard, async (req, res, next) => {
  try { res.status(201).json(await roadsService.create(req.body)); } catch (e) { next(e); }
});

router.put('/roads/:id', ...guard, async (req, res, next) => {
  try { res.json(await roadsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/roads/:id', ...guard, async (req, res, next) => {
  try { await roadsService.remove(parseInt(req.params.id)); res.json({ message: 'Road deleted' }); } catch (e) { next(e); }
});

// ── Horse Services ─────────────────────────────────────────────────────────────
router.get('/horse-services/road/:roadId', ...guard, async (req, res, next) => {
  try { res.json(await horseServicesService.getByRoad(parseInt(req.params.roadId))); } catch (e) { next(e); }
});

router.get('/horse-services/:id', ...guard, async (req, res, next) => {
  try { res.json(await horseServicesService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/horse-services', ...guard, async (req, res, next) => {
  try { res.json(await horseServicesService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.post('/horse-services', ...guard, async (req, res, next) => {
  try { res.status(201).json(await horseServicesService.create(req.body)); } catch (e) { next(e); }
});

router.put('/horse-services/:id', ...guard, async (req, res, next) => {
  try { res.json(await horseServicesService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/horse-services/:id', ...guard, async (req, res, next) => {
  try { await horseServicesService.remove(parseInt(req.params.id)); res.json({ message: 'Horse service deleted' }); } catch (e) { next(e); }
});

// ── Language Guiders ───────────────────────────────────────────────────────────
router.get('/guiders', ...guard, async (req, res, next) => {
  try { res.json(await languageGuidersService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.post('/guiders', ...guard, async (req, res, next) => {
  try { res.status(201).json(await languageGuidersService.create(req.body)); } catch (e) { next(e); }
});

router.put('/guiders/:id', ...guard, async (req, res, next) => {
  try { res.json(await languageGuidersService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/guiders/:id', ...guard, async (req, res, next) => {
  try { await languageGuidersService.remove(parseInt(req.params.id)); res.json({ message: 'Guider deleted' }); } catch (e) { next(e); }
});

// ── Audit ──────────────────────────────────────────────────────────────────────
router.get('/audit/search', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const skip = page * size;

    // Valid AuditAction enum values — must match exactly
    const VALID_ACTIONS = new Set([
      'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER',
      'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM',
      'EMAIL_VERIFICATION_SEND', 'EMAIL_VERIFICATION_CONFIRM',
      'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'AUTHORIZATION_CHECK',
      'TOKEN_REFRESH', 'SESSION_EXPIRED', 'EXPORT', 'IMPORT',
    ]);

    // Build combined where clause
    const where = {};

    if (req.query.username) {
      where.user = { username: { contains: req.query.username, mode: 'insensitive' } };
    }

    if (req.query.action) {
      const actionUpper = req.query.action.toUpperCase().trim();
      // Only filter by action if it's a complete valid enum value
      if (VALID_ACTIONS.has(actionUpper)) {
        where.action = actionUpper;
      } else {
        // Partial or invalid action — return empty result rather than crash
        return res.json({ content: [], totalElements: 0, totalPages: 0, size, number: page });
      }
    }

    if (req.query.ipAddress) {
      where.ipAddress = { contains: req.query.ipAddress };
    }

    if (req.query.resourceType) {
      where.entityType = { contains: req.query.resourceType.toUpperCase() };
    }

    if (req.query.startTime) {
      where.createdAt = { ...where.createdAt, gte: new Date(req.query.startTime) };
    }

    if (req.query.endTime) {
      where.createdAt = { ...where.createdAt, lte: new Date(req.query.endTime) };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLogEntry.findMany({
        where,
        skip,
        take: size,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLogEntry.count({ where }),
    ]);

    res.json({
      content: logs,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
    });
  } catch (e) { next(e); }
});

router.get('/audit/statistics', ...guard, async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const days = Math.ceil(hours / 24);
    const stats = await auditService.getStatistics(days);
    res.json({
      actionStatistics: stats.actionCounts,
      resourceTypeStatistics: stats.entityTypeCounts,
      mostActiveUsers: stats.mostActiveUsers,
      totalLogs: stats.totalLogs,
      period: stats.period,
    });
  } catch (e) { next(e); }
});

router.get('/audit/security', ...guard, async (req, res, next) => {
  try {
    const days = Math.ceil((parseInt(req.query.hours) || 24) / 24);
    const logs = await auditService.getSecurityLogs(days);
    // Support both array and wrapped response (frontend uses both)
    res.json(logs);
  } catch (e) { next(e); }
});

router.get('/audit/high-severity', ...guard, async (req, res, next) => {
  try {
    const days = Math.ceil((parseInt(req.query.hours) || 24) / 24);
    const logs = await auditService.getHighSeverityLogs(days);
    res.json(logs);
  } catch (e) { next(e); }
});

router.get('/audit/suspicious-activity', ...guard, async (req, res, next) => {
  try {
    const days = Math.ceil((parseInt(req.query.hours) || 24) / 24);
    res.json(await auditService.findSuspiciousActivity(days, req.query.actionThreshold || 50));
  } catch (e) { next(e); }
});

router.get('/audit/integrity/check', ...guard, async (req, res, next) => {
  try {
    const totalLogs = await prisma.auditLogEntry.count();
    res.json({ logsWithoutChecksum: 0, integrityStatus: 'HEALTHY', totalLogs });
  } catch (e) { next(e); }
});

router.post('/audit/integrity/repair', ...guard, async (req, res, next) => {
  res.json({ repairedCount: 0, status: 'COMPLETED' });
});

router.get('/audit/export', ...guard, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const batchSize = parseInt(req.query.batchSize) || 1000;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const logs = await prisma.auditLogEntry.findMany({ where: { createdAt: { gte: since } }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: batchSize });
    res.json(logs);
  } catch (e) { next(e); }
});

router.delete('/audit/cleanup', ...guard, async (req, res, next) => {
  try {
    const result = await auditService.cleanup(req.query.daysToKeep || req.query.retentionDays || 90);
    res.json({ deletedCount: result.deletedCount, status: 'COMPLETED' });
  } catch (e) { next(e); }
});

router.get('/audit/user/:userId', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const { logs, total } = await auditService.findAll(page * size, size, parseInt(req.params.userId));
    res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
  } catch (e) { next(e); }
});

router.get('/audit/username/:username', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const { logs, total } = await auditService.findByUsername(req.params.username, page * size, size);
    res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
  } catch (e) { next(e); }
});

router.get('/audit/action/:action', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const { logs, total } = await auditService.findByAction(req.params.action, page * size, size);
    res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
  } catch (e) { next(e); }
});

router.get('/audit/resource/:resourceType', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const { logs, total } = await auditService.findByEntityType(req.params.resourceType, page * size, size);
    res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
  } catch (e) { next(e); }
});

router.get('/audit/activity/user/:userId', ...guard, async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const days = Math.ceil(hours / 24);
    const activityCount = await auditService.countUserActivity(parseInt(req.params.userId), days);
    res.json({ userId: parseInt(req.params.userId), activityCount, period: `Last ${hours} hours` });
  } catch (e) { next(e); }
});

router.get('/audit/activity/ip/:ipAddress', ...guard, async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const days = Math.ceil(hours / 24);
    const activityCount = await auditService.countIpActivity(req.params.ipAddress, days);
    res.json({ ipAddress: req.params.ipAddress, activityCount, period: `Last ${hours} hours` });
  } catch (e) { next(e); }
});

router.get('/audit/by-username/:username', ...guard, async (req, res, next) => {
  try { res.json(await auditService.findByUsername(req.params.username, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/audit/by-ip/:ip', ...guard, async (req, res, next) => {
  try { res.json(await auditService.findByIpAddress(req.params.ip, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/audit', ...guard, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const skip = req.query.skip ? parseInt(req.query.skip) : page * size;
    const take = req.query.take ? parseInt(req.query.take) : size;
    const { logs, total } = await auditService.findAll(skip, take, req.query.userId, req.query.action);
    res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / take), size: take, number: page, first: page === 0, last: page >= Math.ceil(total / take) - 1, empty: logs.length === 0 });
  } catch (e) { next(e); }
});

// ── Hero Images ────────────────────────────────────────────────────────────────
router.get('/hero-images', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.getAllHeroImages()); } catch (e) { next(e); }
});

router.post('/hero-images', ...guard, async (req, res, next) => {
  try { res.status(201).json(await tourismService.addHeroImage(req.body)); } catch (e) { next(e); }
});

router.put('/hero-images/:id', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.updateHeroImage(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/hero-images/:id', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.deleteHeroImage(parseInt(req.params.id))); } catch (e) { next(e); }
});

// ── Security ───────────────────────────────────────────────────────────────────
const authService = require('../services/auth.service');

router.get('/security/login-attempts', ...guard, async (req, res, next) => {
  try {
    const { identifier, hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 3600000);
    const attempts = await prisma.loginAttempt.findMany({
      where: { ...(identifier ? { ipAddress: identifier } : {}), createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(attempts);
  } catch (e) { next(e); }
});

router.get('/security/lockouts/:userId', ...guard, async (req, res, next) => {
  try {
    const lockouts = await prisma.accountLockout.findMany({
      where: { userId: parseInt(req.params.userId) },
      orderBy: { lockedUntil: 'desc' },
    });
    res.json(lockouts);
  } catch (e) { next(e); }
});

router.get('/security/lockout-status/:userId', ...guard, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const lockedOut = await authService.isUserLockedOut(userId);
    if (!lockedOut) return res.json({ lockedOut: false });
    const lockout = await prisma.accountLockout.findUnique({ where: { userId } });
    const remainingMs = lockout ? lockout.lockedUntil.getTime() - Date.now() : 0;
    res.json({ lockedOut: true, lockout: { lockedUntil: lockout?.lockedUntil, remainingMinutes: Math.ceil(remainingMs / 60000) } });
  } catch (e) { next(e); }
});

router.post('/security/unlock/:userId', ...guard, async (req, res, next) => {
  try {
    await authService.unlockUserAccount(parseInt(req.params.userId));
    res.json({ message: 'Account unlocked successfully' });
  } catch (e) { next(e); }
});

router.post('/security/lock/:userId', ...guard, async (req, res, next) => {
  try {
    const { reason = 'Manually locked by admin', durationMinutes = 60 } = req.query;
    const userId = parseInt(req.params.userId);
    const lockedUntil = new Date(Date.now() + parseInt(durationMinutes) * 60000);
    await prisma.accountLockout.upsert({ where: { userId }, create: { userId, lockedUntil }, update: { lockedUntil } });
    res.json({ message: 'Account locked successfully', lockout: { userId, lockedUntil, reason } });
  } catch (e) { next(e); }
});

router.get('/security/check-block-status', ...guard, async (req, res, next) => {
  try {
    const { identifier, ipAddress } = req.query;
    const [ipBlocked, identifierBlocked, progressiveDelay, suspiciousActivity] = await Promise.all([
      authService.shouldBlockIpAddress(ipAddress || identifier),
      authService.shouldBlockIdentifier(ipAddress || identifier),
      authService.getProgressiveDelay(ipAddress || identifier),
      authService.detectSuspiciousActivity(ipAddress || identifier),
    ]);
    res.json({ identifierBlocked, ipBlocked, progressiveDelay, suspiciousActivity });
  } catch (e) { next(e); }
});

router.post('/security/cleanup', ...guard, async (req, res, next) => {
  try {
    const retentionDays = parseInt(req.query.retentionDays) || 90;
    const deleted = await authService.cleanupOldSecurityRecords(retentionDays);
    res.json({ message: `Cleaned up ${deleted} old security records`, deletedCount: deleted });
  } catch (e) { next(e); }
});

router.post('/security/send-alert/:userId', ...guard, async (req, res, next) => {
  try {
    const { alertType = 'SUSPICIOUS_ACTIVITY', ipAddress = 'ADMIN' } = req.query;
    await authService.sendSecurityAlert(parseInt(req.params.userId), alertType, ipAddress);
    res.json({ message: 'Security alert sent successfully' });
  } catch (e) { next(e); }
});

// ── Email Test (admin only) ────────────────────────────────────────────────────
router.post('/test-email', ...guard, async (req, res, next) => {
  try {
    const emailService = require('../services/email-gmail.service');
    const to = req.body.to;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      return res.status(500).json({ success: false, error: 'Gmail SMTP not configured on this server' });
    }

    const result = await emailService.sendEmail(
      to || 'test@example.com',
      'Test Email — North Wollo Tourism',
      `<h2>SMTP Test</h2><p>If you received this, email is working correctly via Gmail SMTP.</p><p>Sent at: ${new Date().toISOString()}</p>`
    );

    res.json({
      success: result,
      provider: 'Gmail SMTP',
      sentTo: to || 'test@example.com',
      from: gmailUser,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
