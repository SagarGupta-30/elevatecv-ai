/**
 * ElevateCV AI — Interview Service (Sprint 3 AI Interview Prep Engine)
 *
 * Integrates Google Gemini AI via @google/genai SDK to generate tailored interview
 * questions (Technical, HR, Project-Deep-Dive), model answers, difficulty ratings,
 * and preparation tips based on candidate resume data + target role.
 */

const { generateJSON } = require('./aiProvider');

/**
 * Generates AI interview prep Q&A kit based on candidate resume and target role.
 * @param {Object} opts - Parameters object
 * @param {Object} opts.resumeData - User resume JSON object
 * @param {string} opts.targetRole - Target job title / role
 * @param {string} [opts.company] - Target company name (optional)
 * @param {string} [opts.jobDescription] - Target job description (optional)
 * @returns {Promise<Object>} Interview prep JSON object
 */
async function generateInterviewPrep({ resumeData, targetRole, company = '', jobDescription = '' }) {
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

    const parsed = await generateJSON({ systemPrompt });

    // Schema hardening & normalization
    const techRaw = Array.isArray(parsed.technicalQuestions) ? parsed.technicalQuestions : [];
    const hrRaw   = Array.isArray(parsed.hrQuestions) ? parsed.hrQuestions : [];
    const projRaw = Array.isArray(parsed.projectQuestions) ? parsed.projectQuestions : [];
    const tipsRaw = Array.isArray(parsed.overallPreparationTips) ? parsed.overallPreparationTips : [];

    parsed.technicalQuestions = techRaw.map(q => ({
        question: String(q.question || q.questionText || q.title || q.q || '').trim(),
        modelAnswer: String(q.modelAnswer || q.answer || q.model_answer || q.response || '').trim(),
        tips: String(q.tips || q.tip || q.strategicTip || '').trim(),
        difficulty: (q.difficulty && ['Easy', 'Medium', 'Hard'].includes(q.difficulty)) ? q.difficulty : 'Medium'
    })).filter(q => q.question.length > 0 && q.modelAnswer.length > 0);

    parsed.hrQuestions = hrRaw.map(q => ({
        question: String(q.question || q.questionText || q.title || q.q || '').trim(),
        modelAnswer: String(q.modelAnswer || q.answer || q.model_answer || q.response || '').trim(),
        tips: String(q.tips || q.tip || q.strategicTip || '').trim()
    })).filter(q => q.question.length > 0 && q.modelAnswer.length > 0);

    parsed.projectQuestions = projRaw.map(q => ({
        question: String(q.question || q.questionText || q.title || q.q || '').trim(),
        modelAnswer: String(q.modelAnswer || q.answer || q.model_answer || q.response || '').trim(),
        project: String(q.project || q.projectName || q.project_name || '').trim()
    })).filter(q => q.question.length > 0 && q.modelAnswer.length > 0);

    parsed.overallPreparationTips = tipsRaw
        .map(t => (typeof t === 'string' ? t.trim() : (t?.tip || t?.advice || '')))
        .filter(t => t.length > 0);

    return parsed;
}

module.exports = {
    generateInterviewPrep
};
