const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const languageGuidersService = require('../services/language-guiders.service');

const router = Router();

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await languageGuidersService.create(req.body)); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await languageGuidersService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await languageGuidersService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try { res.json(await languageGuidersService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { await languageGuidersService.remove(parseInt(req.params.id)); res.json({ message: 'Language guider deleted' }); } catch (e) { next(e); }
});

// Guiders sub-routes (also mounted at /api/guiders)
router.get('/tourism/:tourismPlaceId', async (req, res, next) => {
  try {
    const result = await languageGuidersService.findAll(0, 100);
    res.json(result.guiders);
  } catch (e) { next(e); }
});

module.exports = router;
