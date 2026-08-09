/**
 * ElevateCV AI — Auth Middleware
 * Verifies JWT tokens on protected routes.
 */

const jwt = require('jsonwebtoken');

function protect(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
            data: null,
            error: 'Unauthorized'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'elevatecv_default_jwt_secret_key_2026';
        const decoded = jwt.verify(token, secret);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            data: null,
            error: 'Unauthorized'
        });
    }
}

module.exports = { protect };
