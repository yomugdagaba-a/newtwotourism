const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { CreateHotelDto, UpdateHotelDto } = require('../dto/hotel.dto');
const hotelsService = require('../services/hotels.service');

const router = Router();

router.post('/', authenticate, validate(CreateHotelDto), async (req, res, next) => {
  try { res.status(201).json(await hotelsService.create(req.body, req.user.userId)); } catch (e) { next(e); }
});

router.get('/search', async (req, res, next) => {
  try { res.json(await hotelsService.search(req.query.q || '', parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/owner/my-hotels', authenticate, async (req, res, next) => {
  try { res.json(await hotelsService.getByOwner(req.user.userId, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/owner/:ownerId', authenticate, async (req, res, next) => {
  try {
    const result = await hotelsService.getByOwner(parseInt(req.params.ownerId), parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10);
    res.json(result.hotels);
  } catch (e) { next(e); }
});

router.get('/:id/detail', async (req, res, next) => {
  try { res.json(await hotelsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/:id/ratings/me', authenticate, async (req, res, next) => {
  try { res.json(await hotelsService.checkUserRating(parseInt(req.params.id), req.user.userId)); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await hotelsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await hotelsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.tourismPlaceId ? parseInt(req.query.tourismPlaceId) : undefined)); } catch (e) { next(e); }
});

router.put('/:id', authenticate, validate(UpdateHotelDto), async (req, res, next) => {
  try { res.json(await hotelsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
});

router.delete('/images/:imageId', authenticate, async (req, res, next) => {
  try { res.json(await hotelsService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
});

router.post('/:id/images', authenticate, async (req, res, next) => {
  try { res.status(201).json(await hotelsService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try { res.json(await hotelsService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
});

module.exports = router;
