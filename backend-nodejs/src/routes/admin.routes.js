const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const skip = parseInt(req.query.skip) || page * size;
    const take = parseInt(req.query.take) || size;
    const search = req.query.search;
    const where = search ? { OR: [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ]} : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, include: { roles: true }, orderBy: { id: 'asc' } }),
      prisma.user.count({ where }),
    ]);
    res.json({ content: users, totalElements: total, totalPages: Math.ceil(total / take), size: take, number: Math.floor(skip / take) });
  } catch (err) { next(err); }
});

// GET /api/admin/users/role/:role
router.get('/users/role/:role', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { roles: { some: { name: req.params.role.toUpperCase() } } }, include: { roles: true } });
    res.json(users);
  } catch (err) { next(err); }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) }, include: { roles: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const updated = await prisma.user.update({ where: { id }, data: req.body, include: { roles: true } });
    res.json(updated);
  } catch (err) { next(err); }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({ where: { id }, data: { passwordHash }, include: { roles: true } });
    res.json(user);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/activate
router.patch('/users/:id/activate', async (req, res, next) => {
  try {
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { active: true }, include: { roles: true } });
    res.json(user);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/deactivate
router.patch('/users/:id/deactivate', async (req, res, next) => {
  try {
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { active: false }, include: { roles: true } });
    res.json(user);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

// POST /api/admin/users/:userId/roles/:role
router.post('/users/:userId/roles/:role', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const roleName = req.params.role.toUpperCase();
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.roles.some(r => r.name === roleName)) return res.status(400).json({ message: `User already has role ${roleName}` });
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) role = await prisma.role.create({ data: { name: roleName } });
    const updated = await prisma.user.update({ where: { id: userId }, data: { roles: { connect: { id: role.id } } }, include: { roles: true } });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:userId/roles/:role
router.delete('/users/:userId/roles/:role', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const roleName = req.params.role.toUpperCase();
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return res.status(404).json({ message: `Role ${roleName} not found` });
    const updated = await prisma.user.update({ where: { id: userId }, data: { roles: { disconnect: { id: role.id } } }, include: { roles: true } });
    res.json(updated);
  } catch (err) { next(err); }
});

// POST /api/admin/hotels/:hotelId/owner/:userId
router.post('/hotels/:hotelId/owner/:userId', async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.update({ where: { id: parseInt(req.params.hotelId) }, data: { ownerId: parseInt(req.params.userId) }, include: { images: true } });
    res.json(hotel);
  } catch (err) { next(err); }
});

// DELETE /api/admin/hotels/:hotelId/owner
router.delete('/hotels/:hotelId/owner', async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.update({ where: { id: parseInt(req.params.hotelId) }, data: { ownerId: null }, include: { images: true } });
    res.json(hotel);
  } catch (err) { next(err); }
});

// PATCH /api/admin/hotels/:hotelId/active
router.patch('/hotels/:hotelId/active', async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: parseInt(req.params.hotelId) } });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    const updated = await prisma.hotel.update({ where: { id: hotel.id }, data: { active: !hotel.active }, include: { images: true } });
    res.json(updated);
  } catch (err) { next(err); }
});

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalHotels, totalBookings, totalTourismPlaces] = await Promise.all([
      prisma.user.count(), prisma.hotel.count(), prisma.hotelBooking.count(), prisma.tourismPlace.count(),
    ]);
    res.json({ totalUsers, totalHotels, totalBookings, totalTourismPlaces });
  } catch (err) { next(err); }
});

// GET /api/admin/bookings/recent
router.get('/bookings/recent', async (req, res, next) => {
  try {
    const take = parseInt(req.query.take) || 10;
    const bookings = await prisma.hotelBooking.findMany({ take, orderBy: { createdAt: 'desc' }, include: { hotel: true, user: true, status: true } });
    res.json(bookings);
  } catch (err) { next(err); }
});

// GET /api/admin/bookings/by-status
router.get('/bookings/by-status', async (req, res, next) => {
  try {
    const statuses = await prisma.bookingStatusEntity.findMany({ include: { bookings: true } });
    res.json(statuses.map(s => ({ status: s.name, count: s.bookings.length })));
  } catch (err) { next(err); }
});

module.exports = router;
