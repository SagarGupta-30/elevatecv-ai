/**
 * ElevateCV AI — Skill Gap Service (Sprint 3.5 AI Skill Gap Engine)
 *
 * Integrates Google Gemini AI via @google/genai SDK to compare candidate resume data
 * against a target job role and produce an AI-powered readiness score, skill gap breakdown,
 * 4-week learning roadmap, recommended projects, and certification suggestions.
 */

const { generateJSON } = require('./aiProvider');

/**
 * Performs Skill Gap Analysis comparing resume data against a target job role.
 * @param {Object} opts - Parameters object
 * @param {Object} opts.resumeData - User resume JSON object
 * @param {string} opts.targetRole - Target job role (e.g. 'Full Stack Developer', 'AI Engineer')
 * @returns {Promise<Object>} Skill Gap report JSON object
 */
async function analyzeSkillGap({ resumeData, targetRole }) {
    const systemPrompt = `You are a Senior Technical Architect, Engineering Director, and Tech Career Strategist.
Your task is to analyze the candidate's resume data against industry requirements for the target role "${targetRole}" and generate a personalized Skill Gap Analysis & 4-Week Learning Roadmap.

CANDIDATE RESUME DATA (SOURCE OF TRUTH):
${JSON.stringify(resumeData || {}, null, 2)}

TARGET ROLE: "${targetRole}"

CRITICAL RULES:
1. The AI MUST NEVER invent candidate experience, past jobs, or candidate projects not present in the candidate resume data.
2. Accurately identify skills currently present in the candidate's resume (currentSkills).
3. Identify missing essential skills for the target role "${targetRole}" (missingSkills).
4. Select 3-4 top priority skills to focus on first (prioritySkills).
5. Create a realistic 4-week structured learning roadmap with week number, title, and key topics for each week.
6. Suggest 2-3 practical, high-impact portfolio project ideas (recommendedProjects) and 2-3 recognized industry certifications (certifications).

You MUST respond strictly in valid JSON format matching this exact schema:
{
  "overallReadiness": number (0-100 score reflecting candidate's current readiness for targetRole),
  "estimatedReadinessAfterRoadmap": number (0-100 score reflecting expected readiness after completing roadmap),
  "currentSkills": string[] (skills present in resume relevant to targetRole),
  "missingSkills": string[] (crucial skills for targetRole missing from candidate's resume),
  "learningRoadmap": [
    {
      "week": number (1, 2, 3, 4),
      "title": string (module focus, e.g. "Docker & Containerization"),
      "topics": string[] (2-4 core subtopics)
    }
  ],
  "prioritySkills": string[] (3-4 top priority skills),
  "recommendedProjects": string[] (2-3 concrete project ideas to bridge skill gaps),
  "certifications": string[] (2-3 recognized certifications for targetRole)
}`;

    const parsed = await generateJSON({ systemPrompt });

    // Schema hardening
    parsed.overallReadiness = typeof parsed.overallReadiness === 'number' ? parsed.overallReadiness : 75;
    parsed.estimatedReadinessAfterRoadmap = typeof parsed.estimatedReadinessAfterRoadmap === 'number' ? parsed.estimatedReadinessAfterRoadmap : 92;
    parsed.currentSkills       = Array.isArray(parsed.currentSkills) ? parsed.currentSkills : [];
    parsed.missingSkills       = Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [];
    parsed.prioritySkills      = Array.isArray(parsed.prioritySkills) ? parsed.prioritySkills : [];
    parsed.learningRoadmap     = Array.isArray(parsed.learningRoadmap) ? parsed.learningRoadmap : [];
    parsed.recommendedProjects = Array.isArray(parsed.recommendedProjects) ? parsed.recommendedProjects : [];
    parsed.certifications      = Array.isArray(parsed.certifications) ? parsed.certifications : [];

    return parsed;
}

module.exports = {
    analyzeSkillGap
};
