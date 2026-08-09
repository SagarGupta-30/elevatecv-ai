/**
 * ElevateCV AI — AI Routes (Sprint 3 AI Resume Analysis Engine)
 *
 * Defines API routes for AI-powered features.
 *
 * Production improvements (post-audit):
 *   - Added route-level rate limiter: 5 AI analysis requests per 2 minutes per
 *     authenticated user, protecting Gemini API quota from rapid repeat calls.
 *     Uses the same `express-rate-limit` package already installed for auth routes.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const { protect }                = require('../middleware/auth.middleware');
const { analyzeResumeController } = require('../controllers/aiController');

/* ── AI analysis rate limiter ────────────────────────────────────────────── */
// 5 analysis requests per 2 minutes per IP.
// This mirrors the pattern used in auth.routes.js.
const aiAnalysisLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2-minute window
    max: 5,
    standardHeaders: true,   // Return `RateLimit-*` headers
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many AI analysis requests. Please wait a moment before trying again.',
        data: null,
        error: 'Too Many Requests'
    }
});

/**
 * @route   POST /api/ai/analyze
 * @desc    Analyze resume data using Google Gemini AI
 * @access  Private (Requires valid JWT token)
 */
router.post('/analyze', protect, aiAnalysisLimiter, analyzeResumeController);

module.exports = router;
