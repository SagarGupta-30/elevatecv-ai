/**
 * ElevateCV AI — Interview Routes (Sprint 3 AI Interview Prep Engine)
 *
 * Defines API routes for AI Interview Prep Kit generation.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const { protect }                        = require('../middleware/auth.middleware');
const { generateInterviewPrepController } = require('../controllers/interviewController');

/* ── Rate limiter: 5 interview prep requests per 2 minutes ───────────────── */
const interviewLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many interview preparation requests. Please wait a moment before trying again.',
        data: null,
        error: 'Too Many Requests'
    }
});

/**
 * @route   POST /api/ai/interview
 * @desc    Generate a tailored interview prep kit using Gemini AI
 * @access  Private (Requires valid JWT token)
 */
router.post('/', protect, interviewLimiter, generateInterviewPrepController);

module.exports = router;
