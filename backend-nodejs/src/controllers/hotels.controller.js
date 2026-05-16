const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { CreateHotelDto, UpdateHotelDto } = require('../dto/hotel.dto');
const hotelsService = require('../services/hotels.service');

class HotelsController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    // Specific routes BEFORE parameterized ones
    this.router.get('/search', this.search.bind(this));
    this.router.get('/owner/my-hotels', authenticate, this.getMyHotels.bind(this));
    this.router.get('/owner/:ownerId', authenticate, this.getByOwner.bind(this));

    // Image routes — DELETE /images/:imageId before DELETE /:id
    this.router.delete('/images/:imageId', authenticate, this.removeImage.bind(this));
    this.router.post('/:id/images', authenticate, this.addImage.bind(this));

    // Detail & rating
    this.router.get('/:id/detail', this.findById.bind(this));
    this.router.get('/:id/ratings/me', authenticate, this.checkUserRating.bind(this));

    // CRUD
    this.router.get('/:id', this.findById.bind(this));
    this.router.put('/:id', authenticate, validate(UpdateHotelDto), this.update.bind(this));
    this.router.delete('/:id', authenticate, this.remove.bind(this));
    this.router.post('/', authenticate, validate(CreateHotelDto), this.create.bind(this));
    this.router.get('/', this.findAll.bind(this));
  }

  async search(req, res, next) {
    try { res.json(await hotelsService.search(req.query.q || '', parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async getMyHotels(req, res, next) {
    try { res.json(await hotelsService.getByOwner(req.user.userId, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async getByOwner(req, res, next) {
    try {
      const result = await hotelsService.getByOwner(parseInt(req.params.ownerId), parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10);
      res.json(result.hotels);
    } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await hotelsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.tourismPlaceId ? parseInt(req.query.tourismPlaceId) : undefined)); } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await hotelsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try { res.status(201).json(await hotelsService.create(req.body, req.user.userId)); } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try { res.json(await hotelsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try { res.json(await hotelsService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async addImage(req, res, next) {
    try { res.status(201).json(await hotelsService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
  }

  async removeImage(req, res, next) {
    try { res.json(await hotelsService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
  }

  async checkUserRating(req, res, next) {
    try { res.json(await hotelsService.checkUserRating(parseInt(req.params.id), req.user.userId)); } catch (e) { next(e); }
  }
}

module.exports = new HotelsController().router;
