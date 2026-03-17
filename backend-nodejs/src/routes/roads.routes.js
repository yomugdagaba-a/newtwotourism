const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

function toDto(road) {
  return {
    id: road.id, tourismPlaceId: road.tourismPlaceId, initialPlace: road.name,
    roadType: road.type, description: road.description,
    distanceByCar: road.distanceByCar, distanceByFoot: road.distanceByFoot,
    distanceByHorse: road.distanceByHorse, distanceByPlane: road.distanceByPlane,
    totalDistance: road.totalDistance || road.distance,
    createdAt: road.createdAt, updatedAt: road.updatedAt,
  };
}

// GET /api/roads
router.get('/', async (req, res, next) => {
  try {
    const { skip = 0, take = 10, tourismPlaceId } = req.query;
    const where = tourismPlaceId ? { tourismPlaceId: parseInt(tourismPlaceId) } : {};
    const [roads, total] = await Promise.all([
      prisma.roadInfo.findMany({ where, skip: parseInt(skip), take: parseInt(take) }),
      prisma.roadInfo.count({ where }),
    ]);
    res.json({ roads: roads.map(toDto), total });
  } catch (err) { next(err); }
});

// GET /api/roads/:id/horse-services
router.get('/:roadId/horse-services', async (req, res, next) => {
  try {
    const services = await prisma.horseService.findMany({ where: { roadInfoId: parseInt(req.params.roadId) } });
    res.json(services);
  } catch (err) { next(err); }
});

// GET /api/roads/:id
router.get('/:id', async (req, res, next) => {
  try {
    const road = await prisma.roadInfo.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!road) return res.status(404).json({ message: 'Road not found' });
    res.json(toDto(road));
  } catch (err) { next(err); }
});

// POST /api/roads
router.post('/', authenticate, async (req, res, next) => {
  try {
    const road = await prisma.roadInfo.create({ data: req.body });
    res.status(201).json(toDto(road));
  } catch (err) { next(err); }
});

// PUT /api/roads/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const road = await prisma.roadInfo.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(toDto(road));
  } catch (err) { next(err); }
});

// DELETE /api/roads/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.roadInfo.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Road deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
