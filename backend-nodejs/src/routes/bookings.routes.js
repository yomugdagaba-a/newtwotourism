const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');
const emailService = require('../services/email.service');

const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads', 'receipts');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})});

const INCLUDE = { hotel: true, user: true, status: true, messages: { include: { user: true } } };

function transform(b) {
  if (!b) return b;
  return {
    ...b, bookingId: b.id, bookingStatus: b.status?.name || 'UNKNOWN',
    totalCost: b.totalCost ? parseFloat(b.totalCost.toString()) : null,
    hotel: { id: b.hotel?.id, name: b.hotel?.name, contactInfo: b.hotel?.contactInfo, active: b.hotel?.active },
    client: { id: b.user?.id, fullName: b.user?.fullName, username: b.user?.username, email: b.user?.email, phone: b.clientPhone },
    messages: (b.messages || []).map(m => ({ id: m.id, senderId: m.userId, senderName: m.user?.fullName || m.user?.username || 'Unknown', message: m.message, messageType: m.isFromOwner ? 'OWNER' : 'GENERAL', createdAt: m.createdAt })),
  };
}

async function getOrCreateStatus(name) {
  let s = await prisma.bookingStatusEntity.findUnique({ where: { name } });
  if (!s) s = await prisma.bookingStatusEntity.create({ data: { name } });
  return s;
}

async function addMsg(bookingId, userId, message, isFromOwner) {
  await prisma.bookingMessage.create({ data: { bookingId, userId, message, isFromOwner } });
  return prisma.hotelBooking.findUnique({ where: { id: bookingId }, include: INCLUDE });
}

// POST /api/bookings
router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = parseInt(req.query.userId) || req.user.userId;
    const status = await getOrCreateStatus('REQUESTED');
    const booking = await prisma.hotelBooking.create({ data: { ...req.body, userId, statusId: status.id }, include: INCLUDE });
    res.status(201).json(transform(booking));
  } catch (err) { next(err); }
});

// GET /api/bookings/my
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const userId = parseInt(req.query.userId) || req.user.userId;
    const bookings = await prisma.hotelBooking.findMany({ where: { userId }, include: INCLUDE });
    res.json(bookings.map(transform));
  } catch (err) { next(err); }
});

// GET /api/bookings/admin/all
router.get('/admin/all', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0, size = parseInt(req.query.size) || 20;
    const [bookings, total] = await Promise.all([prisma.hotelBooking.findMany({ skip: page * size, take: size, include: INCLUDE }), prisma.hotelBooking.count()]);
    res.json({ content: bookings.map(transform), totalElements: total, totalPages: Math.ceil(total / size) });
  } catch (err) { next(err); }
});

// GET /api/bookings/admin/problems
router.get('/admin/problems', authenticate, async (req, res, next) => {
  try {
    const bookings = await prisma.hotelBooking.findMany({ where: { problemReported: true }, include: INCLUDE });
    res.json(bookings.map(transform));
  } catch (err) { next(err); }
});

// POST /api/bookings/admin/:id/resolve
router.post('/admin/:id/resolve', authenticate, async (req, res, next) => {
  try {
    const booking = await prisma.hotelBooking.update({ where: { id: parseInt(req.params.id) }, data: { problemReport: req.body.resolution }, include: INCLUDE });
    res.json(transform(booking));
  } catch (err) { next(err); }
});

// GET /api/bookings/owner
router.get('/owner', authenticate, async (req, res, next) => {
  try {
    const ownerId = parseInt(req.query.ownerId) || req.user.userId;
    const bookings = await prisma.hotelBooking.findMany({ where: { hotel: { ownerId } }, include: INCLUDE });
    res.json(bookings.map(transform));
  } catch (err) { next(err); }
});

// GET /api/bookings/hotel/:hotelId
router.get('/hotel/:hotelId', authenticate, async (req, res, next) => {
  try {
    const bookings = await prisma.hotelBooking.findMany({ where: { hotelId: parseInt(req.params.hotelId) }, include: INCLUDE });
    res.json(bookings.map(transform));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/accept
router.post('/:id/accept', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id), ownerId = parseInt(req.query.ownerId);
    const booking = await prisma.hotelBooking.findUnique({ where: { id }, include: { hotel: true, user: true } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.hotel.ownerId !== ownerId) return res.status(403).json({ message: 'Not authorized' });
    const status = await getOrCreateStatus('OWNER_ACCEPTED');
    const updated = await prisma.hotelBooking.update({ where: { id }, data: { statusId: status.id }, include: INCLUDE });
    await addMsg(id, ownerId, 'Request accepted', true);
    try { if (booking.user.email) await emailService.sendBookingAcceptedNotification(booking.user.email, booking.hotel.name, id); } catch (e) {}
    res.json(transform(updated));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/cost
router.post('/:id/cost', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id), ownerId = parseInt(req.query.ownerId), cost = parseFloat(req.query.cost);
    const booking = await prisma.hotelBooking.findUnique({ where: { id }, include: { hotel: true, user: true } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.hotel.ownerId !== ownerId) return res.status(403).json({ message: 'Not authorized' });
    const status = await getOrCreateStatus('COST_PROPOSED');
    const updated = await prisma.hotelBooking.update({ where: { id }, data: { totalCost: cost, statusId: status.id }, include: INCLUDE });
    await addMsg(id, ownerId, `Cost proposed: ${cost} ETB`, true);
    try { if (booking.user.email) await emailService.sendCostProposedNotification(booking.user.email, booking.hotel.name, cost, id); } catch (e) {}
    res.json(transform(updated));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/approve
router.post('/:id/approve', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id), ownerId = parseInt(req.query.ownerId);
    const booking = await prisma.hotelBooking.findUnique({ where: { id }, include: { hotel: true, user: true } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.hotel.ownerId !== ownerId) return res.status(403).json({ message: 'Not authorized' });
    const status = await getOrCreateStatus('APPROVED');
    const updated = await prisma.hotelBooking.update({ where: { id }, data: { statusId: status.id }, include: INCLUDE });
    await addMsg(id, ownerId, 'Booking approved', true);
    try { if (booking.user.email) await emailService.sendBookingApprovedNotification(booking.user.email, booking.hotel.name, id); } catch (e) {}
    res.json(transform(updated));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/reject
router.post('/:id/reject', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id), ownerId = parseInt(req.query.ownerId), reason = req.query.reason || '';
    const booking = await prisma.hotelBooking.findUnique({ where: { id }, include: { hotel: true, user: true } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.hotel.ownerId !== ownerId) return res.status(403).json({ message: 'Not authorized' });
    const status = await getOrCreateStatus('REJECTED');
    const updated = await prisma.hotelBooking.update({ where: { id }, data: { statusId: status.id, rejectionReason: reason }, include: INCLUDE });
    await addMsg(id, ownerId, `Rejected: ${reason}`, true);
    try { if (booking.user.email) await emailService.sendBookingRejectedNotification(booking.user.email, booking.hotel.name, reason, id); } catch (e) {}
    res.json(transform(updated));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/receipt
router.post('/:id/receipt', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id), userId = parseInt(req.query.userId), receiptUrl = req.query.receiptUrl;
    const status = await getOrCreateStatus('PAID');
    const updated = await prisma.hotelBooking.update({ where: { id }, data: { receiptImageUrl: receiptUrl, statusId: status.id }, include: INCLUDE });
    await addMsg(id, userId, 'Receipt uploaded', false);
    res.json(transform(updated));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/receipt/upload
router.post('/:id/receipt/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    const id = parseInt(req.params.id), userId = parseInt(req.query.userId);
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    const status = await getOrCreateStatus('PAID');
    const updated = await prisma.hotelBooking.update({ where: { id }, data: { receiptImageUrl: receiptUrl, statusId: status.id }, include: INCLUDE });
    await addMsg(id, userId, 'Receipt uploaded', false);
    res.json(transform(updated));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/problem
router.post('/:id/problem', authenticate, async (req, res, next) => {
  try {
    const updated = await prisma.hotelBooking.update({ where: { id: parseInt(req.params.id) }, data: { problemReport: req.body.problem, problemReported: true }, include: INCLUDE });
    res.json(transform(updated));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/message
router.post('/:id/message', authenticate, async (req, res, next) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId) : req.user.userId;
    const booking = await addMsg(parseInt(req.params.id), userId, req.body.message, false);
    res.json(transform(booking));
  } catch (err) { next(err); }
});

// POST /api/bookings/:id/owner-message
router.post('/:id/owner-message', authenticate, async (req, res, next) => {
  try {
    const ownerId = req.query.ownerId ? parseInt(req.query.ownerId) : req.user.userId;
    const booking = await addMsg(parseInt(req.params.id), ownerId, req.body.message, true);
    res.json(transform(booking));
  } catch (err) { next(err); }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await prisma.hotelBooking.findUnique({ where: { id: parseInt(req.params.id) }, include: INCLUDE });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(transform(booking));
  } catch (err) { next(err); }
});

module.exports = router;
