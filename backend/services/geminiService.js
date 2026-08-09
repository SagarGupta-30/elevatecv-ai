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

const { generateJSON, GeminiServiceError } = require('./aiProvider');

/**
 * Generates an AI analysis of the provided resume data.
 * @param {Object} resumeData - The resume content from BuilderState
 * @returns {Promise<Object>} Analysis result JSON object
 * @throws {GeminiServiceError}
 */
async function analyzeResume(resumeData) {
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
  "recommendations": string[] (3-5 top priority strategic action items for the user)
}`;

    const userPrompt = `Evaluate this resume JSON object:\n${JSON.stringify(resumeData, null, 2)}`;

    const parsed = await generateJSON({ systemPrompt, userPrompt });

    // Schema hardening & default metadata
    parsed.generatedAt = parsed.generatedAt || new Date().toISOString();
    ['strengths', 'weaknesses', 'missingKeywords', 'grammarIssues', 'recommendations'].forEach(field => {
        if (!Array.isArray(parsed[field])) parsed[field] = [];
    });
    if (!parsed.sectionScores || typeof parsed.sectionScores !== 'object') {
        parsed.sectionScores = {};
    }

    return parsed;
}

module.exports = {
    analyzeResume,
    GeminiServiceError
};

module.exports = {
    analyzeResume,
    GeminiServiceError
};
