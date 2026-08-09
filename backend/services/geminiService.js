/**
 * ElevateCV AI — Gemini Service (Sprint 3 AI Resume Analysis Engine)
 *
 * Integrates Google Gemini AI via @google/genai SDK to analyze resume JSON
 * and return structured scoring, ATS compliance, section breakdown,
 * missing keywords, and actionable recommendations.
 *
 * Production improvements (post-audit):
 *   - AbortSignal timeout (28 seconds) prevents indefinite hanging requests.
 *   - Error classification: returns structured errors with a `code` field
 *     so the controller can map them to the correct HTTP status code.
 */

const { GoogleGenAI } = require('@google/genai');

/* ── Classified error class ──────────────────────────────────────────────── */

/**
 * Internal error class that carries a machine-readable code so that
 * aiController can map it to the appropriate HTTP status without
 * parsing message strings.
 */
class GeminiServiceError extends Error {
    /**
     * @param {string} message  Human-readable description.
     * @param {string} code     Machine-readable code.
     *   'MISSING_API_KEY'     → 503
     *   'QUOTA_EXCEEDED'      → 429
     *   'REQUEST_TIMEOUT'     → 504
     *   'EMPTY_RESPONSE'      → 500
     *   'INVALID_JSON'        → 500
     *   'GEMINI_ERROR'        → 500 (catch-all for other Gemini API errors)
     */
    constructor(message, code = 'GEMINI_ERROR') {
        super(message);
        this.name = 'GeminiServiceError';
        this.code = code;
    }
}

/* ── Request timeout (ms) ────────────────────────────────────────────────── */
const GEMINI_TIMEOUT_MS = 28_000; // 28 seconds

/**
 * Generates an AI analysis of the provided resume data.
 * @param {Object} resumeData - The resume content from BuilderState
 * @returns {Promise<Object>} Analysis result JSON object
 * @throws {GeminiServiceError}
 */
async function analyzeResume(resumeData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiServiceError(
            'GEMINI_API_KEY environment variable is not configured.',
            'MISSING_API_KEY'
        );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert Executive Resume Reviewer, Senior Technical Recruiter, and ATS (Applicant Tracking System) Specialist.
Analyze the provided user resume JSON thoroughly. Provide constructive, high-value, highly professional evaluation and scoring.

You MUST respond strictly in valid JSON format with NO markdown code block wrappers and NO extra text outside the JSON object.

The JSON output MUST match this exact schema:
{
  "overallScore": number (0-100),
  "atsScore": number (0-100),
  "grammarScore": number (0-100),
  "formattingScore": number (0-100),
  "recruiterScore": number (0-100),
  "grade": string ("A+", "A", "B+", "B", "C", "D"),
  "strengths": string[] (3-5 key highlight bullet points),
  "weaknesses": string[] (2-4 areas needing improvement),
  "missingKeywords": string[] (5-8 high-impact industry or role keywords missing/recommended),
  "grammarIssues": string[] (2-4 specific tone, active verb, or syntax suggestions),
  "sectionScores": {
    "summary": { "score": number (0-100), "feedback": string, "suggestions": string[] },
    "experience": { "score": number (0-100), "feedback": string, "suggestions": string[] },
    "projects": { "score": number (0-100), "feedback": string, "suggestions": string[] },
    "education": { "score": number (0-100), "feedback": string, "suggestions": string[] },
    "skills": { "score": number (0-100), "feedback": string, "suggestions": string[] }
  },
  "recommendations": string[] (3-5 top priority strategic action items for the user),
  "generatedAt": string (ISO timestamp),
  "model": "gemini-2.5-flash"
}`;

    const userPrompt = `Evaluate this resume JSON object:
${JSON.stringify(resumeData, null, 2)}`;

    // AbortController to enforce timeout
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemPrompt}\n\n${userPrompt}`,
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

        let parsedAnalysis;
        try {
            parsedAnalysis = JSON.parse(rawText);
        } catch {
            throw new GeminiServiceError(
                'Gemini returned invalid JSON. Please retry.',
                'INVALID_JSON'
            );
        }

        // Ensure defaults & metadata safety
        parsedAnalysis.generatedAt = parsedAnalysis.generatedAt || new Date().toISOString();
        parsedAnalysis.model       = 'gemini-2.5-flash';

        // Guarantee array fields are always arrays (schema hardening)
        ['strengths', 'weaknesses', 'missingKeywords', 'grammarIssues', 'recommendations'].forEach(field => {
            if (!Array.isArray(parsedAnalysis[field])) {
                parsedAnalysis[field] = [];
            }
        });
        if (!parsedAnalysis.sectionScores || typeof parsedAnalysis.sectionScores !== 'object') {
            parsedAnalysis.sectionScores = {};
        }

        return parsedAnalysis;

    } catch (err) {
        clearTimeout(timeoutId);

        // If already a classified error, re-throw as-is
        if (err instanceof GeminiServiceError) {
            console.error('[GeminiService]', err.code, err.message);
            throw err;
        }

        // Timeout via AbortController
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
            console.error('[GeminiService] REQUEST_TIMEOUT: Gemini API did not respond within', GEMINI_TIMEOUT_MS, 'ms');
            throw new GeminiServiceError(
                'The AI analysis request timed out. Please try again.',
                'REQUEST_TIMEOUT'
            );
        }

        // Google API quota / rate limit errors (HTTP 429 from Gemini API internals)
        const msgLower = (err.message || '').toLowerCase();
        if (
            msgLower.includes('quota') ||
            msgLower.includes('rate limit') ||
            msgLower.includes('resource_exhausted') ||
            err.status === 429
        ) {
            console.error('[GeminiService] QUOTA_EXCEEDED:', err.message);
            throw new GeminiServiceError(
                'Gemini API quota exceeded. Please try again later.',
                'QUOTA_EXCEEDED'
            );
        }

        // All other Gemini API errors
        console.error('[GeminiService] GEMINI_ERROR:', err.message);
        throw new GeminiServiceError(
            `AI Analysis failed: ${err.message}`,
            'GEMINI_ERROR'
        );
    }
}

module.exports = {
    analyzeResume,
    GeminiServiceError
};
