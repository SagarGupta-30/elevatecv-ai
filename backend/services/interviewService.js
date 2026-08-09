/**
 * ElevateCV AI — Interview Service (Sprint 3 AI Interview Prep Engine)
 *
 * Integrates Google Gemini AI via @google/genai SDK to generate tailored interview
 * questions (Technical, HR, Project-Deep-Dive), model answers, difficulty ratings,
 * and preparation tips based on candidate resume data + target role.
 */

const { GoogleGenAI } = require('@google/genai');
const { GeminiServiceError } = require('./geminiService');

const GEMINI_TIMEOUT_MS = 28_000; // 28 seconds

/**
 * Generates AI interview prep Q&A kit based on candidate resume and target role.
 * @param {Object} opts - Parameters object
 * @param {Object} opts.resumeData - User resume JSON object
 * @param {string} opts.targetRole - Target job title / role
 * @param {string} [opts.company] - Target company name (optional)
 * @param {string} [opts.jobDescription] - Target job description (optional)
 * @returns {Promise<Object>} Interview prep JSON object
 * @throws {GeminiServiceError}
 */
async function generateInterviewPrep({ resumeData, targetRole, company = '', jobDescription = '' }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiServiceError(
            'GEMINI_API_KEY environment variable is not configured.',
            'MISSING_API_KEY'
        );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a Principal Engineering Director, Senior Technical Interviewer, and Executive Hiring Manager.
Your task is to generate a comprehensive, highly realistic Interview Preparation Kit for a candidate based on their resume data and target role.

CANDIDATE RESUME DATA (SOURCE OF TRUTH):
${JSON.stringify(resumeData || {}, null, 2)}

TARGET ROLE DETAILS:
- Role: ${targetRole || 'Software Engineer'}
- Company: ${company || 'Target Company'}
- Job Description: "${jobDescription || 'N/A'}"

STRICT CRITICAL RULES:
1. Base all technical questions and project-deep-dive questions strictly on the technologies, skills, and projects listed in the candidate's resume data.
2. NEVER invent experience, projects, or tools that do not exist in the candidate's resume data.
3. Provide realistic, articulate, STAR-method model answers that showcase candidate achievements accurately.
4. Categorize technical questions by difficulty ("Easy", "Medium", "Hard").

You MUST respond strictly in valid JSON format matching this exact schema:
{
  "technicalQuestions": [
    {
      "question": string,
      "modelAnswer": string,
      "tips": string,
      "difficulty": string ("Easy" | "Medium" | "Hard")
    }
  ],
  "hrQuestions": [
    {
      "question": string,
      "modelAnswer": string,
      "tips": string
    }
  ],
  "projectQuestions": [
    {
      "question": string,
      "modelAnswer": string,
      "project": string (name of the specific project from candidate's resume)
    }
  ],
  "overallPreparationTips": [
    string (3-5 strategic interview preparation action items)
  ]
}`;

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        clearTimeout(timeoutId);

        const rawText = response.text;
        if (!rawText) {
            throw new GeminiServiceError(
                'Empty response received from Gemini AI model.',
                'EMPTY_RESPONSE'
            );
        }

        let parsed;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            throw new GeminiServiceError(
                'Gemini returned invalid JSON. Please retry.',
                'INVALID_JSON'
            );
        }

        // Schema hardening
        parsed.technicalQuestions = Array.isArray(parsed.technicalQuestions) ? parsed.technicalQuestions : [];
        parsed.hrQuestions        = Array.isArray(parsed.hrQuestions) ? parsed.hrQuestions : [];
        parsed.projectQuestions   = Array.isArray(parsed.projectQuestions) ? parsed.projectQuestions : [];
        parsed.overallPreparationTips = Array.isArray(parsed.overallPreparationTips) ? parsed.overallPreparationTips : [];

        return parsed;

    } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof GeminiServiceError) {
            console.error('[InterviewService]', err.code, err.message);
            throw err;
        }

        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
            console.error('[InterviewService] REQUEST_TIMEOUT: Gemini API did not respond within', GEMINI_TIMEOUT_MS, 'ms');
            throw new GeminiServiceError(
                'The interview prep request timed out. Please try again.',
                'REQUEST_TIMEOUT'
            );
        }

        const msgLower = (err.message || '').toLowerCase();
        if (
            msgLower.includes('quota') ||
            msgLower.includes('rate limit') ||
            msgLower.includes('resource_exhausted') ||
            err.status === 429
        ) {
            console.error('[InterviewService] QUOTA_EXCEEDED:', err.message);
            throw new GeminiServiceError(
                'Gemini API quota exceeded. Please try again later.',
                'QUOTA_EXCEEDED'
            );
        }

        console.error('[InterviewService] GEMINI_ERROR:', err.message);
        throw new GeminiServiceError(
            `Interview Prep generation failed: ${err.message}`,
            'GEMINI_ERROR'
        );
    }
}

module.exports = {
    generateInterviewPrep
};
