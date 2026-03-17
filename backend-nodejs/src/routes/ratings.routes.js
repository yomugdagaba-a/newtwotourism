const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/tourism', authenticate, async (req, res, next) => {
  try {
    const { tourismPlaceId, rating, comment } = req.body;
    const userId = req.user.userId;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const r = await prisma.tourismRating.upsert({
      where: { tourismPlaceId_userId: { tourismPlaceId, userId } },
      update: { rating, comment }, create: { tourismPlaceId, userId, rating, comment },
      include: { user: true },
    });
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/tourism/:tourismId', async (req, res, next) => {
  try {
    const tourismPlaceId = parseInt(req.params.tourismId);
    const [ratings, total] = await Promise.all([
      prisma.tourismRating.findMany({ where: { tourismPlaceId }, include: { user: true } }),
      prisma.tourismRating.count({ where: { tourismPlaceId } }),
    ]);
    res.json({ ratings, total });
  } catch (err) { next(err); }
});

router.post('/hotel', authenticate, async (req, res, next) => {
  try {
    const { hotelId, rating, comment } = req.body;
    const userId = req.user.userId;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const r = await prisma.hotelRating.upsert({
      where: { hotelId_userId: { hotelId, userId } },
      update: { rating, comment }, create: { hotelId, userId, rating, comment },
      include: { user: true },
    });
    res.json(r);
  } catch (err) { next(err); }
});

router.get('/hotel/:hotelId', async (req, res, next) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    const [ratings, total] = await Promise.all([
      prisma.hotelRating.findMany({ where: { hotelId }, include: { user: true } }),
      prisma.hotelRating.count({ where: { hotelId } }),
    ]);
    res.json({ ratings, total });
  } catch (err) { next(err); }
});

module.exports = router;
