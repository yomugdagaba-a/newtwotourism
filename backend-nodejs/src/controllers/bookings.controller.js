const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { CreateBookingDto, UpdateBookingDto } = require('../dto/booking.dto');
const bookingsService = require('../services/bookings.service');

const router = Router();

// Multer setup for receipt uploads
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads', 'receipts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${require('crypto').randomUUID()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
    cb(null, true);
  },
});

// Admin routes (must be before /:id)
router.get('/admin/all', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.getAllAdmin(req.query.page || 0, req.query.size || 20)); } catch (e) { next(e); }
});

router.get('/admin/problems', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.getProblemBookings()); } catch (e) { next(e); }
});

router.post('/admin/:id/resolve', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.resolveBooking(parseInt(req.params.id), req.body.resolution)); } catch (e) { next(e); }
});

// User bookings
router.get('/my', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.getByUser(req.query.userId ? parseInt(req.query.userId) : req.user.userId)); } catch (e) { next(e); }
});

router.get('/hotel/:hotelId', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.getByHotel(parseInt(req.params.hotelId), parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/owner', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.getByOwner(req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId)); } catch (e) { next(e); }
});

// Booking workflow
router.post('/:id/accept', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.acceptRequest(parseInt(req.params.id), req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId)); } catch (e) { next(e); }
});

router.post('/:id/cost', authenticate, async (req, res, next) => {
  try {
    const cost = parseFloat(req.query.cost);
    if (isNaN(cost)) return res.status(400).json({ message: 'Cost must be a valid number' });
    res.json(await bookingsService.proposeCost(parseInt(req.params.id), cost, req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId));
  } catch (e) { next(e); }
});

router.post('/:id/approve', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.approveBooking(parseInt(req.params.id), req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId)); } catch (e) { next(e); }
});

router.post('/:id/reject', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.rejectBooking(parseInt(req.params.id), req.query.reason || req.body.reason, req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId)); } catch (e) { next(e); }
});

router.post('/:id/receipt', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.uploadReceipt(parseInt(req.params.id), req.query.receiptUrl, req.query.userId ? parseInt(req.query.userId) : req.user.userId)); } catch (e) { next(e); }
});

router.post('/:id/receipt/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    res.json(await bookingsService.uploadReceipt(parseInt(req.params.id), receiptUrl, req.query.userId ? parseInt(req.query.userId) : req.user.userId));
  } catch (e) { next(e); }
});

router.post('/:id/problem', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.reportProblem(parseInt(req.params.id), req.body.problem)); } catch (e) { next(e); }
});

router.post('/:id/message', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.sendMessage(parseInt(req.params.id), req.query.userId ? parseInt(req.query.userId) : req.user.userId, req.body.message, false)); } catch (e) { next(e); }
});

router.post('/:id/owner-message', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.sendMessage(parseInt(req.params.id), req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId, req.body.message, true)); } catch (e) { next(e); }
});

router.post('/:id/messages', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.sendMessage(parseInt(req.params.id), req.user.userId, req.body.message, req.body.isFromOwner || false)); } catch (e) { next(e); }
});

// CRUD
router.post('/', authenticate, validate(CreateBookingDto), async (req, res, next) => {
  try { res.status(201).json(await bookingsService.create(req.body, req.query.userId ? parseInt(req.query.userId) : req.user.userId)); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await bookingsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.hotelId, req.query.userId)); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await bookingsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id/status', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.updateStatus(parseInt(req.params.id), req.body.status)); } catch (e) { next(e); }
});

router.put('/:id', authenticate, validate(UpdateBookingDto), async (req, res, next) => {
  try { res.json(await bookingsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { res.json(await bookingsService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
});

module.exports = router;
