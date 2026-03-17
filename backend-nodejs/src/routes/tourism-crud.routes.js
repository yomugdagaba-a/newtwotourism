// /api/tourism — authenticated CRUD (mirrors NestJS TourismController at /api/tourism)
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/tourism/search
router.get('/search', async (req, res, next) => {
  try {
    const { q = '', category, skip = 0, take = 10 } = req.query;
    const where = {
      AND: [
        q.trim() ? { OR: [{ name: { contains: q.trim(), mode: 'insensitive' } }, { description: { contains: q.trim(), mode: 'insensitive' } }] } : {},
        category ? { categories: { has: category.toUpperCase() } } : {},
      ],
    };
    const [places, total] = await Promise.all([
      prisma.tourismPlace.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: { images: true, ratings: true } }),
      prisma.tourismPlace.count({ where }),
    ]);
    res.json({ places, total });
  } catch (err) { next(err); }
});

// GET /api/tourism
router.get('/', async (req, res, next) => {
  try {
    const { skip = 0, take = 10, category } = req.query;
    const where = category ? { categories: { has: category.toUpperCase() } } : {};
    const [places, total] = await Promise.all([
      prisma.tourismPlace.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: { images: true, ratings: true } }),
      prisma.tourismPlace.count({ where }),
    ]);
    res.json({ places, total });
  } catch (err) { next(err); }
});

// GET /api/tourism/:id
router.get('/:id', async (req, res, next) => {
  try {
    const place = await prisma.tourismPlace.findUnique({ where: { id: parseInt(req.params.id) }, include: { images: true, ratings: { include: { user: true } }, hotels: true, roadInfos: true } });
    if (!place) return res.status(404).json({ message: 'Tourism place not found' });
    res.json(place);
  } catch (err) { next(err); }
});

// POST /api/tourism
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { images, ...data } = req.body;
    const place = await prisma.tourismPlace.create({ data, include: { images: true, ratings: true } });
    res.status(201).json(place);
  } catch (err) { next(err); }
});

// PUT /api/tourism/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { images, ...data } = req.body;
    const place = await prisma.tourismPlace.update({ where: { id: parseInt(req.params.id) }, data, include: { images: true, ratings: true } });
    res.json(place);
  } catch (err) { next(err); }
});

// DELETE /api/tourism/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.tourismPlace.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// POST /api/tourism/:id/images
router.post('/:id/images', authenticate, async (req, res, next) => {
  try {
    const image = await prisma.tourismImage.create({ data: { tourismPlaceId: parseInt(req.params.id), imageUrl: req.body.imageUrl } });
    res.status(201).json(image);
  } catch (err) { next(err); }
});

// DELETE /api/tourism/images/:imageId
router.delete('/images/:imageId', authenticate, async (req, res, next) => {
  try {
    await prisma.tourismImage.delete({ where: { id: parseInt(req.params.imageId) } });
    res.json({ message: 'Image deleted' });
  } catch (err) { next(err); }
});

// GET /api/user/tourism/:id/detail  and  GET /api/user/tourism/:id/details
router.get('/user/tourism/:id/detail', async (req, res, next) => {
  try {
    const place = await prisma.tourismPlace.findUnique({ where: { id: parseInt(req.params.id) }, include: { images: true, ratings: { include: { user: true } }, hotels: true, roadInfos: true } });
    if (!place) return res.status(404).json({ message: 'Tourism place not found' });
    res.json(place);
  } catch (err) { next(err); }
});

module.exports = router;
