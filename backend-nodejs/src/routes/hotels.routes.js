const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/hotels/:id/detail
router.get('/:id/detail', async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: parseInt(req.params.id) }, include: { images: true, ratings: { include: { user: true } }, tourismPlace: true } });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (err) { next(err); }
});

// GET /api/hotels/:id/booking
router.get('/:id/booking', async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: parseInt(req.params.id) }, include: { images: true, tourismPlace: true } });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (err) { next(err); }
});

// GET /api/hotels/owner/:ownerId
router.get('/owner/:ownerId', authenticate, async (req, res, next) => {
  try {
    const hotels = await prisma.hotel.findMany({ where: { ownerId: parseInt(req.params.ownerId) }, include: { images: true, ratings: true } });
    res.json(hotels);
  } catch (err) { next(err); }
});

module.exports = router;
