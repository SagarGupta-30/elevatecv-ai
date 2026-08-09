/**
 * ElevateCV AI — Skill Gap Controller (Sprint 3.5 AI Skill Gap Engine)
 *
 * Handles HTTP requests for POST /api/ai/skill-gap
 */

const skillGapService = require('../services/skillGapService');
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
 * Controller to handle POST /api/ai/skill-gap
 */
async function analyzeSkillGapController(req, res) {
    try {
        const { resumeData, targetRole } = req.body || {};

        if (!targetRole || typeof targetRole !== 'string' || targetRole.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Target role is required for Skill Gap Analysis.',
                data: null,
                error: 'Bad Request'
            });
        }

        if (!resumeData || typeof resumeData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Resume data is required to perform Skill Gap Analysis.',
                data: null,
                error: 'Bad Request'
            });
        }

        const result = await skillGapService.analyzeSkillGap({
            resumeData,
            targetRole: targetRole.trim()
        });

        return res.status(200).json({
            success: true,
            message: 'Skill Gap Analysis completed successfully.',
            gapReport: result
        });

    } catch (error) {
        console.error('[SkillGapController] Error processing request:', error.message);

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
            message: error.message || 'An unexpected error occurred while analyzing skill gap.',
            data: null,
            error: 'Internal Server Error'
        });
    }
}

module.exports = {
    analyzeSkillGapController
};
