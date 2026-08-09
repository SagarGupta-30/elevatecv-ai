/**
 * ElevateCV AI — Job Match Service (Sprint 3.5 AI ATS Job Match Engine)
 *
 * Integrates Google Gemini AI via @google/genai SDK to evaluate candidate resume data
 * against a target Job Description and produce a structured ATS compatibility report.
 */

const { GoogleGenAI } = require('@google/genai');
const { GeminiServiceError } = require('./geminiService');

const GEMINI_TIMEOUT_MS = 28_000; // 28 seconds

/**
 * Performs ATS Job Match Analysis comparing resume data against a Job Description.
 * @param {Object} opts - Parameters object
 * @param {Object} opts.resumeData - User resume JSON object
 * @param {string} opts.jobDescription - Target job description text
 * @param {string} [opts.company] - Optional target company name
 * @param {string} [opts.jobTitle] - Optional target job title
 * @returns {Promise<Object>} Job Match report JSON object
 * @throws {GeminiServiceError}
 */
async function analyzeJobMatch({ resumeData, jobDescription, company = '', jobTitle = '' }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiServiceError(
            'GEMINI_API_KEY environment variable is not configured.',
            'MISSING_API_KEY'
        );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) Auditor, Senior Technical Recruiter, and Talent Acquisition Specialist.
Your task is to thoroughly analyze the candidate's resume data against the provided target Job Description and compute an ATS compatibility report.

CANDIDATE RESUME DATA (SOURCE OF TRUTH):
${JSON.stringify(resumeData || {}, null, 2)}

TARGET JOB DETAILS:
- Company: ${company || 'N/A'}
- Job Title: ${jobTitle || 'N/A'}

TARGET JOB DESCRIPTION:
"${jobDescription}"

CRITICAL RULES:
1. The AI MUST NEVER invent candidate experience, skills, technologies, or achievements not present in the candidate resume data.
2. Only compare candidate facts against the job description requirements.
3. Compute objective percentage scores (0-100) for overallMatch, atsCompatibility, and keywordCoverage.
4. Extract specific keywords/skills present in the job description that ARE found in the resume (matchedKeywords) and those that ARE MISSING from the resume (missingKeywords).
5. Provide actionable, realistic strengths, weaknesses, and recommendations to help the candidate optimize their resume for this specific job.

You MUST respond strictly in valid JSON format matching this exact schema:
{
  "overallMatch": number (0-100),
  "atsCompatibility": number (0-100),
  "keywordCoverage": number (0-100),
  "missingKeywords": string[] (array of high-impact skills/keywords from the job description missing from candidate's resume),
  "matchedKeywords": string[] (array of skills/keywords from the job description successfully matched in candidate's resume),
  "strengths": string[] (3-5 specific matching highlights),
  "weaknesses": string[] (2-4 gap areas or missing qualifications),
  "recommendations": string[] (3-5 concrete action items to improve match score),
  "sectionScores": {
    "summary": number (0-100),
    "experience": number (0-100),
    "projects": number (0-100),
    "skills": number (0-100),
    "education": number (0-100)
  }
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
        parsed.overallMatch     = typeof parsed.overallMatch === 'number' ? parsed.overallMatch : 75;
        parsed.atsCompatibility = typeof parsed.atsCompatibility === 'number' ? parsed.atsCompatibility : 80;
        parsed.keywordCoverage  = typeof parsed.keywordCoverage === 'number' ? parsed.keywordCoverage : 70;
        parsed.missingKeywords  = Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [];
        parsed.matchedKeywords  = Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [];
        parsed.strengths        = Array.isArray(parsed.strengths) ? parsed.strengths : [];
        parsed.weaknesses       = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
        parsed.recommendations  = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

        if (!parsed.sectionScores || typeof parsed.sectionScores !== 'object') {
            parsed.sectionScores = { summary: 80, experience: 80, projects: 80, skills: 80, education: 80 };
        }

        return parsed;

    } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof GeminiServiceError) {
            console.error('[JobMatchService]', err.code, err.message);
            throw err;
        }

        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
            console.error('[JobMatchService] REQUEST_TIMEOUT: Gemini API did not respond within', GEMINI_TIMEOUT_MS, 'ms');
            throw new GeminiServiceError(
                'The ATS Job Match request timed out. Please try again.',
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
            console.error('[JobMatchService] QUOTA_EXCEEDED:', err.message);
            throw new GeminiServiceError(
                'Gemini API quota exceeded. Please try again later.',
                'QUOTA_EXCEEDED'
            );
        }

        console.error('[JobMatchService] GEMINI_ERROR:', err.message);
        throw new GeminiServiceError(
            `ATS Job Match Analysis failed: ${err.message}`,
            'GEMINI_ERROR'
        );
    }
}

module.exports = {
    analyzeJobMatch
};
