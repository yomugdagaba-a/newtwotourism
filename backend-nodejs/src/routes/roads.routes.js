const router = require('express').Router();
const prisma = require('../lib/prisma');

function toDto(road) {
  let distances = {};
  if (road.condition) { try { distances = JSON.parse(road.condition); } catch (e) {} }
  return { id: road.id, tourismPlaceId: road.tourismPlaceId, initialPlace: road.name, roadType: road.type, description: road.description,
    distanceByCar: distances.distanceByCar || road.distanceByCar, distanceByFoot: distances.distanceByFoot || road.distanceByFoot,
    distanceByHorse: distances.distanceByHorse || road.distanceByHorse, distanceByPlane: distances.distanceByPlane || road.distanceByPlane,
    totalDistance: distances.totalDistance || road.totalDistance || road.distance, createdAt: road.createdAt, updatedAt: road.updatedAt };
}

// GET /api/tourisms/:tourismPlaceId/roads
router.get('/tourisms/:tourismPlaceId/roads', async (req, res, next) => {
  try {
    const roads = await prisma.roadInfo.findMany({ where: { tourismPlaceId: parseInt(req.params.tourismPlaceId) } });
    res.json(roads.map(toDto));
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

module.exports = router;
