const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { CreateRoadDto, UpdateRoadDto } = require('../dto/road.dto');
const roadsService = require('../services/roads.service');

class RoadsController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    this.router.post('/', authenticate, validate(CreateRoadDto), this.create.bind(this));
    this.router.get('/', this.findAll.bind(this));
    this.router.get('/:id', this.findById.bind(this));
    this.router.put('/:id', authenticate, validate(UpdateRoadDto), this.update.bind(this));
    this.router.delete('/:id', authenticate, this.remove.bind(this));
  }

  async create(req, res, next) {
    try { res.status(201).json(await roadsService.create(req.body)); } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await roadsService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.tourismPlaceId)); } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await roadsService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try { res.json(await roadsService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try { await roadsService.remove(parseInt(req.params.id)); res.json({ message: 'Road deleted successfully' }); } catch (e) { next(e); }
  }
}

module.exports = new RoadsController().router;
