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
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5001', 'http://127.0.0.1:5001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const resumeRoutes = require('./routes/resume.routes');

/* ── Routes ── */
app.use('/', healthRoute);
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

/* ── 404 Handler ── */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        data: null,
        error: 'Not Found'
    });
});

/* ── Global Error Handler ── */
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        data: null,
        error: err.name || 'ServerError'
    });
});

module.exports = app;
