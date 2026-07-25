/**
 * ElevateCV AI — Express Application
 * Configures middleware, routes, and error handling.
 */

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const healthRoute  = require('./routes/health.route');
const authRoutes   = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');

const app = express();

/* ── CORS ─────────────────────────────────────────────────────────────── */
/*
 * Pass a plain array to cors().  The cors package natively handles arrays:
 * it compares req.headers.origin against each entry and sets
 * Access-Control-Allow-Origin to the matched value (or omits it).
 * Using a custom function callback risks calling next(err) silently, which
 * causes the 204 preflight to arrive with no Access-Control-Allow-Origin
 * header — exactly the bug that was observed in production.
 */
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

const corsOptions = {
    origin: allowedOrigins,         // plain array — safe and correct
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200       // IE 11 compat; also ensures body is sent
};

/* Handle pre-flight OPTIONS across ALL routes FIRST, before any other middleware */
app.options('*', cors(corsOptions));

/* Apply CORS headers to every subsequent request */
app.use(cors(corsOptions));

/* ── Body parsers & logging ───────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* ── Routes ───────────────────────────────────────────────────────────── */
app.use('/', healthRoute);
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

/* ── 404 Handler ──────────────────────────────────────────────────────── */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        data: null,
        error: 'Not Found'
    });
});

/* ── Global Error Handler ─────────────────────────────────────────────── */
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