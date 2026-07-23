/**
 * ElevateCV AI — Health Check Route
 * GET / — Returns API status, project name, and version.
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        status: 'running',
        project: 'ElevateCV AI',
        version: '1.0.0',
    });
});

module.exports = router;
