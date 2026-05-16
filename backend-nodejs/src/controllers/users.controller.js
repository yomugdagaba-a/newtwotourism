const { Router } = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');
const usersService = require('../services/users.service');

class UsersController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    // Specific paths before /:id
    this.router.get('/profile', authenticate, this.getProfile.bind(this));
    this.router.put('/profile', authenticate, this.updateProfile.bind(this));
    this.router.post('/change-password', authenticate, this.changePassword.bind(this));
    this.router.get('/:id', this.findById.bind(this));
    this.router.get('/', this.findAll.bind(this));
  }

  async getProfile(req, res, next) {
    try { res.json(await usersService.findById(req.user.userId)); } catch (e) { next(e); }
  }

  async updateProfile(req, res, next) {
    try { res.json(await usersService.updateProfile(req.user.userId, req.body)); } catch (e) { next(e); }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current password and new password are required' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash } });
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (e) { next(e); }
  }

  async findById(req, res, next) {
    try { res.json(await usersService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
  }

  async findAll(req, res, next) {
    try { res.json(await usersService.getAllUsers(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.search)); } catch (e) { next(e); }
  }
}

module.exports = new UsersController().router;
