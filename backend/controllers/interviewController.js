/**
 * ElevateCV AI — Interview Controller (Sprint 3 AI Interview Prep Engine)
 *
 * Handles HTTP requests for POST /api/ai/interview
 */

const interviewService = require('../services/interviewService');
const { GeminiServiceError } = require('../services/geminiService');

const ERROR_CODE_TO_HTTP = {
    MISSING_API_KEY:     503,
    INVALID_API_KEY:     401,
    QUOTA_EXCEEDED:      429,
    MODEL_NOT_FOUND:     502,
    SERVICE_UNAVAILABLE: 503,
    REQUEST_TIMEOUT:     504,
    EMPTY_RESPONSE:      500,
    INVALID_JSON:        500,
    AI_PROVIDER_ERROR:   500,
    GEMINI_ERROR:        500
};

/**
 * Controller to handle POST /api/ai/interview
 */
async function generateInterviewPrepController(req, res) {
    try {
        const { resumeData, targetRole, company, jobDescription } = req.body || {};

        if (!targetRole || typeof targetRole !== 'string' || targetRole.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Target role is required.',
                data: null,
                error: 'Bad Request'
            });
        }

        if (!resumeData || typeof resumeData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Resume data is required to generate interview preparation.',
                data: null,
                error: 'Bad Request'
            });
        }

        const result = await interviewService.generateInterviewPrep({
            resumeData,
            targetRole: targetRole.trim(),
            company: (company || '').trim(),
            jobDescription: (jobDescription || '').trim()
        });

        return res.status(200).json({
            success: true,
            message: 'Interview Preparation Kit generated successfully.',
            prepKit: result
        });

    } catch (error) {
        console.error('[InterviewController] Error processing request:', error.message);

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
            message: error.message || 'An unexpected error occurred while generating interview prep.',
            data: null,
            error: 'Internal Server Error'
        });
    }
}

module.exports = {
    generateInterviewPrepController
};
