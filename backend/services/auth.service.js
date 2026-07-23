/**
 * ElevateCV AI — Auth Service
 * Business logic for authentication operations.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a signed JWT for a given user ID.
 * @param {string} userId - The user's MongoDB _id.
 * @returns {string} Signed JWT token.
 */
function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}

/**
 * Register a new user.
 * @param {Object} userData - { name, email, password }
 * @returns {Object} { user, token }
 */
async function registerUser({ name, email, password }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error('An account with this email already exists');
        error.status = 409;
        throw error;
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return { user, token };
}

/**
 * Authenticate a user with email and password.
 * @param {Object} credentials - { email, password }
 * @returns {Object} { user, token }
 */
async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
    }

    const token = generateToken(user._id);

    return { user, token };
}

/**
 * Get user profile by ID.
 * @param {string} userId - The user's MongoDB _id.
 * @returns {Object} User document (without password).
 */
async function getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }
    return user;
}

module.exports = { generateToken, registerUser, loginUser, getUserById };
