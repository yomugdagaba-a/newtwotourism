const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { CreateTourismDto, UpdateTourismDto } = require('../dto/tourism.dto');
const tourismService = require('../services/tourism.service');

// ── /api/tourisms  (public read + sub-resources) ──────────────────────────────
const publicRouter = Router();

publicRouter.get('/public/search', async (req, res, next) => {
  try {
    const { keyword, kebele, wereda, page, size, sortBy, sortDir } = req.query;
    const categories = req.query.categories ? (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories]) : [];
    res.json(await tourismService.searchPublic({ keyword, kebele, wereda, categories, page, size, sortBy, sortDir }));
  } catch (e) { next(e); }
});

publicRouter.get('/public/homepage', async (req, res, next) => {
  try {
    const categories = req.query.categories ? (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories]) : [];
    res.json(await tourismService.getHomepage(categories));
  } catch (e) { next(e); }
});

publicRouter.get('/public/hero-images', async (req, res, next) => {
  try { res.json(await tourismService.getActiveHeroImages()); } catch (e) { next(e); }
});

publicRouter.get('/:id/images', async (req, res, next) => {
  try { res.json(await tourismService.getImages(parseInt(req.params.id))); } catch (e) { next(e); }
});

publicRouter.get('/:id/nearby', async (req, res, next) => {
  try {
    const nearbyPlaces = await tourismService.getNearbyPlaces(parseInt(req.params.id), parseInt(req.query.limit) || 5);
    res.json(nearbyPlaces.map(place => ({
      id: place.id,
      name: place.name,
      imageUrl: place.images && place.images.length > 0 ? place.images[0].imageUrl : null,
    })));
  } catch (e) { next(e); }
});

publicRouter.get('/:id', async (req, res, next) => {
  try { res.json(await tourismService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

publicRouter.get('/', async (req, res, next) => {
  try { res.json(await tourismService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.category)); } catch (e) { next(e); }
});

// ── /api/tourism  (authenticated CRUD) ────────────────────────────────────────
const crudRouter = Router();

crudRouter.post('/', authenticate, validate(CreateTourismDto), async (req, res, next) => {
  try { res.status(201).json(await tourismService.create(req.body)); } catch (e) { next(e); }
});

crudRouter.get('/search', async (req, res, next) => {
  try { res.json(await tourismService.search(req.query.q || '', req.query.category, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

// GET /api/user/tourism/tourism/:id/detail — authenticated (UserTourismController)
crudRouter.get('/tourism/:id/detail', authenticate, async (req, res, next) => {
  try { res.json(await tourismService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

// GET /api/user/tourism/:id/details — public (UserTourismController)
crudRouter.get('/:id/details', async (req, res, next) => {
  try { res.json(await tourismService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

crudRouter.get('/:id', async (req, res, next) => {
  try { res.json(await tourismService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

crudRouter.get('/', async (req, res, next) => {
  try { res.json(await tourismService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.category)); } catch (e) { next(e); }
});

crudRouter.delete('/images/:imageId', authenticate, async (req, res, next) => {
  try { res.json(await tourismService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
});

crudRouter.post('/:id/images', authenticate, async (req, res, next) => {
  try { res.status(201).json(await tourismService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
});

crudRouter.put('/:id', authenticate, validate(UpdateTourismDto), async (req, res, next) => {
  try { res.json(await tourismService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

crudRouter.delete('/:id', authenticate, async (req, res, next) => {
  try { res.json(await tourismService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
});

module.exports = { publicRouter, crudRouter };
