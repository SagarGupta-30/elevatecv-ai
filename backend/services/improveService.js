/**
 * ElevateCV AI — Improve Service (Sprint 3 AI Resume Improver Engine)
 *
 * Integrates Google Gemini AI via @google/genai SDK to provide professional
 * rewrite suggestions for resume fields (summary, experience bullets, projects, skills, etc.).
 *
 * Enforces strict non-hallucination rules: improves wording, ATS compatibility,
 * action verbs, and clarity WITHOUT inventing new facts, companies, or fake metrics.
 */

const { GoogleGenAI } = require('@google/genai');
const { GeminiServiceError } = require('./geminiService');

const GEMINI_TIMEOUT_MS = 28_000; // 28 seconds

/**
 * Generates AI rewrite suggestions for a given resume section text.
 * @param {string} section - Section identifier (e.g. 'summary', 'experience', 'projects', 'skills')
 * @param {string} text - Original user text to be improved
 * @returns {Promise<Object>} Object with { improvedText, explanation, improvements }
 * @throws {GeminiServiceError}
 */
async function improveText(section, text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiServiceError(
            'GEMINI_API_KEY environment variable is not configured.',
            'MISSING_API_KEY'
        );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a Senior Executive Resume Writer and Top ATS (Applicant Tracking System) Recruiter.
Your task is to refine and rewrite the user's provided resume text for the "${section || 'general'}" section to maximize recruiter impact and ATS scanability.

STRICT CRITICAL RULES:
1. Do NOT invent new experience, companies, job titles, degrees, or certifications.
2. Do NOT add fake numbers, arbitrary percentages, or hallucinated metrics.
3. Keep all factual details (tools, dates, technologies) 100% accurate to the original input.
4. Transform passive language into strong, high-impact action verbs (e.g., "Led", "Architected", "Engineered", "Optimized").
5. Fix grammar, spelling, punctuation, and awkward phrasing.
6. Enhance clarity, conciseness, and executive presentation.

You MUST respond strictly in valid JSON format matching this exact schema:
{
  "improvedText": string (the polished, professional rewrite),
  "explanation": string (a brief 1-2 sentence overview of why this rewrite is stronger),
  "improvements": string[] (3-4 bullet points detailing specific changes made, e.g. "Replaced passive verbs with active phrasing", "Enhanced ATS keyword density")
}`;

    const userPrompt = `Section: ${section}
Original Text:
"${text}"`;

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

        let parsed;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            throw new GeminiServiceError(
                'Gemini returned invalid JSON. Please retry.',
                'INVALID_JSON'
            );
        }

        // Schema verification & fallback safety
        parsed.improvedText  = parsed.improvedText || text;
        parsed.explanation   = parsed.explanation  || 'Improved wording and clarity for ATS optimization.';
        if (!Array.isArray(parsed.improvements)) {
            parsed.improvements = ['Enhanced readability and action phrasing.'];
        }

        return parsed;

    } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof GeminiServiceError) {
            console.error('[ImproveService]', err.code, err.message);
            throw err;
        }

        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
            console.error('[ImproveService] REQUEST_TIMEOUT: Gemini API did not respond within', GEMINI_TIMEOUT_MS, 'ms');
            throw new GeminiServiceError(
                'The AI improvement request timed out. Please try again.',
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
            console.error('[ImproveService] QUOTA_EXCEEDED:', err.message);
            throw new GeminiServiceError(
                'Gemini API quota exceeded. Please try again later.',
                'QUOTA_EXCEEDED'
            );
        }

        console.error('[ImproveService] GEMINI_ERROR:', err.message);
        throw new GeminiServiceError(
            `AI Improvement failed: ${err.message}`,
            'GEMINI_ERROR'
        );
    }
}

module.exports = {
    improveText
};
