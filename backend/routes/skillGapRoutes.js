/**
 * ElevateCV AI — Skill Gap Routes (Sprint 3.5 AI Skill Gap Engine)
 *
 * Defines API routes for Skill Gap Analysis.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const { protect }                   = require('../middleware/auth.middleware');
const { analyzeSkillGapController } = require('../controllers/skillGapController');

/* ── Rate limiter: 5 skill gap requests per 2 minutes ───────────────────── */
const skillGapLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many Skill Gap Analysis requests. Please wait a moment before trying again.',
        data: null,
        error: 'Too Many Requests'
    }
});

/**
 * @route   POST /api/ai/skill-gap
 * @desc    Perform Skill Gap Analysis comparing resume with target job role
 * @access  Private (Requires valid JWT token)
 */
router.post('/', protect, skillGapLimiter, analyzeSkillGapController);

module.exports = router;
