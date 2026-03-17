const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { CreateRoadDto, UpdateRoadDto } = require('../dto/road.dto');
const roadsService = require('../services/roads.service');

const router = Router();

router.post('/', authenticate, validate(CreateRoadDto), async (req, res, next) => {
  try { res.status(201).json(await roadsService.create(req.body)); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await roadsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.tourismPlaceId)); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await roadsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', authenticate, validate(UpdateRoadDto), async (req, res, next) => {
  try { res.json(await roadsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { await roadsService.remove(parseInt(req.params.id)); res.json({ message: 'Road deleted successfully' }); } catch (e) { next(e); }
});

module.exports = router;
