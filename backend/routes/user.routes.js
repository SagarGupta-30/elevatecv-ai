/**
 * ElevateCV AI — User Profile Routes
 * Routes for user profile management.
 */

const express       = require('express');
const router        = express.Router();
const { protect }   = require('../middleware/auth.middleware');
const { getProfile, updateProfile } = require('../controllers/user.controller');

/**
 * GET  /api/users/profile — Fetch authenticated user's full profile + stats
 * PUT  /api/users/profile — Update profile fields
 */
router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, updateProfile);

module.exports = router;
