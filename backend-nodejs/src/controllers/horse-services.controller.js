const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const horseServicesService = require('../services/horse-services.service');

const router = Router();

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await horseServicesService.create(req.body)); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await horseServicesService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await horseServicesService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try { res.json(await horseServicesService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { await horseServicesService.remove(parseInt(req.params.id)); res.json({ message: 'Horse service deleted' }); } catch (e) { next(e); }
});

module.exports = router;
