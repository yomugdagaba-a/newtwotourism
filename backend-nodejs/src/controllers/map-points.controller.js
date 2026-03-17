const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const mapPointsService = require('../services/map-points.service');

const router = Router();

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await mapPointsService.create(req.body)); } catch (e) { next(e); }
});

router.get('/type/:type', async (req, res, next) => {
  try { res.json(await mapPointsService.getByType(req.params.type)); } catch (e) { next(e); }
});

router.get('/tourism/:tourismPlaceId', async (req, res, next) => {
  try { res.json(await mapPointsService.getByTourism(parseInt(req.params.tourismPlaceId))); } catch (e) { next(e); }
});

router.get('/distance', async (req, res, next) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query;
    const distance = mapPointsService.calculateDistance(parseFloat(lat1), parseFloat(lon1), parseFloat(lat2), parseFloat(lon2));
    res.json({ distance, unit: 'km' });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await mapPointsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await mapPointsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try { res.json(await mapPointsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { await mapPointsService.remove(parseInt(req.params.id)); res.json({ message: 'Map point deleted' }); } catch (e) { next(e); }
});

module.exports = router;
