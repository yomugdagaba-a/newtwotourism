const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const auditService = require('../services/audit.service');

class AuditController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    this.router.get('/', authenticate, this.findAll.bind(this));
    this.router.get('/statistics', authenticate, this.getStatistics.bind(this));
  }

  async findAll(req, res, next) {
    try {
      const skip = req.query.skip ? parseInt(req.query.skip) : 0;
      const take = req.query.take ? parseInt(req.query.take) : 10;
      const userId = req.query.userId ? parseInt(req.query.userId) : undefined;
      res.json(await auditService.findAll(skip, take, userId, req.query.action));
    } catch (e) { next(e); }
  }

  async getStatistics(req, res, next) {
    try {
      const days = req.query.days ? parseInt(req.query.days) : 30;
      res.json(await auditService.getStatistics(days));
    } catch (e) { next(e); }
  }
}

module.exports = new AuditController().router;
