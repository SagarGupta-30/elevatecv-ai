/**
 * ElevateCV AI — AI Controller (Sprint 3 AI Resume Analysis Engine)
 *
 * Handles HTTP requests for AI features including resume analysis.
 *
 * Production improvements (post-audit):
 *   - Maps GeminiServiceError.code to the correct HTTP status code:
 *       MISSING_API_KEY  → 503
 *       QUOTA_EXCEEDED   → 429
 *       REQUEST_TIMEOUT  → 504
 *       EMPTY_RESPONSE   → 500
 *       INVALID_JSON     → 500
 *       GEMINI_ERROR     → 500
 */

const geminiService = require('../services/geminiService');
const { GeminiServiceError } = require('../services/geminiService');

/* ── Status code map ─────────────────────────────────────────────────────── */
const ERROR_CODE_TO_HTTP = {
    MISSING_API_KEY: 503,
    INVALID_API_KEY: 503,
    QUOTA_EXCEEDED:  429,
    REQUEST_TIMEOUT: 504,
    EMPTY_RESPONSE:  500,
    INVALID_JSON:    500,
    GEMINI_ERROR:    500
};

/**
 * Controller to handle POST /api/ai/analyze
 */
async function analyzeResumeController(req, res) {
    try {
        const resumeData = req.body;

        // Basic payload validation
        if (!resumeData || typeof resumeData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid request body. Resume JSON object is required.',
                data: null,
                error: 'Bad Request'
            });
        }

        const pi      = resumeData.personalInformation || {};
        const hasName = typeof pi.fullName === 'string' && pi.fullName.trim().length > 0;
        const hasExp  = Array.isArray(resumeData.experience) && resumeData.experience.length > 0;
        const hasEdu  = Array.isArray(resumeData.education) && resumeData.education.length > 0;
        const hasProj = Array.isArray(resumeData.projects) && resumeData.projects.length > 0;
        const hasSk   = resumeData.skills &&
                        (Array.isArray(resumeData.skills) || typeof resumeData.skills === 'object');

        if (!hasName && !hasExp && !hasEdu && !hasProj && !hasSk) {
            return res.status(400).json({
                success: false,
                message: 'Resume contains insufficient content to perform analysis. Please add personal info or at least one section.',
                data: null,
                error: 'Bad Request'
            });
        }

        const analysis = await geminiService.analyzeResume(resumeData);

        return res.status(200).json({
            success: true,
            message: 'AI Resume Analysis completed successfully.',
            analysis
        });

    } catch (error) {
        console.error('[AIController] Error processing analysis request:', error.message);

        // Classified Gemini errors → mapped status codes
        if (error instanceof GeminiServiceError) {
            const statusCode = ERROR_CODE_TO_HTTP[error.code] || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message,
                data: null,
                error: error.code
            });
        }

        // Unexpected non-Gemini errors
        return res.status(500).json({
            success: false,
            message: error.message || 'An unexpected error occurred while analyzing the resume.',
            data: null,
            error: 'Internal Server Error'
        });
    }
}

module.exports = {
    analyzeResumeController
};
