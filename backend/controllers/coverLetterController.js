/**
 * ElevateCV AI — Cover Letter Controller (Sprint 3 AI Cover Letter Engine)
 *
 * Handles HTTP requests for POST /api/ai/cover-letter
 */

const coverLetterService = require('../services/coverLetterService');
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
 * Controller to handle POST /api/ai/cover-letter
 */
async function generateCoverLetterController(req, res) {
    try {
        const { resumeData, company, jobTitle, jobDescription, tone, length } = req.body || {};

        if (!company || typeof company !== 'string' || company.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required.',
                data: null,
                error: 'Bad Request'
            });
        }

        if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Job title is required.',
                data: null,
                error: 'Bad Request'
            });
        }

        if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Job description is required.',
                data: null,
                error: 'Bad Request'
            });
        }

        if (!resumeData || typeof resumeData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Resume data is required to generate a cover letter.',
                data: null,
                error: 'Bad Request'
            });
        }

        const result = await coverLetterService.generateCoverLetter({
            resumeData,
            company: company.trim(),
            jobTitle: jobTitle.trim(),
            jobDescription: jobDescription.trim(),
            tone: tone || 'professional',
            length: length || 'medium'
        });

        return res.status(200).json({
            success: true,
            message: 'Cover letter generated successfully.',
            coverLetter: result
        });

    } catch (error) {
        console.error('[CoverLetterController] Error processing request:', error.message);

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
            message: error.message || 'An unexpected error occurred while generating the cover letter.',
            data: null,
            error: 'Internal Server Error'
        });
    }
}

module.exports = {
    generateCoverLetterController
};
