/**
 * ElevateCV AI — Express Application
 * Configures middleware, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const healthRoute = require('./routes/health.route');
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');

const app = express();

/* ── CORS allowed origins ── */
const allowedOrigins = [
    // Local development
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',

    // Production — Netlify frontend
    'https://elevatecv-ai.netlify.app'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

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