const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

function toDto(road) {
  let d = {};
  if (road.condition) { try { d = JSON.parse(road.condition); } catch (e) {} }
  return { id: road.id, tourismPlaceId: road.tourismPlaceId, initialPlace: road.name, roadType: road.type, description: road.description,
    distanceByCar: d.distanceByCar, distanceByFoot: d.distanceByFoot, distanceByHorse: d.distanceByHorse, distanceByPlane: d.distanceByPlane, totalDistance: d.totalDistance };
}

function buildData(body, existing) {
  const d = existing ? JSON.parse(existing.condition || '{}') : {};
  const merged = { distanceByCar: body.distanceByCar ?? d.distanceByCar, distanceByFoot: body.distanceByFoot ?? d.distanceByFoot,
    distanceByHorse: body.distanceByHorse ?? d.distanceByHorse, distanceByPlane: body.distanceByPlane ?? d.distanceByPlane, totalDistance: body.totalDistance ?? d.totalDistance };
  const distance = merged.totalDistance || merged.distanceByCar || merged.distanceByFoot || merged.distanceByHorse || merged.distanceByPlane;
  return { name: body.initialPlace ?? existing?.name, type: body.roadType ?? existing?.type ?? 'CAR', description: body.description ?? existing?.description, distance, condition: JSON.stringify(merged) };
}

router.post('/', async (req, res, next) => {
  try {
    const tp = await prisma.tourismPlace.findUnique({ where: { id: req.body.tourismPlaceId } });
    if (!tp) return res.status(400).json({ message: 'Invalid tourism place ID' });
    const road = await prisma.roadInfo.create({ data: { tourismPlaceId: req.body.tourismPlaceId, ...buildData(req.body, null) } });
    res.status(201).json(toDto(road));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.roadInfo.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ message: 'Road not found' });
    const road = await prisma.roadInfo.update({ where: { id: existing.id }, data: buildData(req.body, existing) });
    res.json(toDto(road));
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.roadInfo.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const road = await prisma.roadInfo.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!road) return res.status(404).json({ message: 'Road not found' });
    res.json(toDto(road));
  } catch (err) { next(err); }
});

router.get('/tourism/:tourismPlaceId', async (req, res, next) => {
  try {
    const roads = await prisma.roadInfo.findMany({ where: { tourismPlaceId: parseInt(req.params.tourismPlaceId) } });
    res.json(roads.map(toDto));
  } catch (err) { next(err); }
});

module.exports = router;
