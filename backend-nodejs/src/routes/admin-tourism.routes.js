const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/admin/tourism/list
router.get('/list', async (req, res, next) => {
  try {
    const places = await prisma.tourismPlace.findMany({ include: { images: true } });
    res.json(places);
  } catch (err) { next(err); }
});

// GET /api/admin/tourism/all
router.get('/all', async (req, res, next) => {
  try {
    const places = await prisma.tourismPlace.findMany({ include: { images: true, ratings: true, hotels: true } });
    res.json(places);
  } catch (err) { next(err); }
});

// POST /api/admin/tourism
router.post('/', async (req, res, next) => {
  try {
    const { images, ...data } = req.body;
    if (data.visitTime) data.visitTime = parseInt(data.visitTime);
    const place = await prisma.tourismPlace.create({ data, include: { images: true, ratings: true } });
    res.status(201).json(place);
  } catch (err) { next(err); }
});

// PUT /api/admin/tourism/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { images, ...data } = req.body;
    const place = await prisma.tourismPlace.update({ where: { id: parseInt(req.params.id) }, data, include: { images: true, ratings: true } });
    res.json(place);
  } catch (err) { next(err); }
});

// DELETE /api/admin/tourism/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.tourismPlace.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// GET /api/admin/tourism/:tourismId/images
router.get('/:tourismId/images', async (req, res, next) => {
  try {
    const images = await prisma.tourismImage.findMany({ where: { tourismPlaceId: parseInt(req.params.tourismId) } });
    res.json(images);
  } catch (err) { next(err); }
});

// POST /api/admin/tourism/:tourismId/images
router.post('/:tourismId/images', async (req, res, next) => {
  try {
    const image = await prisma.tourismImage.create({ data: { tourismPlaceId: parseInt(req.params.tourismId), imageUrl: req.body.imageUrl, displayOrder: req.body.displayOrder || 0 } });
    res.status(201).json(image);
  } catch (err) { next(err); }
});

// PUT /api/admin/tourism/:tourismId/images/:imageId
router.put('/:tourismId/images/:imageId', async (req, res, next) => {
  try {
    const image = await prisma.tourismImage.update({ where: { id: parseInt(req.params.imageId) }, data: req.body });
    res.json(image);
  } catch (err) { next(err); }
});

// DELETE /api/admin/tourism/:tourismId/images/:imageId
router.delete('/:tourismId/images/:imageId', async (req, res, next) => {
  try {
    await prisma.tourismImage.delete({ where: { id: parseInt(req.params.imageId) } });
    res.json({ message: 'Image deleted' });
  } catch (err) { next(err); }
});

// PUT /api/admin/tourism/:tourismId/images/:imageId/set-main
router.put('/:tourismId/images/:imageId/set-main', async (req, res, next) => {
  try {
    const tourismPlaceId = parseInt(req.params.tourismId);
    await prisma.tourismImage.updateMany({ where: { tourismPlaceId }, data: { displayOrder: 1 } });
    const image = await prisma.tourismImage.update({ where: { id: parseInt(req.params.imageId) }, data: { displayOrder: 0 } });
    res.json(image);
  } catch (err) { next(err); }
});

// PUT /api/admin/tourism/:tourismId/images/reorder
router.put('/:tourismId/images/reorder', async (req, res, next) => {
  try {
    const { imageIds } = req.body;
    await Promise.all(imageIds.map((id, index) => prisma.tourismImage.update({ where: { id }, data: { displayOrder: index } })));
    res.json({ message: 'Reordered' });
  } catch (err) { next(err); }
});

module.exports = router;
