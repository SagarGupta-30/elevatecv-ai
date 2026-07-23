/**
 * ElevateCV AI — Express Application
 * Configures middleware, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const healthRoute = require('./routes/health.route');
const authRoutes = require('./routes/auth.routes');

const app = express();

/* ── Middleware ── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* ── Routes ── */
app.use('/', healthRoute);
app.use('/api/auth', authRoutes);

/* ── 404 Handler ── */
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
    });
});

/* ── Global Error Handler ── */
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

module.exports = app;
