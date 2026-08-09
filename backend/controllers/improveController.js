/**
 * ElevateCV AI — Improve Controller (Sprint 3 AI Resume Improver Engine)
 *
 * Controller for POST /api/ai/improve
 */

const improveService = require('../services/improveService');
const { GeminiServiceError } = require('../services/geminiService');

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
 * Controller to handle POST /api/ai/improve
 */
async function improveTextController(req, res) {
    try {
        const { section, text } = req.body || {};

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Text to improve is required and cannot be empty.',
                data: null,
                error: 'Bad Request'
            });
        }

        const result = await improveService.improveText(section || 'general', text.trim());

        return res.status(200).json({
            success: true,
            message: 'Text improved successfully.',
            improvement: result
        });

    } catch (error) {
        console.error('[ImproveController] Error processing request:', error.message);

        if (error instanceof GeminiServiceError) {
            const statusCode = ERROR_CODE_TO_HTTP[error.code] || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message,
                data: null,
                error: error.code
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'An unexpected error occurred while improving text.',
            data: null,
            error: 'Internal Server Error'
        });
    }
}

module.exports = {
    improveTextController
};
