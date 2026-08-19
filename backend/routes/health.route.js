/**
 * ElevateCV AI — Health Check Route
 * GET / — Returns API status, project name, and version.
 * GET /api/health/ai (or /ai) — Returns safe AI provider configuration status.
 */

const express = require('express');
const router  = express.Router();
const { getAIStatus } = require('../services/aiProvider');

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        data: {
            project: 'ElevateCV AI',
            version: '1.0.4',
            status: 'running',
            env: process.env.NODE_ENV || 'production'
        },
        error: null
    });
});

/**
 * Unauthenticated endpoint to inspect AI configuration status.
 * NEVER returns actual API keys or secrets.
 */
router.get('/ai', (req, res) => {
    const aiStatus = getAIStatus();
    res.status(200).json({
        success: true,
        data: aiStatus
    });
});

module.exports = router;

