/**
 * ElevateCV AI — Improve Service (Sprint 3 AI Resume Improver Engine)
 *
 * Integrates Google Gemini AI via @google/genai SDK to provide professional
 * rewrite suggestions for resume fields (summary, experience bullets, projects, skills, etc.).
 *
 * Enforces strict non-hallucination rules: improves wording, ATS compatibility,
 * action verbs, and clarity WITHOUT inventing new facts, companies, or fake metrics.
 */

const { generateJSON } = require('./aiProvider');

/**
 * Generates AI rewrite suggestions for a given resume section text.
 * @param {string} section - Section identifier (e.g. 'summary', 'experience', 'projects', 'skills')
 * @param {string} text - Original user text to be improved
 * @returns {Promise<Object>} Object with { improvedText, explanation, improvements }
 */
async function improveText(section, text) {
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

    const userPrompt = `Section: ${section}\nOriginal Text:\n"${text}"`;

    const parsed = await generateJSON({ systemPrompt, userPrompt });

    // Schema verification & fallback safety
    parsed.improvedText  = parsed.improvedText || text;
    parsed.explanation   = parsed.explanation  || 'Improved wording and clarity for ATS optimization.';
    if (!Array.isArray(parsed.improvements)) {
        parsed.improvements = ['Enhanced readability and action phrasing.'];
    }

    return parsed;
}

module.exports = {
    improveText
};
