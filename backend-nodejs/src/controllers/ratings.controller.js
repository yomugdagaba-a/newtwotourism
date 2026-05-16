const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const ratingsService = require('../services/ratings.service');

class RatingsController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    // Body-based endpoints
    this.router.post('/tourism', authenticate, this.rateTourismByBody.bind(this));
    this.router.post('/hotel', authenticate, this.rateHotelByBody.bind(this));

    // Param-based endpoints
    this.router.post('/tourism/:tourismPlaceId', authenticate, this.rateTourismByParam.bind(this));
    this.router.post('/hotel/:hotelId', authenticate, this.rateHotelByParam.bind(this));

    // Summaries — must be before generic list routes
    this.router.get('/tourism/:tourismPlaceId/summary', this.getTourismSummary.bind(this));
    this.router.get('/hotel/:hotelId/summary', this.getHotelSummary.bind(this));

    // Lists
    this.router.get('/tourism/:tourismPlaceId', this.getTourismRatings.bind(this));
    this.router.get('/hotel/:hotelId', this.getHotelRatings.bind(this));
  }

  async rateTourismByBody(req, res, next) {
    try { res.status(201).json(await ratingsService.rateTourism(parseInt(req.body.tourismPlaceId), req.user.userId, parseInt(req.body.rating), req.body.comment)); } catch (e) { next(e); }
  }

  async rateHotelByBody(req, res, next) {
    try { res.status(201).json(await ratingsService.rateHotel(parseInt(req.body.hotelId), req.user.userId, parseInt(req.body.rating), req.body.comment)); } catch (e) { next(e); }
  }

  async rateTourismByParam(req, res, next) {
    try { res.status(201).json(await ratingsService.rateTourism(parseInt(req.params.tourismPlaceId), req.user.userId, parseInt(req.body.rating), req.body.comment)); } catch (e) { next(e); }
  }

  async rateHotelByParam(req, res, next) {
    try { res.status(201).json(await ratingsService.rateHotel(parseInt(req.params.hotelId), req.user.userId, parseInt(req.body.rating), req.body.comment)); } catch (e) { next(e); }
  }

  async getTourismSummary(req, res, next) {
    try { res.json(await ratingsService.getTourismRatingSummary(parseInt(req.params.tourismPlaceId))); } catch (e) { next(e); }
  }

  async getHotelSummary(req, res, next) {
    try { res.json(await ratingsService.getHotelRatingSummary(parseInt(req.params.hotelId))); } catch (e) { next(e); }
  }

  async getTourismRatings(req, res, next) {
    try { res.json(await ratingsService.getTourismRatings(parseInt(req.params.tourismPlaceId), parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async getHotelRatings(req, res, next) {
    try { res.json(await ratingsService.getHotelRatings(parseInt(req.params.hotelId), parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }
}

module.exports = new RatingsController().router;
