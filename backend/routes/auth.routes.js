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

const rateLimit = require('express-rate-limit');

// Rate limiter for Login: 5 requests per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes',
        data: null,
        error: 'Too Many Requests'
    }
});

// Rate limiter for Register: 10 requests per 1 hour
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many registration attempts, please try again after 1 hour',
        data: null,
        error: 'Too Many Requests'
    }
});

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;
