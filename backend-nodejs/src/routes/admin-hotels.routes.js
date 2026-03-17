const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const hotels = await prisma.hotel.findMany({ include: { images: true, ratings: true } });
    res.json(hotels);
  } catch (err) { next(err); }
});

router.get('/:id/images', async (req, res, next) => {
  try {
    const images = await prisma.hotelImage.findMany({ where: { hotelId: parseInt(req.params.id) } });
    res.json(images);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: parseInt(req.params.id) }, include: { images: true, ratings: true } });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { images, mainImageUrl, ...data } = req.body;
    const hotel = await prisma.hotel.create({ data });
    const imgs = [];
    if (mainImageUrl?.trim()) imgs.push({ hotelId: hotel.id, imageUrl: mainImageUrl.trim(), displayOrder: 0 });
    if (images?.length) images.forEach((url, i) => { if (url?.trim()) imgs.push({ hotelId: hotel.id, imageUrl: url.trim(), displayOrder: mainImageUrl ? i + 1 : i }); });
    for (const img of imgs) await prisma.hotelImage.create({ data: img });
    res.status(201).json(await prisma.hotel.findUnique({ where: { id: hotel.id }, include: { images: true, ratings: true } }));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { images, mainImageUrl, ...data } = req.body;
    await prisma.hotel.update({ where: { id }, data });
    if (mainImageUrl || images?.length) {
      await prisma.hotelImage.deleteMany({ where: { hotelId: id } });
      const imgs = [];
      if (mainImageUrl?.trim()) imgs.push({ hotelId: id, imageUrl: mainImageUrl.trim(), displayOrder: 0 });
      if (images?.length) images.forEach((url, i) => { if (url?.trim()) imgs.push({ hotelId: id, imageUrl: url.trim(), displayOrder: mainImageUrl ? i + 1 : i }); });
      for (const img of imgs) await prisma.hotelImage.create({ data: img });
    }
    res.json(await prisma.hotel.findUnique({ where: { id }, include: { images: true, ratings: true } }));
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.hotel.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Hotel deleted' });
  } catch (err) { next(err); }
});

router.patch('/:id/active', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const hotel = await prisma.hotel.findUnique({ where: { id } });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(await prisma.hotel.update({ where: { id }, data: { active: !hotel.active } }));
  } catch (err) { next(err); }
});

router.post('/:hotelId/owner/:userId', async (req, res, next) => {
  try {
    res.json(await prisma.hotel.update({ where: { id: parseInt(req.params.hotelId) }, data: { ownerId: parseInt(req.params.userId) } }));
  } catch (err) { next(err); }
});

router.delete('/:hotelId/owner', async (req, res, next) => {
  try {
    res.json(await prisma.hotel.update({ where: { id: parseInt(req.params.hotelId) }, data: { ownerId: null } }));
  } catch (err) { next(err); }
});

router.post('/:hotelId/images', async (req, res, next) => {
  try {
    const image = await prisma.hotelImage.create({ data: { hotelId: parseInt(req.params.hotelId), imageUrl: req.body.imageUrl, displayOrder: req.body.displayOrder || 0 } });
    res.status(201).json(image);
  } catch (err) { next(err); }
});

router.delete('/:hotelId/images/:imageId', async (req, res, next) => {
  try {
    await prisma.hotelImage.delete({ where: { id: parseInt(req.params.imageId) } });
    res.json({ message: 'Image deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
