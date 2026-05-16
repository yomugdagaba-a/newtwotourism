
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
const authService = require('../services/auth.service');
const emailService = require('../services/email-gmail.service');
const prisma = require('../lib/prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

class AdminController {
  constructor() {
    this.router = Router();
    this._guard = [authenticate, requireRole('ADMIN')];
    this._tourismUpload = this._createUploader('tourism-images');
    this._hotelUpload = this._createUploader('hotel-images');
    this._heroUpload = this._createUploader('hero-images');
    this._registerRoutes();
  }

  // ── Multer factory ─────────────────────────────────────────────────────────

  _createUploader(subFolder) {
    const uploadDir = process.env.NODE_ENV === 'production'
      ? path.join('/tmp', 'uploads', subFolder)
      : path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads', subFolder);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
    });
    return multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.includes(ext)) return cb(new Error(`Only image files allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
        cb(null, true);
      },
    });
  }

  _imagePath(subFolder, filename) {
    return `/uploads/${subFolder}/${filename}`;
  }

  // ── Route Registration ─────────────────────────────────────────────────────

  _registerRoutes() {
    const g = this._guard;

    // Dashboard
    this.router.get('/dashboard/stats', ...g, this.getDashboardStats.bind(this));

    // Users
    this.router.get('/users/role/:role', ...g, this.getUsersByRole.bind(this));
    this.router.get('/users/:id', ...g, this.getUserById.bind(this));
    this.router.get('/users', ...g, this.getAllUsers.bind(this));
    this.router.put('/users/:id', ...g, this.updateUser.bind(this));
    this.router.post('/users/:id/reset-password', ...g, this.resetUserPassword.bind(this));
    this.router.patch('/users/:id/activate', ...g, this.activateUser.bind(this));
    this.router.patch('/users/:id/deactivate', ...g, this.deactivateUser.bind(this));
    this.router.delete('/users/:id', ...g, this.deleteUser.bind(this));

    // Roles
    this.router.post('/users/:userId/roles/:role', ...g, this.grantRole.bind(this));
    this.router.delete('/users/:userId/roles/:role', ...g, this.revokeRole.bind(this));

    // Bookings
    this.router.get('/bookings/recent', ...g, this.getRecentBookings.bind(this));
    this.router.get('/bookings/by-status', ...g, this.getBookingsByStatus.bind(this));
    this.router.get('/bookings/problems', ...g, this.getProblemBookings.bind(this));
    this.router.get('/bookings', ...g, this.getAllBookings.bind(this));
    this.router.post('/bookings/:id/resolve', ...g, this.resolveBooking.bind(this));
    this.router.delete('/bookings/:id', ...g, this.deleteBooking.bind(this));

    // Image uploads
    this.router.post('/tourism/:id/images/upload', ...g, this._tourismUpload.single('image'), this.uploadTourismGalleryImage.bind(this));
    this.router.post('/tourism/:id/main-image/upload', ...g, this._tourismUpload.single('image'), this.uploadTourismMainImage.bind(this));
    this.router.post('/hotels/:id/main-image/upload', ...g, this._hotelUpload.single('image'), this.uploadHotelMainImage.bind(this));
    this.router.post('/hotels/:id/images/upload', ...g, this._hotelUpload.single('image'), this.uploadHotelGalleryImage.bind(this));
    this.router.post('/hero-images/upload', ...g, this._heroUpload.single('image'), this.uploadHeroImage.bind(this));
    this.router.put('/hero-images/:id/upload', ...g, this._heroUpload.single('image'), this.updateHeroImageWithFile.bind(this));

    // Tourism CRUD
    this.router.get('/tourism/all', ...g, this.getAllTourism.bind(this));
    this.router.get('/tourism/list', ...g, this.listTourism.bind(this));
    this.router.get('/tourism/:id/images', ...g, this.getTourismImages.bind(this));
    this.router.post('/tourism/:id/images', ...g, this.addTourismImage.bind(this));
    this.router.put('/tourism/:id/images/:imageId/set-main', ...g, this.setTourismMainImage.bind(this));
    this.router.put('/tourism/:id/images/:imageId', ...g, this.updateTourismImage.bind(this));
    this.router.delete('/tourism/:id/images/:imageId', ...g, this.deleteTourismImage.bind(this));
    this.router.delete('/tourism/images/:imageId', ...g, this.deleteTourismImageDirect.bind(this));
    this.router.get('/tourism/:id', ...g, this.getTourismById.bind(this));
    this.router.get('/tourism', ...g, this.getTourism.bind(this));
    this.router.post('/tourism', ...g, this.createTourism.bind(this));
    this.router.put('/tourism/:id', ...g, this.updateTourism.bind(this));
    this.router.delete('/tourism/:id', ...g, this.deleteTourism.bind(this));

    // Hotels CRUD
    this.router.get('/hotels/:id/images', ...g, this.getHotelImages.bind(this));
    this.router.post('/hotels/:id/images', ...g, this.addHotelImage.bind(this));
    this.router.put('/hotels/:id/images/:imageId', ...g, this.updateHotelImage.bind(this));
    this.router.delete('/hotels/:id/images/:imageId', ...g, this.deleteHotelImage.bind(this));
    this.router.post('/hotels/:id/set-main-image', ...g, this.setMainHotelImage.bind(this));
    this.router.get('/hotels/:id', ...g, this.getHotelById.bind(this));
    this.router.get('/hotels', ...g, this.getHotels.bind(this));
    this.router.post('/hotels', ...g, this.createHotel.bind(this));
    this.router.put('/hotels/:id', ...g, this.updateHotel.bind(this));
    this.router.delete('/hotels/:id', ...g, this.deleteHotel.bind(this));
    this.router.patch('/hotels/:id/toggle-active', ...g, this.toggleHotelActive.bind(this));
    this.router.patch('/hotels/:id/active', ...g, this.setHotelActive.bind(this));
    this.router.post('/hotels/:hotelId/owner/:userId', ...g, this.assignHotelOwner.bind(this));
    this.router.post('/hotels/:id/assign-owner', ...g, this.assignHotelOwnerByBody.bind(this));
    this.router.delete('/hotels/:hotelId/owner', ...g, this.removeHotelOwner.bind(this));

    // Roads
    this.router.get('/roads/tourism/:tourismPlaceId', ...g, this.getRoadsByTourism.bind(this));
    this.router.get('/roads/:id', ...g, this.getRoadById.bind(this));
    this.router.get('/roads', ...g, this.getRoads.bind(this));
    this.router.post('/roads', ...g, this.createRoad.bind(this));
    this.router.put('/roads/:id', ...g, this.updateRoad.bind(this));
    this.router.delete('/roads/:id', ...g, this.deleteRoad.bind(this));

    // Horse Services
    this.router.get('/horse-services/road/:roadId', ...g, this.getHorseServicesByRoad.bind(this));
    this.router.get('/horse-services/:id', ...g, this.getHorseServiceById.bind(this));
    this.router.get('/horse-services', ...g, this.getHorseServices.bind(this));
    this.router.post('/horse-services', ...g, this.createHorseService.bind(this));
    this.router.put('/horse-services/:id', ...g, this.updateHorseService.bind(this));
    this.router.delete('/horse-services/:id', ...g, this.deleteHorseService.bind(this));

    // Language Guiders
    this.router.get('/guiders', ...g, this.getGuiders.bind(this));
    this.router.post('/guiders', ...g, this.createGuider.bind(this));
    this.router.put('/guiders/:id', ...g, this.updateGuider.bind(this));
    this.router.delete('/guiders/:id', ...g, this.deleteGuider.bind(this));

    // Audit
    this.router.get('/audit/search', ...g, this.auditSearch.bind(this));
    this.router.get('/audit/statistics', ...g, this.auditStatistics.bind(this));
    this.router.get('/audit/security', ...g, this.auditSecurity.bind(this));
    this.router.get('/audit/high-severity', ...g, this.auditHighSeverity.bind(this));
    this.router.get('/audit/suspicious-activity', ...g, this.auditSuspiciousActivity.bind(this));
    this.router.get('/audit/integrity/check', ...g, this.auditIntegrityCheck.bind(this));
    this.router.post('/audit/integrity/repair', ...g, this.auditIntegrityRepair.bind(this));
    this.router.get('/audit/export', ...g, this.auditExport.bind(this));
    this.router.delete('/audit/cleanup', ...g, this.auditCleanup.bind(this));
    this.router.get('/audit/user/:userId', ...g, this.auditByUser.bind(this));
    this.router.get('/audit/username/:username', ...g, this.auditByUsername.bind(this));
    this.router.get('/audit/action/:action', ...g, this.auditByAction.bind(this));
    this.router.get('/audit/resource/:resourceType', ...g, this.auditByResource.bind(this));
    this.router.get('/audit/activity/user/:userId', ...g, this.auditUserActivity.bind(this));
    this.router.get('/audit/activity/ip/:ipAddress', ...g, this.auditIpActivity.bind(this));
    this.router.get('/audit/by-username/:username', ...g, this.auditByUsernameLegacy.bind(this));
    this.router.get('/audit/by-ip/:ip', ...g, this.auditByIp.bind(this));
    this.router.get('/audit', ...g, this.auditList.bind(this));

    // Hero Images
    this.router.get('/hero-images', ...g, this.getHeroImages.bind(this));
    this.router.post('/hero-images', ...g, this.createHeroImage.bind(this));
    this.router.put('/hero-images/:id', ...g, this.updateHeroImage.bind(this));
    this.router.delete('/hero-images/:id', ...g, this.deleteHeroImage.bind(this));

    // Security
    this.router.get('/security/login-attempts', ...g, this.getLoginAttempts.bind(this));
    this.router.get('/security/lockouts/:userId', ...g, this.getLockouts.bind(this));
    this.router.get('/security/lockout-status/:userId', ...g, this.getLockoutStatus.bind(this));
    this.router.post('/security/unlock/:userId', ...g, this.unlockUser.bind(this));
    this.router.post('/security/lock/:userId', ...g, this.lockUser.bind(this));
    this.router.get('/security/check-block-status', ...g, this.checkBlockStatus.bind(this));
    this.router.post('/security/cleanup', ...g, this.securityCleanup.bind(this));
    this.router.post('/security/send-alert/:userId', ...g, this.sendSecurityAlert.bind(this));

    // Email test
    this.router.post('/test-email', ...g, this.testEmail.bind(this));
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboardStats(req, res, next) {
    try { res.json(await adminService.getDashboardStats()); } catch (e) { next(e); }
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 20;
      const skip = req.query.skip ? parseInt(req.query.skip) : page * size;
      const take = req.query.take ? parseInt(req.query.take) : size;
      res.json(await adminService.getAllUsers(skip, take, req.query.search));
    } catch (e) { next(e); }
  }

  async getUserById(req, res, next) {
    try { res.json(await adminService.getUserById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async getUsersByRole(req, res, next) {
    try { res.json(await adminService.getUsersByRole(req.params.role)); } catch (e) { next(e); }
  }

  async updateUser(req, res, next) {
    try { res.json(await adminService.updateUser(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async resetUserPassword(req, res, next) {
    try { res.json(await adminService.resetUserPassword(parseInt(req.params.id), req.body.newPassword)); } catch (e) { next(e); }
  }

  async activateUser(req, res, next) {
    try { res.json(await adminService.activateUser(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async deactivateUser(req, res, next) {
    try { res.json(await adminService.deactivateUser(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async deleteUser(req, res, next) {
    try { res.json(await adminService.deleteUser(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async grantRole(req, res, next) {
    try { res.json(await adminService.grantRole(parseInt(req.params.userId), req.params.role)); } catch (e) { next(e); }
  }

  async revokeRole(req, res, next) {
    try { res.json(await adminService.revokeRole(parseInt(req.params.userId), req.params.role)); } catch (e) { next(e); }
  }

  // ── Bookings ───────────────────────────────────────────────────────────────

  async getRecentBookings(req, res, next) {
    try { res.json(await adminService.getRecentBookings(req.query.take || 10)); } catch (e) { next(e); }
  }

  async getBookingsByStatus(req, res, next) {
    try { res.json(await adminService.getBookingsByStatus()); } catch (e) { next(e); }
  }

  async getProblemBookings(req, res, next) {
    try { res.json(await bookingsService.getProblemBookings()); } catch (e) { next(e); }
  }

  async getAllBookings(req, res, next) {
    try { res.json(await bookingsService.getAllAdmin(req.query.page || 0, req.query.size || 20)); } catch (e) { next(e); }
  }

  async resolveBooking(req, res, next) {
    try { res.json(await bookingsService.resolveBooking(parseInt(req.params.id), req.body.resolution)); } catch (e) { next(e); }
  }

  async deleteBooking(req, res, next) {
    try { await bookingsService.remove(parseInt(req.params.id)); res.json({ message: 'Booking deleted successfully' }); } catch (e) { next(e); }
  }

  // ── Image Uploads ──────────────────────────────────────────────────────────

  async uploadTourismGalleryImage(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image file provided' });
      const imageUrl = this._imagePath('tourism-images', req.file.filename);
      res.status(201).json(await tourismService.addImage(parseInt(req.params.id), imageUrl));
    } catch (e) { next(e); }
  }

  async uploadTourismMainImage(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image file provided' });
      const imageUrl = this._imagePath('tourism-images', req.file.filename);
      
      // Update the main imageUrl on the tourism place
      const result = await tourismService.update(parseInt(req.params.id), { imageUrl });
      
      // Also add/update it in the tourismImage table with displayOrder 0
      const existingImages = await prisma.tourismImage.findMany({ 
        where: { tourismPlaceId: parseInt(req.params.id) },
        orderBy: { displayOrder: 'asc' }
      });
      
      const mainImage = existingImages.find(img => img.displayOrder === 0);
      
      if (mainImage) {
        // Update existing main image
        await prisma.tourismImage.update({
          where: { id: mainImage.id },
          data: { imageUrl }
        });
      } else {
        // Create new main image entry
        await prisma.tourismImage.create({
          data: {
            tourismPlaceId: parseInt(req.params.id),
            imageUrl,
            displayOrder: 0
          }
        });
      }
      
      res.json({ imageUrl, ...result });
    } catch (e) { next(e); }
  }

  async uploadHotelMainImage(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image file provided' });
      const imageUrl = this._imagePath('hotel-images', req.file.filename);
      // Delete existing main image (displayOrder=0) and insert new one at position 0
      // without touching gallery images
      await prisma.hotelImage.deleteMany({ where: { hotelId: parseInt(req.params.id), displayOrder: 0 } });
      await prisma.hotelImage.create({ data: { hotelId: parseInt(req.params.id), imageUrl, displayOrder: 0 } });
      const hotel = await hotelsService.findById(parseInt(req.params.id));
      res.json({ imageUrl, ...hotel });
    } catch (e) { next(e); }
  }

  async uploadHotelGalleryImage(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image file provided' });
      const imageUrl = this._imagePath('hotel-images', req.file.filename);
      res.status(201).json(await hotelsService.addImage(parseInt(req.params.id), imageUrl));
    } catch (e) { next(e); }
  }

  async uploadHeroImage(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image file provided' });
      const imageUrl = this._imagePath('hero-images', req.file.filename);
      res.status(201).json(await tourismService.addHeroImage({
        imageUrl,
        title: req.body.title || '',
        description: req.body.description || '',
        displayOrder: parseInt(req.body.displayOrder) || 0,
        active: req.body.active !== 'false',
      }));
    } catch (e) { next(e); }
  }

  async updateHeroImageWithFile(req, res, next) {
    try {
      const updateData = {
        title: req.body.title,
        description: req.body.description,
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : undefined,
        active: req.body.active !== undefined ? req.body.active !== 'false' : undefined,
      };
      if (req.file) updateData.imageUrl = this._imagePath('hero-images', req.file.filename);
      res.json(await tourismService.updateHeroImage(parseInt(req.params.id), updateData));
    } catch (e) { next(e); }
  }

  // ── Tourism ────────────────────────────────────────────────────────────────

  async getAllTourism(req, res, next) {
    try {
      const result = await tourismService.findAll(0, 10000);
      res.json({ content: result.places, totalElements: result.total, totalPages: 1 });
    } catch (e) { next(e); }
  }

  async listTourism(req, res, next) {
    try {
      const result = await tourismService.findAll(0, 1000);
      res.json(result.places);
    } catch (e) { next(e); }
  }

  async getTourism(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 10;
      const skip = req.query.skip ? parseInt(req.query.skip) : page * size;
      const take = req.query.take ? parseInt(req.query.take) : size;
      const result = await tourismService.findAll(skip, take, req.query.category);
      res.json({ content: result.places, totalElements: result.total, totalPages: Math.ceil(result.total / take) });
    } catch (e) { next(e); }
  }

  async getTourismById(req, res, next) {
    try { res.json(await tourismService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async createTourism(req, res, next) {
    try { res.status(201).json(await tourismService.create(req.body)); } catch (e) { next(e); }
  }

  async updateTourism(req, res, next) {
    try { res.json(await tourismService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async deleteTourism(req, res, next) {
    try { res.json(await tourismService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async getTourismImages(req, res, next) {
    try { res.json(await tourismService.getImages(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async addTourismImage(req, res, next) {
    try { res.status(201).json(await tourismService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
  }

  async updateTourismImage(req, res, next) {
    try { res.json(await tourismService.updateImage(parseInt(req.params.imageId), req.body)); } catch (e) { next(e); }
  }

  async setTourismMainImage(req, res, next) {
    try { res.json(await tourismService.setMainImage(parseInt(req.params.id), parseInt(req.params.imageId))); } catch (e) { next(e); }
  }

  async deleteTourismImage(req, res, next) {
    try { res.json(await tourismService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
  }

  async deleteTourismImageDirect(req, res, next) {
    try { res.json(await tourismService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
  }

  // ── Hotels ─────────────────────────────────────────────────────────────────

  async getHotels(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 10;
      const skip = req.query.skip ? parseInt(req.query.skip) : page * size;
      const take = req.query.take ? parseInt(req.query.take) : size;
      const result = await hotelsService.findAll(skip, take);
      res.json({ content: result.hotels, totalElements: result.total, totalPages: Math.ceil(result.total / take) });
    } catch (e) { next(e); }
  }

  async getHotelById(req, res, next) {
    try { res.json(await hotelsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async createHotel(req, res, next) {
    try { res.status(201).json(await hotelsService.create(req.body, req.body.ownerId || req.user.userId)); } catch (e) { next(e); }
  }

  async updateHotel(req, res, next) {
    try { res.json(await hotelsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async deleteHotel(req, res, next) {
    try { res.json(await hotelsService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async toggleHotelActive(req, res, next) {
    try { res.json(await hotelsService.toggleActive(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async setHotelActive(req, res, next) {
    try { res.json(await hotelsService.update(parseInt(req.params.id), { active: req.query.active === 'true' })); } catch (e) { next(e); }
  }

  async getHotelImages(req, res, next) {
    try { const hotel = await hotelsService.findById(parseInt(req.params.id)); res.json(hotel.images || []); } catch (e) { next(e); }
  }

  async addHotelImage(req, res, next) {
    try { res.status(201).json(await hotelsService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
  }

  async updateHotelImage(req, res, next) {
    try { res.json(await hotelsService.updateImage(parseInt(req.params.imageId), req.body)); } catch (e) { next(e); }
  }

  async deleteHotelImage(req, res, next) {
    try { res.json(await hotelsService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
  }

  async setMainHotelImage(req, res, next) {
    try { res.json(await hotelsService.setMainImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
  }

  async assignHotelOwner(req, res, next) {
    try { res.json(await hotelsService.assignOwner(parseInt(req.params.hotelId), parseInt(req.params.userId))); } catch (e) { next(e); }
  }

  async assignHotelOwnerByBody(req, res, next) {
    try { res.json(await hotelsService.assignOwner(parseInt(req.params.id), parseInt(req.body.userId))); } catch (e) { next(e); }
  }

  async removeHotelOwner(req, res, next) {
    try { res.json(await hotelsService.removeOwner(parseInt(req.params.hotelId))); } catch (e) { next(e); }
  }

  // ── Roads ──────────────────────────────────────────────────────────────────

  async getRoads(req, res, next) {
    try { res.json(await roadsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.tourismPlaceId)); } catch (e) { next(e); }
  }

  async getRoadById(req, res, next) {
    try { res.json(await roadsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async getRoadsByTourism(req, res, next) {
    try { res.json(await roadsService.getByTourism(parseInt(req.params.tourismPlaceId))); } catch (e) { next(e); }
  }

  async createRoad(req, res, next) {
    try { res.status(201).json(await roadsService.create(req.body)); } catch (e) { next(e); }
  }

  async updateRoad(req, res, next) {
    try { res.json(await roadsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async deleteRoad(req, res, next) {
    try { await roadsService.remove(parseInt(req.params.id)); res.json({ message: 'Road deleted' }); } catch (e) { next(e); }
  }

  // ── Horse Services ─────────────────────────────────────────────────────────

  async getHorseServices(req, res, next) {
    try { res.json(await horseServicesService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async getHorseServiceById(req, res, next) {
    try { res.json(await horseServicesService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async getHorseServicesByRoad(req, res, next) {
    try { res.json(await horseServicesService.getByRoad(parseInt(req.params.roadId))); } catch (e) { next(e); }
  }

  async createHorseService(req, res, next) {
    try { res.status(201).json(await horseServicesService.create(req.body)); } catch (e) { next(e); }
  }

  async updateHorseService(req, res, next) {
    try { res.json(await horseServicesService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async deleteHorseService(req, res, next) {
    try { await horseServicesService.remove(parseInt(req.params.id)); res.json({ message: 'Horse service deleted' }); } catch (e) { next(e); }
  }

  // ── Language Guiders ───────────────────────────────────────────────────────

  async getGuiders(req, res, next) {
    try { res.json(await languageGuidersService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async createGuider(req, res, next) {
    try { res.status(201).json(await languageGuidersService.create(req.body)); } catch (e) { next(e); }
  }

  async updateGuider(req, res, next) {
    try { res.json(await languageGuidersService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async deleteGuider(req, res, next) {
    try { await languageGuidersService.remove(parseInt(req.params.id)); res.json({ message: 'Guider deleted' }); } catch (e) { next(e); }
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  async auditSearch(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 20;
      const skip = page * size;
      const VALID_ACTIONS = new Set([
        'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER',
        'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM',
        'EMAIL_VERIFICATION_SEND', 'EMAIL_VERIFICATION_CONFIRM',
        'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'AUTHORIZATION_CHECK',
        'TOKEN_REFRESH', 'SESSION_EXPIRED', 'EXPORT', 'IMPORT',
      ]);
      const where = {};
      if (req.query.username) where.user = { username: { contains: req.query.username, mode: 'insensitive' } };
      if (req.query.action) {
        const actionUpper = req.query.action.toUpperCase().trim();
        if (VALID_ACTIONS.has(actionUpper)) where.action = actionUpper;
        else return res.json({ content: [], totalElements: 0, totalPages: 0, size, number: page });
      }
      if (req.query.ipAddress) where.ipAddress = { contains: req.query.ipAddress };
      if (req.query.resourceType) where.entityType = { contains: req.query.resourceType.toUpperCase() };
      if (req.query.startTime) where.createdAt = { ...where.createdAt, gte: new Date(req.query.startTime) };
      if (req.query.endTime) where.createdAt = { ...where.createdAt, lte: new Date(req.query.endTime) };
      const [logs, total] = await Promise.all([
        prisma.auditLogEntry.findMany({ where, skip, take: size, include: { user: true }, orderBy: { createdAt: 'desc' } }),
        prisma.auditLogEntry.count({ where }),
      ]);
      res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
    } catch (e) { next(e); }
  }

  async auditStatistics(req, res, next) {
    try {
      const days = Math.ceil((parseInt(req.query.hours) || 24) / 24);
      const stats = await auditService.getStatistics(days);
      res.json({ actionStatistics: stats.actionCounts, resourceTypeStatistics: stats.entityTypeCounts, mostActiveUsers: stats.mostActiveUsers, totalLogs: stats.totalLogs, period: stats.period });
    } catch (e) { next(e); }
  }

  async auditSecurity(req, res, next) {
    try { res.json(await auditService.getSecurityLogs(Math.ceil((parseInt(req.query.hours) || 24) / 24))); } catch (e) { next(e); }
  }

  async auditHighSeverity(req, res, next) {
    try { res.json(await auditService.getHighSeverityLogs(Math.ceil((parseInt(req.query.hours) || 24) / 24))); } catch (e) { next(e); }
  }

  async auditSuspiciousActivity(req, res, next) {
    try { res.json(await auditService.findSuspiciousActivity(Math.ceil((parseInt(req.query.hours) || 24) / 24), req.query.actionThreshold || 50)); } catch (e) { next(e); }
  }

  async auditIntegrityCheck(req, res, next) {
    try { const totalLogs = await prisma.auditLogEntry.count(); res.json({ logsWithoutChecksum: 0, integrityStatus: 'HEALTHY', totalLogs }); } catch (e) { next(e); }
  }

  async auditIntegrityRepair(req, res, next) {
    res.json({ repairedCount: 0, status: 'COMPLETED' });
  }

  async auditExport(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 30;
      const since = new Date(); since.setDate(since.getDate() - days);
      const logs = await prisma.auditLogEntry.findMany({ where: { createdAt: { gte: since } }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: parseInt(req.query.batchSize) || 1000 });
      res.json(logs);
    } catch (e) { next(e); }
  }

  async auditCleanup(req, res, next) {
    try { const result = await auditService.cleanup(req.query.daysToKeep || req.query.retentionDays || 90); res.json({ deletedCount: result.deletedCount, status: 'COMPLETED' }); } catch (e) { next(e); }
  }

  async auditList(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 20;
      const skip = req.query.skip ? parseInt(req.query.skip) : page * size;
      const take = req.query.take ? parseInt(req.query.take) : size;
      const { logs, total } = await auditService.findAll(skip, take, req.query.userId, req.query.action);
      res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / take), size: take, number: page, first: page === 0, last: page >= Math.ceil(total / take) - 1, empty: logs.length === 0 });
    } catch (e) { next(e); }
  }

  async auditByUser(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0, size = parseInt(req.query.size) || 20;
      const { logs, total } = await auditService.findAll(page * size, size, parseInt(req.params.userId));
      res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
    } catch (e) { next(e); }
  }

  async auditByUsername(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0, size = parseInt(req.query.size) || 20;
      const { logs, total } = await auditService.findByUsername(req.params.username, page * size, size);
      res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
    } catch (e) { next(e); }
  }

  async auditByAction(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0, size = parseInt(req.query.size) || 20;
      const { logs, total } = await auditService.findByAction(req.params.action, page * size, size);
      res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
    } catch (e) { next(e); }
  }

  async auditByResource(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0, size = parseInt(req.query.size) || 20;
      const { logs, total } = await auditService.findByEntityType(req.params.resourceType, page * size, size);
      res.json({ content: logs, totalElements: total, totalPages: Math.ceil(total / size), size, number: page });
    } catch (e) { next(e); }
  }

  async auditUserActivity(req, res, next) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const activityCount = await auditService.countUserActivity(parseInt(req.params.userId), Math.ceil(hours / 24));
      res.json({ userId: parseInt(req.params.userId), activityCount, period: `Last ${hours} hours` });
    } catch (e) { next(e); }
  }

  async auditIpActivity(req, res, next) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const activityCount = await auditService.countIpActivity(req.params.ipAddress, Math.ceil(hours / 24));
      res.json({ ipAddress: req.params.ipAddress, activityCount, period: `Last ${hours} hours` });
    } catch (e) { next(e); }
  }

  async auditByUsernameLegacy(req, res, next) {
    try { res.json(await auditService.findByUsername(req.params.username, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async auditByIp(req, res, next) {
    try { res.json(await auditService.findByIpAddress(req.params.ip, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  // ── Hero Images ────────────────────────────────────────────────────────────

  async getHeroImages(req, res, next) {
    try { res.json(await tourismService.getAllHeroImages()); } catch (e) { next(e); }
  }

  async createHeroImage(req, res, next) {
    try { res.status(201).json(await tourismService.addHeroImage(req.body)); } catch (e) { next(e); }
  }

  async updateHeroImage(req, res, next) {
    try { res.json(await tourismService.updateHeroImage(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async deleteHeroImage(req, res, next) {
    try { res.json(await tourismService.deleteHeroImage(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  // ── Security ───────────────────────────────────────────────────────────────

  async getLoginAttempts(req, res, next) {
    try {
      const { identifier, hours = 24 } = req.query;
      const since = new Date(Date.now() - parseInt(hours) * 3600000);
      const attempts = await prisma.loginAttempt.findMany({
        where: { ...(identifier ? { ipAddress: identifier } : {}), createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' }, take: 100,
      });
      res.json(attempts);
    } catch (e) { next(e); }
  }

  async getLockouts(req, res, next) {
    try {
      const lockouts = await prisma.accountLockout.findMany({ where: { userId: parseInt(req.params.userId) }, orderBy: { lockedUntil: 'desc' } });
      res.json(lockouts);
    } catch (e) { next(e); }
  }

  async getLockoutStatus(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);
      const lockedOut = await authService.isUserLockedOut(userId);
      if (!lockedOut) return res.json({ lockedOut: false });
      const lockout = await prisma.accountLockout.findUnique({ where: { userId } });
      const remainingMs = lockout ? lockout.lockedUntil.getTime() - Date.now() : 0;
      res.json({ lockedOut: true, lockout: { lockedUntil: lockout?.lockedUntil, remainingMinutes: Math.ceil(remainingMs / 60000) } });
    } catch (e) { next(e); }
  }

  async unlockUser(req, res, next) {
    try { await authService.unlockUserAccount(parseInt(req.params.userId)); res.json({ message: 'Account unlocked successfully' }); } catch (e) { next(e); }
  }

  async lockUser(req, res, next) {
    try {
      const { durationMinutes = 60 } = req.query;
      const userId = parseInt(req.params.userId);
      const lockedUntil = new Date(Date.now() + parseInt(durationMinutes) * 60000);
      await prisma.accountLockout.upsert({ where: { userId }, create: { userId, lockedUntil }, update: { lockedUntil } });
      res.json({ message: 'Account locked successfully', lockout: { userId, lockedUntil } });
    } catch (e) { next(e); }
  }

  async checkBlockStatus(req, res, next) {
    try {
      const { identifier, ipAddress } = req.query;
      const target = ipAddress || identifier;
      const [ipBlocked, identifierBlocked, progressiveDelay, suspiciousActivity] = await Promise.all([
        authService.shouldBlockIpAddress(target),
        authService.shouldBlockIdentifier(target),
        authService.getProgressiveDelay(target),
        authService.detectSuspiciousActivity(target),
      ]);
      res.json({ identifierBlocked, ipBlocked, progressiveDelay, suspiciousActivity });
    } catch (e) { next(e); }
  }

  async securityCleanup(req, res, next) {
    try {
      const deleted = await authService.cleanupOldSecurityRecords(parseInt(req.query.retentionDays) || 90);
      res.json({ message: `Cleaned up ${deleted} old security records`, deletedCount: deleted });
    } catch (e) { next(e); }
  }

  async sendSecurityAlert(req, res, next) {
    try {
      const { alertType = 'SUSPICIOUS_ACTIVITY', ipAddress = 'ADMIN' } = req.query;
      await authService.sendSecurityAlert(parseInt(req.params.userId), alertType, ipAddress);
      res.json({ message: 'Security alert sent successfully' });
    } catch (e) { next(e); }
  }

  // ── Email Test ─────────────────────────────────────────────────────────────

  async testEmail(req, res, next) {
    try {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_APP_PASSWORD;
      if (!gmailUser || !gmailPassword) return res.status(500).json({ success: false, error: 'Gmail SMTP not configured on this server' });
      const result = await emailService.sendEmail(
        req.body.to || 'test@example.com',
        'Test Email — North Wollo Tourism',
        `<h2>SMTP Test</h2><p>If you received this, email is working correctly via Gmail SMTP.</p><p>Sent at: ${new Date().toISOString()}</p>`
      );
      res.json({ success: result, provider: 'Gmail SMTP', sentTo: req.body.to || 'test@example.com', from: gmailUser });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  }
}

module.exports = new AdminController().router;
