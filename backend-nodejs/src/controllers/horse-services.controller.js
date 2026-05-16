const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const horseServicesService = require('../services/horse-services.service');

class HorseServicesController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    this.router.post('/', authenticate, this.create.bind(this));
    this.router.get('/', this.findAll.bind(this));
    this.router.get('/:id', this.findById.bind(this));
    this.router.put('/:id', authenticate, this.update.bind(this));
    this.router.delete('/:id', authenticate, this.remove.bind(this));
  }

  async create(req, res, next) {
    try { res.status(201).json(await horseServicesService.create(req.body)); } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await horseServicesService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await horseServicesService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try { res.json(await horseServicesService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try { await horseServicesService.remove(parseInt(req.params.id)); res.json({ message: 'Horse service deleted' }); } catch (e) { next(e); }
  }
}

module.exports = new HorseServicesController().router;
