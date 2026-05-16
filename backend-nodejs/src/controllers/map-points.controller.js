const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const mapPointsService = require('../services/map-points.service');

class MapPointsController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    this.router.post('/', authenticate, this.create.bind(this));
    // Specific paths before /:id
    this.router.get('/type/:type', this.getByType.bind(this));
    this.router.get('/tourism/:tourismPlaceId', this.getByTourism.bind(this));
    this.router.get('/distance', this.calculateDistance.bind(this));
    this.router.get('/:id', this.findById.bind(this));
    this.router.get('/', this.findAll.bind(this));
    this.router.put('/:id', authenticate, this.update.bind(this));
    this.router.delete('/:id', authenticate, this.remove.bind(this));
  }

  async create(req, res, next) {
    try { res.status(201).json(await mapPointsService.create(req.body)); } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await mapPointsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await mapPointsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async getByTourism(req, res, next) {
    try { res.json(await mapPointsService.getByTourism(parseInt(req.params.tourismPlaceId))); } catch (e) { next(e); }
  }

  async getByType(req, res, next) {
    try { res.json(await mapPointsService.getByType(req.params.type)); } catch (e) { next(e); }
  }

  async calculateDistance(req, res, next) {
    try {
      const { lat1, lon1, lat2, lon2 } = req.query;
      const distance = mapPointsService.calculateDistance(parseFloat(lat1), parseFloat(lon1), parseFloat(lat2), parseFloat(lon2));
      res.json({ distance, unit: 'km' });
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try { res.json(await mapPointsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try { await mapPointsService.remove(parseInt(req.params.id)); res.json({ message: 'Map point deleted' }); } catch (e) { next(e); }
  }
}

module.exports = new MapPointsController().router;
