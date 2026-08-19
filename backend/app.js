/**
 * ElevateCV AI — Express Application
 * Configures middleware, routes, and error handling.
 */

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const healthRoute        = require('./routes/health.route');
const authRoutes         = require('./routes/auth.routes');
const resumeRoutes       = require('./routes/resume.routes');
const aiRoutes           = require('./routes/aiRoutes');
const improveRoutes      = require('./routes/improveRoutes');
const coverLetterRoutes  = require('./routes/coverLetterRoutes');
const interviewRoutes    = require('./routes/interviewRoutes');
const jobMatchRoutes     = require('./routes/jobMatchRoutes');
const skillGapRoutes     = require('./routes/skillGapRoutes');
const userRoutes         = require('./routes/user.routes');

const app = express();

/* ── CORS ─────────────────────────────────────────────────────────────── */
const allowedOrigins = [
    // Local development
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',

    // Production Frontends
    'https://elevatecv-ai.netlify.app',
    'https://elevatecv-ai-rose.vercel.app'
];

const corsOriginChecker = (origin, callback) => {
    // Allow requests with no origin (like mobile apps, cURL, or server-to-server)
    if (!origin) return callback(null, true);

    if (
        allowedOrigins.includes(origin) ||
        process.env.CLIENT_URL === origin ||
        process.env.FRONTEND_URL === origin ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.netlify\.app$/.test(origin)
    ) {
        return callback(null, true);
    }

    return callback(null, false);
};

const corsOptions = {
    origin: corsOriginChecker,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
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
app.use('/api/health', healthRoute);
app.use('/', healthRoute);

/* ── Production Diagnostic Route ────────────────────────────────────────── */
app.get('/api/debug/routes', (req, res) => {
    res.status(200).json({
        success: true,
        environment: process.env.NODE_ENV || 'development',
        commit: process.env.RENDER_GIT_COMMIT || 'latest',
        timestamp: new Date().toISOString(),
        mountedRoutes: [
            'GET /',
            'GET /api/health/ai',
            'GET /api/debug/routes',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/auth/me',
            'PUT /api/auth/profile',
            'PUT /api/auth/password',
            'GET /api/users/profile',
            'PUT /api/users/profile',
            'POST /api/resumes',
            'GET /api/resumes',
            'GET /api/resumes/:id',
            'PUT /api/resumes/:id',
            'DELETE /api/resumes/:id',
            'POST /api/ai/analyze',
            'POST /api/ai/improve',
            'POST /api/ai/cover-letter',
            'POST /api/ai/interview',
            'POST /api/ai/job-match',
            'POST /api/ai/skill-gap'
        ]
    });
});

const { protect } = require('./middleware/auth.middleware');
const { uploadJD } = require('./middleware/upload.middleware');
const { uploadJdController } = require('./controllers/jobMatchController');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resumes', resumeRoutes);
app.post('/api/job-description/upload', protect, uploadJD.single('jdFile'), uploadJdController);
app.use('/api/ai/improve', improveRoutes);
app.use('/api/ai/cover-letter', coverLetterRoutes);
app.use('/api/ai/interview', interviewRoutes);
app.use('/api/ai/job-match', jobMatchRoutes);
app.use('/api/ai/skill-gap', skillGapRoutes);
app.use('/api/ai', aiRoutes);

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