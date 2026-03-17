const router = require('express').Router();
const prisma = require('../lib/prisma');

router.get('/:id', async (req, res, next) => {
  try {
    const mp = await prisma.mapPoint.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!mp) return res.status(404).json({ message: 'Map point not found' });
    res.json(mp);
  } catch (err) { next(err); }
});

router.get('/tourism/:tourismPlaceId', async (req, res, next) => {
  try {
    const points = await prisma.mapPoint.findMany({ where: { tourismPlaceId: parseInt(req.params.tourismPlaceId) } });
    res.json(points);
  } catch (err) { next(err); }
});

router.get('/type/:type', async (req, res, next) => {
  try {
    const points = await prisma.mapPoint.findMany({ where: { type: req.params.type.toUpperCase() } });
    res.json(points);
  } catch (err) { next(err); }
});

router.get('/distance', async (req, res, next) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query;
    const R = 6371;
    const dLat = (parseFloat(lat2) - parseFloat(lat1)) * Math.PI / 180;
    const dLon = (parseFloat(lon2) - parseFloat(lon1)) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(parseFloat(lat1) * Math.PI / 180) * Math.cos(parseFloat(lat2) * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    res.json({ distance: parseFloat(distance.toFixed(2)), unit: 'km' });
  } catch (err) { next(err); }
});

module.exports = router;
