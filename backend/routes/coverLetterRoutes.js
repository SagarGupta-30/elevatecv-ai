/**
 * ElevateCV AI — Cover Letter Routes (Sprint 3 AI Cover Letter Engine)
 *
 * Defines API routes for cover letter generation.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const { protect }                       = require('../middleware/auth.middleware');
const { generateCoverLetterController } = require('../controllers/coverLetterController');

/* ── Rate limiter: 5 cover letter requests per 2 minutes ─────────────────── */
const coverLetterLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many cover letter generation requests. Please wait a moment before trying again.',
        data: null,
        error: 'Too Many Requests'
    }
});

/**
 * @route   POST /api/ai/cover-letter
 * @desc    Generate a tailored cover letter using Gemini AI
 * @access  Private (Requires valid JWT token)
 */
router.post('/', protect, coverLetterLimiter, generateCoverLetterController);

module.exports = router;
