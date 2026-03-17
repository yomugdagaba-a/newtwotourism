const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

const INCLUDE = { images: true, ratings: { include: { user: true } }, tourismPlace: true, bookings: true };

// GET /api/hotels/search
router.get('/search', async (req, res, next) => {
  try {
    const { q = '', skip = 0, take = 10 } = req.query;
    const where = { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] };
    const [hotels, total] = await Promise.all([prisma.hotel.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: { images: true, ratings: true } }), prisma.hotel.count({ where })]);
    res.json({ hotels, total });
  } catch (err) { next(err); }
});

// GET /api/hotels/owner/my-hotels
router.get('/owner/my-hotels', authenticate, async (req, res, next) => {
  try {
    const { skip = 0, take = 10 } = req.query;
    const [hotels, total] = await Promise.all([prisma.hotel.findMany({ where: { ownerId: req.user.userId }, skip: parseInt(skip), take: parseInt(take), include: { images: true, ratings: true } }), prisma.hotel.count({ where: { ownerId: req.user.userId } })]);
    res.json({ hotels, total });
  } catch (err) { next(err); }
});

// GET /api/hotels/owner/:ownerId
router.get('/owner/:ownerId', authenticate, async (req, res, next) => {
  try {
    const { skip = 0, take = 10 } = req.query;
    const [hotels, total] = await Promise.all([prisma.hotel.findMany({ where: { ownerId: parseInt(req.params.ownerId) }, skip: parseInt(skip), take: parseInt(take), include: { images: true, ratings: true } }), prisma.hotel.count({ where: { ownerId: parseInt(req.params.ownerId) } })]);
    res.json(hotels);
  } catch (err) { next(err); }
});

// GET /api/hotels/:id/detail
router.get('/:id/detail', async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: parseInt(req.params.id) }, include: INCLUDE });
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

// GET /api/hotels/:id/ratings/me
router.get('/:id/ratings/me', authenticate, async (req, res, next) => {
  try {
    const rating = await prisma.hotelRating.findFirst({ where: { hotelId: parseInt(req.params.id), userId: req.user.userId } });
    res.json({ hasRated: !!rating, rating });
  } catch (err) { next(err); }
});

// GET /api/hotels/:id/images
router.get('/:id/images', async (req, res, next) => {
  try {
    const images = await prisma.hotelImage.findMany({ where: { hotelId: parseInt(req.params.id) } });
    res.json(images);
  } catch (err) { next(err); }
});

// POST /api/hotels/:id/images
router.post('/:id/images', authenticate, async (req, res, next) => {
  try {
    const image = await prisma.hotelImage.create({ data: { hotelId: parseInt(req.params.id), imageUrl: req.body.imageUrl } });
    res.status(201).json(image);
  } catch (err) { next(err); }
});

// DELETE /api/hotels/images/:imageId
router.delete('/images/:imageId', authenticate, async (req, res, next) => {
  try {
    await prisma.hotelImage.delete({ where: { id: parseInt(req.params.imageId) } });
    res.json({ message: 'Image deleted' });
  } catch (err) { next(err); }
});

// GET /api/hotels
router.get('/', async (req, res, next) => {
  try {
    const { skip = 0, take = 10, tourismPlaceId } = req.query;
    const where = tourismPlaceId ? { tourismPlaceId: parseInt(tourismPlaceId) } : {};
    const [hotels, total] = await Promise.all([prisma.hotel.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: { images: true, ratings: true } }), prisma.hotel.count({ where })]);
    res.json({ hotels, total });
  } catch (err) { next(err); }
});

// POST /api/hotels
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { images, mainImageUrl, ...data } = req.body;
    const hotel = await prisma.hotel.create({ data: { ...data, ownerId: req.user.userId }, include: { images: true } });
    const imagesToCreate = [];
    if (mainImageUrl?.trim()) imagesToCreate.push({ hotelId: hotel.id, imageUrl: mainImageUrl.trim(), displayOrder: 0 });
    if (images?.length) images.forEach((url, i) => { if (url?.trim()) imagesToCreate.push({ hotelId: hotel.id, imageUrl: url.trim(), displayOrder: mainImageUrl ? i + 1 : i }); });
    for (const img of imagesToCreate) await prisma.hotelImage.create({ data: img });
    res.status(201).json(await prisma.hotel.findUnique({ where: { id: hotel.id }, include: { images: true, ratings: true } }));
  } catch (err) { next(err); }
});

// GET /api/hotels/:id
router.get('/:id', async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: parseInt(req.params.id) }, include: INCLUDE });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (err) { next(err); }
});

// PUT /api/hotels/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { images, mainImageUrl, ...data } = req.body;
    await prisma.hotel.update({ where: { id }, data });
    if (mainImageUrl || images?.length) {
      await prisma.hotelImage.deleteMany({ where: { hotelId: id } });
      const imagesToCreate = [];
      if (mainImageUrl?.trim()) imagesToCreate.push({ hotelId: id, imageUrl: mainImageUrl.trim(), displayOrder: 0 });
      if (images?.length) images.forEach((url, i) => { if (url?.trim()) imagesToCreate.push({ hotelId: id, imageUrl: url.trim(), displayOrder: mainImageUrl ? i + 1 : i }); });
      for (const img of imagesToCreate) await prisma.hotelImage.create({ data: img });
    }
    res.json(await prisma.hotel.findUnique({ where: { id }, include: { images: true, ratings: true } }));
  } catch (err) { next(err); }
});

// DELETE /api/hotels/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.hotel.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Hotel deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
