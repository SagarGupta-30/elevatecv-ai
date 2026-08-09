/**
 * ElevateCV AI — Cover Letter Service (Sprint 3 AI Cover Letter Engine)
 *
 * Integrates Google Gemini AI via @google/genai SDK to generate professional,
 * ATS-optimized, recruiter-ready cover letters from user resume data + target job description.
 *
 * Enforces strict non-hallucination rules: only uses facts present in the resume.
 */

const { generateJSON } = require('./aiProvider');

/**
 * Generates an AI cover letter tailored to a job description using resume data.
 * @param {Object} opts - Parameters object
 * @param {Object} opts.resumeData - User resume JSON object
 * @param {string} opts.company - Target company name
 * @param {string} opts.jobTitle - Target job title
 * @param {string} opts.jobDescription - Target job description text
 * @param {string} [opts.tone='professional'] - Tone (professional, formal, friendly, confident)
 * @param {string} [opts.length='medium'] - Target length (short, medium, long)
 * @returns {Promise<Object>} Object containing { title, coverLetter, wordCount, generatedAt, model }
 */
async function generateCoverLetter({ resumeData, company, jobTitle, jobDescription, tone = 'professional', length = 'medium' }) {
    let wordCountTarget = 'approximately 300-350 words';
    if (length === 'short')   wordCountTarget = 'approximately 180-220 words';
    if (length === 'long')    wordCountTarget = 'approximately 450-500 words';

    const systemPrompt = `You are a Senior Hiring Manager, Executive Resume Writer, and ATS (Applicant Tracking System) Specialist.
Your task is to write a highly persuasive, recruiter-ready, ATS-optimized cover letter for a candidate applying to a target role.

CANDIDATE DATA (SOURCE OF TRUTH):
${JSON.stringify(resumeData || {}, null, 2)}

TARGET ROLE DETAILS:
- Company: ${company || 'Target Company'}
- Job Title: ${jobTitle || 'Target Position'}
- Tone: ${tone}
- Target Length: ${wordCountTarget}

JOB DESCRIPTION:
"${jobDescription}"

CRITICAL NON-HALLUCINATION RULES:
1. NEVER invent past experience, companies, job titles, degrees, or certifications not present in the candidate data.
2. NEVER fabricate metrics, performance numbers, or achievements not explicitly stated in the candidate data.
3. Only reference facts, skills, technologies, and achievements that exist inside the candidate data.
4. If a qualification requested in the job description is not present in the candidate's resume, omit it naturally without making up information.
5. Adopt the requested tone (${tone}) while maintaining executive professionalism.

You MUST respond strictly in valid JSON format matching this exact schema:
{
  "title": string (e.g. "Cover Letter - ${jobTitle} at ${company}"),
  "coverLetter": string (the full formatted cover letter text with proper paragraph spacing),
  "wordCount": number (total word count of the cover letter text)
}`;

    const parsed = await generateJSON({ systemPrompt });

    const letterText = parsed.coverLetter || '';
    const calculatedWordCount = letterText.trim() ? letterText.trim().split(/\s+/).length : 0;

    return {
        title:       parsed.title       || `Cover Letter - ${jobTitle} at ${company}`,
        coverLetter: letterText,
        wordCount:   parsed.wordCount   || calculatedWordCount,
        generatedAt: parsed.generatedAt || new Date().toISOString()
    };
}

module.exports = {
    generateCoverLetter
};
