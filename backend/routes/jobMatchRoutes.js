/**
 * ElevateCV AI — Job Match Routes (Sprint 3.5 AI ATS Job Match Engine)
 *
 * Defines API routes for ATS Job Match Analysis.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const { protect }                   = require('../middleware/auth.middleware');
const { analyzeJobMatchController } = require('../controllers/jobMatchController');

/* ── Rate limiter: 5 job match requests per 2 minutes ───────────────────── */
const jobMatchLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many ATS job match requests. Please wait a moment before trying again.',
        data: null,
        error: 'Too Many Requests'
    }
});

/**
 * @route   POST /api/ai/job-match
 * @desc    Perform ATS Job Match Analysis comparing resume with job description
 * @access  Private (Requires valid JWT token)
 */
router.post('/', protect, jobMatchLimiter, analyzeJobMatchController);

module.exports = router;
