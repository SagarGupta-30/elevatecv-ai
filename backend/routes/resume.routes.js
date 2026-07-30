/**
 * ElevateCV AI — Resume Routes (Sprint 2)
 *
 * All routes require a valid JWT (enforced via `protect` middleware).
 *
 * CRUD endpoints (Sprint 1 — unchanged):
 *   POST   /api/resumes           — Create a new resume
 *   GET    /api/resumes           — List all resumes for the authenticated user
 *   GET    /api/resumes/:id       — Get a single resume by ID
 *   PUT    /api/resumes/:id       — Update a resume
 *   DELETE /api/resumes/:id       — Delete a resume
 *
 * Future endpoint stubs (Sprint 4 / Sprint 5 — returns 501 until implemented):
 *   POST   /api/resumes/:id/analyze — AI / ATS analysis (Sprint 4)
 *   GET    /api/resumes/:id/export  — PDF export (Sprint 5)
 *
 * Stub convention:
 *   Returns HTTP 501 Not Implemented with a structured JSON body matching
 *   the standard { success, message, data, error } envelope used across the API.
 *   This ensures the route exists in the routing table (preventing future 404s
 *   on route registration) and gives the frontend a meaningful error to handle.
 */

const express = require('express');
const router  = express.Router();
const resumeController = require('../controllers/resume.controller');
const { protect }      = require('../middleware/auth.middleware');

/* All resume routes require authentication */
router.use(protect);

/* ── CRUD (Sprint 1 — unchanged) ──────────────────────────────────────── */
router.post('/',      resumeController.createResume);
router.get('/',       resumeController.getUserResumes);
router.get('/:id',    resumeController.getResume);
router.put('/:id',    resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);

/* ── Future AI endpoints — 501 stubs (Sprint 4) ───────────────────────── */

/**
 * POST /api/resumes/:id/analyze
 * Trigger AI/ATS analysis for a resume.
 * Will be implemented in Sprint 4.
 */
router.post('/:id/analyze', (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'AI analysis is not yet implemented. Coming in Sprint 4.',
        data: null,
        error: 'NotImplemented'
    });
});

/**
 * GET /api/resumes/:id/export
 * Export a resume as a PDF.
 * Will be implemented in Sprint 5.
 */
router.get('/:id/export', (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'PDF export is not yet implemented. Coming in Sprint 5.',
        data: null,
        error: 'NotImplemented'
    });
});

module.exports = router;
