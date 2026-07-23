/**
 * ElevateCV AI — Auth Routes
 * POST /api/auth/register — Register a new user
 * POST /api/auth/login    — Authenticate user
 * GET  /api/auth/me       — Get current user (protected)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;
