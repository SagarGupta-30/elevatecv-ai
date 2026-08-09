/**
 * ElevateCV AI — Job Match Controller (Sprint 3.5 AI ATS Job Match Engine)
 *
 * Handles HTTP requests for POST /api/ai/job-match
 */

const jobMatchService = require('../services/jobMatchService');
const { GeminiServiceError } = require('../services/geminiService');

const ERROR_CODE_TO_HTTP = {
    MISSING_API_KEY: 503,
    QUOTA_EXCEEDED:  429,
    REQUEST_TIMEOUT: 504,
    EMPTY_RESPONSE:  500,
    INVALID_JSON:    500,
    GEMINI_ERROR:    500
};

/**
 * Controller to handle POST /api/ai/job-match
 */
async function analyzeJobMatchController(req, res) {
    try {
        const { resumeData, jobDescription, company, jobTitle } = req.body || {};

        if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Job description is required for ATS Job Match Analysis.',
                data: null,
                error: 'Bad Request'
            });
        }

        if (!resumeData || typeof resumeData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Resume data is required to perform ATS Job Match Analysis.',
                data: null,
                error: 'Bad Request'
            });
        }

        const result = await jobMatchService.analyzeJobMatch({
            resumeData,
            jobDescription: jobDescription.trim(),
            company: (company || '').trim(),
            jobTitle: (jobTitle || '').trim()
        });

        return res.status(200).json({
            success: true,
            message: 'ATS Job Match Analysis completed successfully.',
            matchReport: result
        });

    } catch (error) {
        console.error('[JobMatchController] Error processing request:', error.message);

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
            message: error.message || 'An unexpected error occurred while analyzing job match.',
            data: null,
            error: 'Internal Server Error'
        });
    }
}

module.exports = {
    analyzeJobMatchController
};
