/**
 * ElevateCV AI — Auth Controller
 * Handles HTTP request/response for authentication endpoints.
 */

const authService = require('../services/auth.service');

/**
 * POST /api/auth/register
 * Register a new user account.
 */
async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password',
                data: null,
                error: 'ValidationError'
            });
        }

        const { user, token } = await authService.registerUser({ name, email, password });

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: { user, token },
            error: null
        });
    } catch (error) {
        /* Handle Mongoose validation errors */
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
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

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
                data: null,
                error: 'ValidationError'
            });
        }

        const { user, token } = await authService.loginUser({ email, password });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user, token },
            error: null
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
async function getMe(req, res, next) {
    try {
        const user = await authService.getUserById(req.userId);

        res.status(200).json({
            success: true,
            message: 'User profile retrieved',
            data: { user },
            error: null
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { register, login, getMe };
