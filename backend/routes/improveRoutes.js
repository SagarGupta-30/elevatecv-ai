/**
 * ElevateCV AI — Improve Routes (Sprint 3 AI Resume Improver Engine)
 *
 * Defines API routes for AI rewrite suggestions.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const { protect }               = require('../middleware/auth.middleware');
const { improveTextController } = require('../controllers/improveController');

/* ── Rate limiter: 10 rewrite requests per 2 minutes ────────────────────── */
const aiImproveLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many text improvement requests. Please wait a moment before trying again.',
        data: null,
        error: 'Too Many Requests'
    }
});

/**
 * @route   POST /api/ai/improve
 * @desc    Generate AI rewrite suggestions for a text snippet
 * @access  Private (Requires valid JWT token)
 */
router.post('/', protect, aiImproveLimiter, improveTextController);

module.exports = router;
