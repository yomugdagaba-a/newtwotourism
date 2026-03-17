const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const usersService = require('../services/users.service');

const router = Router();

router.get('/profile', authenticate, async (req, res, next) => {
  try { res.json(await usersService.findById(req.user.userId)); } catch (e) { next(e); }
});

router.put('/profile', authenticate, async (req, res, next) => {
  try { res.json(await usersService.updateProfile(req.user.userId, req.body)); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await usersService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await usersService.getAllUsers(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.search)); } catch (e) { next(e); }
});

module.exports = router;
