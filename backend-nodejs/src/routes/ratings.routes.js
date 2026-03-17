const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

async function calcSummary(ratings) {
  if (!ratings.length) return { averageRating: 0, totalRatings: 0, distribution: {} };
  const total = ratings.length;
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / total;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
  return { averageRating: parseFloat(avg.toFixed(2)), totalRatings: total, distribution };
}

// POST /api/ratings/tourism  (body: { tourismPlaceId, rating, comment })
router.post('/tourism', authenticate, async (req, res, next) => {
  try {
    const { tourismPlaceId, rating, comment } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const r = await prisma.tourismRating.upsert({
      where: { tourismPlaceId_userId: { tourismPlaceId, userId: req.user.userId } },
      update: { rating, comment }, create: { tourismPlaceId, userId: req.user.userId, rating, comment },
      include: { user: true },
    });
    res.json(r);
  } catch (err) { next(err); }
});

// POST /api/ratings/tourism/:tourismPlaceId  (body: { rating, comment })
router.post('/tourism/:tourismPlaceId', authenticate, async (req, res, next) => {
  try {
    const tourismPlaceId = parseInt(req.params.tourismPlaceId);
    const { rating, comment } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const r = await prisma.tourismRating.upsert({
      where: { tourismPlaceId_userId: { tourismPlaceId, userId: req.user.userId } },
      update: { rating, comment }, create: { tourismPlaceId, userId: req.user.userId, rating, comment },
      include: { user: true },
    });
    res.json(r);
  } catch (err) { next(err); }
});

// GET /api/ratings/tourism/:tourismPlaceId/summary
router.get('/tourism/:tourismPlaceId/summary', async (req, res, next) => {
  try {
    const tourismPlaceId = parseInt(req.params.tourismPlaceId);
    const ratings = await prisma.tourismRating.findMany({ where: { tourismPlaceId } });
    res.json(await calcSummary(ratings));
  } catch (err) { next(err); }
});

// GET /api/ratings/tourism/:tourismPlaceId
router.get('/tourism/:tourismPlaceId', async (req, res, next) => {
  try {
    const tourismPlaceId = parseInt(req.params.tourismPlaceId);
    const { skip = 0, take = 10 } = req.query;
    const ratings = await prisma.tourismRating.findMany({ where: { tourismPlaceId }, skip: parseInt(skip), take: parseInt(take), include: { user: true } });
    res.json(ratings);
  } catch (err) { next(err); }
});

// POST /api/ratings/hotel  (body: { hotelId, rating, comment })
router.post('/hotel', authenticate, async (req, res, next) => {
  try {
    const { hotelId, rating, comment } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const r = await prisma.hotelRating.upsert({
      where: { hotelId_userId: { hotelId, userId: req.user.userId } },
      update: { rating, comment }, create: { hotelId, userId: req.user.userId, rating, comment },
      include: { user: true },
    });
    res.json(r);
  } catch (err) { next(err); }
});

// POST /api/ratings/hotel/:hotelId  (body: { rating, comment })
router.post('/hotel/:hotelId', authenticate, async (req, res, next) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    const { rating, comment } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const r = await prisma.hotelRating.upsert({
      where: { hotelId_userId: { hotelId, userId: req.user.userId } },
      update: { rating, comment }, create: { hotelId, userId: req.user.userId, rating, comment },
      include: { user: true },
    });
    res.json(r);
  } catch (err) { next(err); }
});

// GET /api/ratings/hotel/:hotelId/summary
router.get('/hotel/:hotelId/summary', async (req, res, next) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    const ratings = await prisma.hotelRating.findMany({ where: { hotelId } });
    res.json(await calcSummary(ratings));
  } catch (err) { next(err); }
});

// GET /api/ratings/hotel/:hotelId
router.get('/hotel/:hotelId', async (req, res, next) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    const { skip = 0, take = 10 } = req.query;
    const ratings = await prisma.hotelRating.findMany({ where: { hotelId }, skip: parseInt(skip), take: parseInt(take), include: { user: true } });
    res.json(ratings);
  } catch (err) { next(err); }
});

module.exports = router;
