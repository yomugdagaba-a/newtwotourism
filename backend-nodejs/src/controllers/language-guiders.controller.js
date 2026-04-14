const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const languageGuidersService = require('../services/language-guiders.service');

const router = Router();

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await languageGuidersService.create(req.body)); } catch (e) { next(e); }
});

// Filter by language (must be before /:id)
router.get('/language/:language', async (req, res, next) => {
  try { res.json(await languageGuidersService.findByLanguage(req.params.language)); } catch (e) { next(e); }
});

// Guiders by tourism place (must be before /:id)
router.get('/tourism/:tourismPlaceId', async (req, res, next) => {
  try {
    const guiders = await languageGuidersService.findByTourismPlace(req.params.tourismPlaceId);
    res.json(guiders);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await languageGuidersService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await languageGuidersService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try { res.json(await languageGuidersService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { await languageGuidersService.remove(parseInt(req.params.id)); res.json({ message: 'Language guider deleted' }); } catch (e) { next(e); }
});

module.exports = router;
