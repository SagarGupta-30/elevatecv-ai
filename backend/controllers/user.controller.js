/**
 * ElevateCV AI — User Profile Controller
 * Handles HTTP request/response for profile endpoints.
 */

const userService = require('../services/user.service');

/**
 * GET /api/users/profile
 * Return the authenticated user's full profile with career stats.
 */
async function getProfile(req, res, next) {
    try {
        const { user, stats } = await userService.getUserProfile(req.userId);

        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: { user, stats },
            error: null
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/users/profile
 * Update the authenticated user's extended profile fields.
 */
async function updateProfile(req, res, next) {
    try {
        const user = await userService.updateUserProfile(req.userId, req.body || {});

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user },
            error: null
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages[0],
                data: null,
                error: 'ValidationError'
            });
        }
        next(error);
    }
}

module.exports = { getProfile, updateProfile };
