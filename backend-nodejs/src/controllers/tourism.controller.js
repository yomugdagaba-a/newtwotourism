const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { CreateTourismDto, UpdateTourismDto } = require('../dto/tourism.dto');
const tourismService = require('../services/tourism.service');

// ── Public Controller (/api/tourisms) ─────────────────────────────────────────
class TourismPublicController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    // Specific paths before parameterized /:id
    this.router.get('/public/search', this.searchPublic.bind(this));
    this.router.get('/public/homepage', this.getHomepage.bind(this));
    this.router.get('/public/hero-images', this.getActiveHeroImages.bind(this));
    this.router.post('/:id/increment-view', this.incrementView.bind(this));
    this.router.get('/:id/images', this.getImages.bind(this));
    this.router.get('/:id/nearby', this.getNearbyPlaces.bind(this));
    this.router.get('/:id', this.findById.bind(this));
    this.router.get('/', this.findAll.bind(this));
  }

  async searchPublic(req, res, next) {
    try {
      const { keyword, kebele, wereda, page, size, sortBy, sortDir } = req.query;
      const categories = req.query.categories
        ? (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories])
        : [];
      res.json(await tourismService.searchPublic({ keyword, kebele, wereda, categories, page, size, sortBy, sortDir }));
    } catch (e) { next(e); }
  }

  async getHomepage(req, res, next) {
    try {
      const categories = req.query.categories
        ? (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories])
        : [];
      res.json(await tourismService.getHomepage(categories));
    } catch (e) { next(e); }
  }

  async getActiveHeroImages(req, res, next) {
    try { res.json(await tourismService.getActiveHeroImages()); } catch (e) { next(e); }
  }

  async getImages(req, res, next) {
    try { res.json(await tourismService.getImages(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async getNearbyPlaces(req, res, next) {
    try {
      const nearbyPlaces = await tourismService.getNearbyPlaces(parseInt(req.params.id), parseInt(req.query.limit) || 5);
      res.json(nearbyPlaces.map(place => ({
        id: place.id,
        name: place.name,
        imageUrl: place.images && place.images.length > 0 ? place.images[0].imageUrl : null,
      })));
    } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await tourismService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await tourismService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.category)); } catch (e) { next(e); }
  }

  async incrementView(req, res, next) {
    try {
      const { sessionId, ipAddress, userAgent } = req.body;
      const result = await tourismService.incrementView(
        parseInt(req.params.id),
        sessionId,
        ipAddress || req.ip || req.connection?.remoteAddress,
        userAgent || req.get('user-agent')
      );
      res.json(result);
    } catch (e) { next(e); }
  }
}

// ── CRUD Controller (/api/tourism + /api/user/tourism) ────────────────────────
class TourismCrudController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    this.router.post('/', authenticate, validate(CreateTourismDto), this.create.bind(this));
    this.router.get('/search', this.search.bind(this));
    this.router.delete('/images/:imageId', authenticate, this.removeImage.bind(this));

    // Authenticated detail (UserTourismController pattern)
    this.router.get('/tourism/:id/detail', authenticate, this.findById.bind(this));
    // Public detail alias
    this.router.get('/:id/details', this.findById.bind(this));
    this.router.post('/:id/images', authenticate, this.addImage.bind(this));
    this.router.put('/:id', authenticate, validate(UpdateTourismDto), this.update.bind(this));
    this.router.delete('/:id', authenticate, this.remove.bind(this));
    this.router.get('/:id', this.findById.bind(this));
    this.router.get('/', this.findAll.bind(this));
  }

  async create(req, res, next) {
    try { res.status(201).json(await tourismService.create(req.body)); } catch (e) { next(e); }
  }

  async search(req, res, next) {
    try { res.json(await tourismService.search(req.query.q || '', req.query.category, parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await tourismService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await tourismService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.category)); } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try { res.json(await tourismService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try { res.json(await tourismService.remove(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async addImage(req, res, next) {
    try { res.status(201).json(await tourismService.addImage(parseInt(req.params.id), req.body.imageUrl)); } catch (e) { next(e); }
  }

  async removeImage(req, res, next) {
    try { res.json(await tourismService.removeImage(parseInt(req.params.imageId))); } catch (e) { next(e); }
  }
}

const publicController = new TourismPublicController();
const crudController = new TourismCrudController();

module.exports = {
  publicRouter: publicController.router,
  crudRouter: crudController.router,
};
