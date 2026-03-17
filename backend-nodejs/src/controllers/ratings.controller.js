const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const ratingsService = require('../services/ratings.service');

const router = Router();

// Generic body-based rating endpoints
router.post('/tourism', authenticate, async (req, res, next) => {
  try { res.status(201).json(await ratingsService.rateTourism(parseInt(req.body.tourismPlaceId), req.user.userId, parseInt(req.body.rating), req.body.comment)); } catch (e) { next(e); }
});

router.post('/hotel', authenticate, async (req, res, next) => {
  try { res.status(201).json(await ratingsService.rateHotel(parseInt(req.body.hotelId), req.user.userId, parseInt(req.body.rating), req.body.comment)); } catch (e) { next(e); }
});

// Param-based rating endpoints
router.post('/tourism/:tourismPlaceId', authenticate, async (req, res, next) => {
  try { res.status(201).json(await ratingsService.rateTourism(parseInt(req.params.tourismPlaceId), req.user.userId, parseInt(req.body.rating), req.body.comment)); } catch (e) { next(e); }
});

router.post('/hotel/:hotelId', authenticate, async (req, res, next) => {
  try { res.status(201).json(await ratingsService.rateHotel(parseInt(req.params.hotelId), req.user.userId, parseInt(req.body.rating), req.body.comment)); } catch (e) { next(e); }
});

router.get('/tourism/:tourismPlaceId/summary', async (req, res, next) => {
  try { res.json(await ratingsService.getTourismRatingSummary(parseInt(req.params.tourismPlaceId))); } catch (e) { next(e); }
});

router.get('/hotel/:hotelId/summary', async (req, res, next) => {
  try { res.json(await ratingsService.getHotelRatingSummary(parseInt(req.params.hotelId))); } catch (e) { next(e); }
});

router.get('/tourism/:tourismPlaceId', async (req, res, next) => {
  try { res.json(await ratingsService.getTourismRatings(parseInt(req.params.tourismPlaceId), parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

router.get('/hotel/:hotelId', async (req, res, next) => {
  try { res.json(await ratingsService.getHotelRatings(parseInt(req.params.hotelId), parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
});

module.exports = router;
