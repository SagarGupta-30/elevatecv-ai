/**
 * ElevateCV AI — Health Check Route
 * GET / — Returns API status, project name, and version.
 */

const express = require('express');
const router  = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        data: {
            project: 'ElevateCV AI',
            version: '1.0.2',          // bumped — confirms new code is live on Render
            status: 'running',
            env: process.env.NODE_ENV || 'production'
        },
        error: null
    });
});

module.exports = router;
