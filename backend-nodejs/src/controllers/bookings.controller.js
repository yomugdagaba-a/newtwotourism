const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { CreateBookingDto, UpdateBookingDto } = require('../dto/booking.dto');
const bookingsService = require('../services/bookings.service');
const { bookingCreationLimiter, fileUploadLimiter } = require('../middleware/rate-limit.middleware');

class BookingsController {
  constructor() {
    this.router = Router();
    this._upload = this._createUploader();
    this._registerRoutes();
  }

  _createUploader() {
    // Always use memory storage for Supabase compatibility
    const storage = multer.memoryStorage();
    
    const ALLOWED = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
    return multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
        if (!ALLOWED.includes(ext)) return cb(new Error(`File type not allowed. Allowed: ${ALLOWED.join(', ')}`));
        cb(null, true);
      },
    });
  }

  _registerRoutes() {
    // Admin routes — must be before /:id
    this.router.get('/admin/all', authenticate, this.getAllAdmin.bind(this));
    this.router.get('/admin/problems', authenticate, this.getProblemBookings.bind(this));
    this.router.post('/admin/:id/resolve', authenticate, this.resolveBooking.bind(this));

    // User-scoped queries
    this.router.get('/my', authenticate, this.getMyBookings.bind(this));
    this.router.get('/hotel/:hotelId', authenticate, this.getByHotel.bind(this));
    this.router.get('/owner', authenticate, this.getByOwner.bind(this));

    // Workflow actions
    this.router.post('/:id/accept', authenticate, this.acceptRequest.bind(this));
    this.router.post('/:id/cost', authenticate, this.proposeCost.bind(this));
    this.router.post('/:id/approve', authenticate, this.approveBooking.bind(this));
    this.router.post('/:id/reject', authenticate, this.rejectBooking.bind(this));
    this.router.post('/:id/receipt', authenticate, this.uploadReceiptUrl.bind(this));
    this.router.post('/:id/receipt/upload', authenticate, fileUploadLimiter, this._upload.single('file'), this.uploadReceiptFile.bind(this));
    this.router.post('/:id/problem', authenticate, this.reportProblem.bind(this));
    this.router.post('/:id/hide', authenticate, this.hideFromClient.bind(this));
    this.router.post('/:id/message', authenticate, this.sendMessage.bind(this));
    this.router.post('/:id/owner-message', authenticate, this.sendOwnerMessage.bind(this));
    this.router.post('/:id/messages', authenticate, this.sendMessageGeneric.bind(this));

    // CRUD
    this.router.post('/', authenticate, bookingCreationLimiter, validate(CreateBookingDto), this.create.bind(this));
    this.router.get('/', this.findAll.bind(this));
    this.router.get('/:id', this.findById.bind(this));
    this.router.put('/:id/status', authenticate, this.updateStatus.bind(this));
    this.router.put('/:id', authenticate, validate(UpdateBookingDto), this.update.bind(this));
    this.router.delete('/:id', authenticate, this.remove.bind(this));
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async getAllAdmin(req, res, next) {
    try { res.json(await bookingsService.getAllAdmin(req.query.page || 0, req.query.size || 20)); } catch (e) { next(e); }
  }

  async getProblemBookings(req, res, next) {
    try { res.json(await bookingsService.getProblemBookings()); } catch (e) { next(e); }
  }

  async resolveBooking(req, res, next) {
    try { res.json(await bookingsService.resolveBooking(parseInt(req.params.id), req.body.resolution)); } catch (e) { next(e); }
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  async getMyBookings(req, res, next) {
    try { res.json(await bookingsService.getByUser(req.query.userId ? parseInt(req.query.userId) : req.user.userId)); } catch (e) { next(e); }
  }

  async getByHotel(req, res, next) {
    try { res.json(await bookingsService.getByHotel(parseInt(req.params.hotelId), parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async getByOwner(req, res, next) {
    try { res.json(await bookingsService.getByOwner(req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId)); } catch (e) { next(e); }
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(req, res, next) {
    try { res.status(201).json(await bookingsService.create(req.body, req.query.userId ? parseInt(req.query.userId) : req.user.userId)); } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await bookingsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.hotelId, req.query.userId)); } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await bookingsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try { res.json(await bookingsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async updateStatus(req, res, next) {
    try { res.json(await bookingsService.updateStatus(parseInt(req.params.id), req.body.status)); } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try { res.json(await bookingsService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  // ── Workflow ───────────────────────────────────────────────────────────────

  async acceptRequest(req, res, next) {
    try { res.json(await bookingsService.acceptRequest(parseInt(req.params.id), req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId)); } catch (e) { next(e); }
  }

  async proposeCost(req, res, next) {
    try {
      const cost = parseFloat(req.query.cost);
      if (isNaN(cost) || cost <= 0) return res.status(400).json({ message: 'Cost must be a positive number' });
      res.json(await bookingsService.proposeCost(parseInt(req.params.id), cost, req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId));
    } catch (e) { next(e); }
  }

  async approveBooking(req, res, next) {
    try { res.json(await bookingsService.approveBooking(parseInt(req.params.id), req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId)); } catch (e) { next(e); }
  }

  async rejectBooking(req, res, next) {
    try { res.json(await bookingsService.rejectBooking(parseInt(req.params.id), req.query.reason || req.body.reason, req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId)); } catch (e) { next(e); }
  }

  async uploadReceiptUrl(req, res, next) {
    try { res.json(await bookingsService.uploadReceipt(parseInt(req.params.id), req.query.receiptUrl, req.query.userId ? parseInt(req.query.userId) : req.user.userId)); } catch (e) { next(e); }
  }

  async uploadReceiptFile(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file provided' });
      
      // Try Supabase Storage first, fall back to local storage
      const supabaseStorage = require('../services/supabase-storage.service');
      let receiptUrl;
      
      if (supabaseStorage.isConfigured()) {
        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${req.file.originalname}`;
        receiptUrl = await supabaseStorage.uploadFile(
          req.file.buffer,
          fileName,
          'receipts',
          req.file.mimetype
        );
        console.log('✓ Uploaded receipt to Supabase Storage:', receiptUrl);
      } else {
        // Fall back to local storage (won't work on Leapcell)
        const backendUrl = process.env.BACKEND_URL || process.env.API_URL || '';
        receiptUrl = backendUrl 
          ? `${backendUrl}/uploads/receipts/${req.file.filename}`
          : `/uploads/receipts/${req.file.filename}`;
        console.warn('⚠️  Using local storage for receipt (Supabase not configured)');
      }
      
      res.json(await bookingsService.uploadReceipt(parseInt(req.params.id), receiptUrl, req.query.userId ? parseInt(req.query.userId) : req.user.userId));
    } catch (e) { next(e); }
  }

  async reportProblem(req, res, next) {
    try { res.json(await bookingsService.reportProblem(parseInt(req.params.id), req.body.problem)); } catch (e) { next(e); }
  }

  async hideFromClient(req, res, next) {
    try { res.json(await bookingsService.hideFromClient(parseInt(req.params.id), req.query.userId ? parseInt(req.query.userId) : req.user.userId)); } catch (e) { next(e); }
  }

  async sendMessage(req, res, next) {
    try { res.json(await bookingsService.sendMessage(parseInt(req.params.id), req.query.userId ? parseInt(req.query.userId) : req.user.userId, req.body.message, false)); } catch (e) { next(e); }
  }

  async sendOwnerMessage(req, res, next) {
    try { res.json(await bookingsService.sendMessage(parseInt(req.params.id), req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId, req.body.message, true)); } catch (e) { next(e); }
  }

  async sendMessageGeneric(req, res, next) {
    try { res.json(await bookingsService.sendMessage(parseInt(req.params.id), req.user.userId, req.body.message, req.body.isFromOwner || false)); } catch (e) { next(e); }
  }
}

module.exports = new BookingsController().router;
