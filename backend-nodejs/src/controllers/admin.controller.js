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
router.get('/tourism', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.category)); } catch (e) { next(e); }
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

router.post('/tourism/:id/images', ...guard, async (req, res, next) => {
  try { res.status(201).json(await tourismService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
});

router.delete('/tourism/images/:imageId', ...guard, async (req, res, next) => {
  try { res.json(await tourismService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
});

// ── Hotels ─────────────────────────────────────────────────────────────────────
router.get('/hotels', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.post('/hotels', ...guard, async (req, res, next) => {
  try { res.status(201).json(await hotelsService.create(req.body, req.user.userId)); } catch (e) { next(e); }
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

router.post('/hotels/:id/assign-owner', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.assignOwner(parseInt(req.params.id), parseInt(req.body.userId))); } catch (e) { next(e); }
});

router.delete('/hotels/:id/owner', ...guard, async (req, res, next) => {
  try { res.json(await hotelsService.removeOwner(parseInt(req.params.id))); } catch (e) { next(e); }
});

// ── Roads ──────────────────────────────────────────────────────────────────────
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
router.get('/audit', ...guard, async (req, res, next) => {
  try { res.json(await auditService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.userId, req.query.action)); } catch (e) { next(e); }
});

router.get('/audit/statistics', ...guard, async (req, res, next) => {
  try { res.json(await auditService.getStatistics(req.query.days || 30)); } catch (e) { next(e); }
});

router.get('/audit/security', ...guard, async (req, res, next) => {
  try { res.json(await auditService.getSecurityLogs(req.query.days || 1)); } catch (e) { next(e); }
});

router.get('/audit/high-severity', ...guard, async (req, res, next) => {
  try { res.json(await auditService.getHighSeverityLogs(req.query.days || 1)); } catch (e) { next(e); }
});

router.get('/audit/suspicious', ...guard, async (req, res, next) => {
  try { res.json(await auditService.findSuspiciousActivity(req.query.days || 1, req.query.threshold || 50)); } catch (e) { next(e); }
});

router.get('/audit/by-username/:username', ...guard, async (req, res, next) => {
  try { res.json(await auditService.findByUsername(req.params.username, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/audit/by-ip/:ip', ...guard, async (req, res, next) => {
  try { res.json(await auditService.findByIpAddress(req.params.ip, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.delete('/audit/cleanup', ...guard, async (req, res, next) => {
  try { res.json(await auditService.cleanup(req.query.retentionDays || 90)); } catch (e) { next(e); }
});

module.exports = router;
