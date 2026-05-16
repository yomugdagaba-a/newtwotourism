const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const languageGuidersService = require('../services/language-guiders.service');

class LanguageGuidersController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    this.router.post('/', authenticate, this.create.bind(this));
    // Specific paths before /:id
    this.router.get('/language/:language', this.findByLanguage.bind(this));
    this.router.get('/tourism/:tourismPlaceId', this.findByTourismPlace.bind(this));
    this.router.get('/:id', this.findById.bind(this));
    this.router.get('/', this.findAll.bind(this));
    this.router.put('/:id', authenticate, this.update.bind(this));
    this.router.delete('/:id', authenticate, this.remove.bind(this));
  }

  async create(req, res, next) {
    try { res.status(201).json(await languageGuidersService.create(req.body)); } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await languageGuidersService.findAll(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10)); } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await languageGuidersService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async findByLanguage(req, res, next) {
    try { res.json(await languageGuidersService.findByLanguage(req.params.language)); } catch (e) { next(e); }
  }

  async findByTourismPlace(req, res, next) {
    try { res.json(await languageGuidersService.findByTourismPlace(req.params.tourismPlaceId)); } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try { res.json(await languageGuidersService.update(parseInt(req.params.id), req.body)); } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try { await languageGuidersService.remove(parseInt(req.params.id)); res.json({ message: 'Language guider deleted' }); } catch (e) { next(e); }
  }
}

module.exports = new LanguageGuidersController().router;
