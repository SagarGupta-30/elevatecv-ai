/**
 * ElevateCV AI — Resume & Job Description Import Parsing Service
 * Extracts raw text from PDF, DOCX, DOC, TXT files and uses Gemini/Groq AI
 * to structure resume data into the exact ElevateCV Resume Mongoose schema.
 */

const fs = require('fs');
const { PDFParse } = require('pdf-parse'); // pdf-parse v2.x: exports PDFParse class, not a function
const mammoth = require('mammoth');
const { generateJSON, GeminiServiceError } = require('./aiProvider');

/**
 * Extracts raw plain text from a uploaded file buffer or path based on MIME/extension.
 */
async function extractRawText(filePath, mimeType, originalName = '') {
    const ext = originalName.split('.').pop().toLowerCase();

    if (ext === 'pdf' || mimeType.includes('pdf')) {
        const dataBuffer = fs.readFileSync(filePath);
        // pdf-parse v2.x API: class-based, no longer a direct function call
        const parser = new PDFParse({ data: dataBuffer, verbosity: 0 });
        await parser.load();
        const result = await parser.getText(); // returns { text, pages, total }
        await parser.destroy();
        return (result && result.text) ? result.text : '';
    } else if (ext === 'docx' || ext === 'doc' || mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value || '';
    } else if (ext === 'txt' || mimeType.includes('text/plain')) {
        return fs.readFileSync(filePath, 'utf8');
    } else {
        throw new Error('Unsupported file format. Please upload PDF, DOCX, DOC, or TXT.');
    }
}

/**
 * Parses raw resume text into structured ElevateCV JSON schema using AI.
 */
async function parseResumeFile(filePath, mimeType, originalName = '') {
    const rawText = await extractRawText(filePath, mimeType, originalName);

    if (!rawText || rawText.trim().length < 20) {
        throw new Error('Could not extract readable text from the uploaded file. Please ensure the document is not an empty or image-only scanned PDF.');
    }

    // Limit text length to prevent prompt token overflow
    const sanitizedText = rawText.replace(/\0/g, '').substring(0, 15000);

    const systemPrompt = `You are an expert AI Resume Parsing Engine for ElevateCV AI.
Your task is to parse raw un-structured resume text into a clean, complete, normalized JSON object matching the ElevateCV Resume schema.

Rules:
1. Return ONLY valid JSON with NO markdown formatting, NO \`\`\` code fences, and NO extra text outside JSON.
2. Extract all available contact details, work experiences, education history, projects, skills, certifications, and achievements.
3. Split skills into technical, soft, tools, and languages where possible.
4. Format dates logically (e.g., "Jan 2022", "2021", or "Present").
5. Provide a parseAnalysis object indicating which major fields were successfully populated and which are missing.

JSON Output Schema:
{
  "title": string (e.g. "Candidate Name - Professional Resume"),
  "personalInformation": {
    "fullName": string,
    "email": string,
    "phone": string,
    "address": string,
    "linkedin": string,
    "github": string,
    "portfolio": string
  },
  "professionalSummary": string,
  "education": [
    {
      "college": string,
      "degree": string,
      "branch": string,
      "cgpa": string,
      "startDate": string,
      "endDate": string,
      "isCurrent": boolean
    }
  ],
  "experience": [
    {
      "company": string,
      "role": string,
      "location": string,
      "startDate": string,
      "endDate": string,
      "isCurrent": boolean,
      "description": string[]
    }
  ],
  "projects": [
    {
      "title": string,
      "subtitle": string,
      "liveUrl": string,
      "githubUrl": string,
      "techStack": string[],
      "description": string[]
    }
  ],
  "skills": {
    "technical": string[],
    "soft": string[],
    "tools": string[],
    "languages": string[]
  },
  "certifications": [
    {
      "name": string,
      "issuer": string,
      "date": string,
      "credentialUrl": string
    }
  ],
  "achievements": [
    {
      "title": string,
      "description": string
    }
  ],
  "languages": [
    {
      "language": string,
      "proficiency": string
    }
  ],
  "interests": string[],
  "parseAnalysis": {
    "parsedFields": string[],
    "missingFields": string[],
    "qualityScore": number (0-100)
  }
}`;

    const userPrompt = `Parse this raw resume document text:\n\n${sanitizedText}`;

    const parsedData = await generateJSON({ systemPrompt, userPrompt });

    // Validate and sanitize parsed output
    parsedData.title = parsedData.title || (parsedData.personalInformation?.fullName ? `${parsedData.personalInformation.fullName}'s Resume` : 'Imported Resume');
    parsedData.personalInformation = parsedData.personalInformation || {};
    parsedData.personalInformation.fullName = parsedData.personalInformation.fullName || 'Candidate Name';
    // Use a placeholder email that passes regex validation when the PDF doesn't contain one
    parsedData.personalInformation.email = (parsedData.personalInformation.email && parsedData.personalInformation.email.includes('@'))
        ? parsedData.personalInformation.email
        : 'candidate@imported.resume';
    parsedData.education = Array.isArray(parsedData.education) && parsedData.education.length > 0
        ? parsedData.education
        : [{ college: '', degree: '', branch: '', cgpa: '', startDate: '', endDate: '' }];
    parsedData.experience = Array.isArray(parsedData.experience) ? parsedData.experience : [];
    parsedData.projects = Array.isArray(parsedData.projects) ? parsedData.projects : [];
    parsedData.skills = parsedData.skills || { technical: [], soft: [], tools: [], languages: [] };
    parsedData.parseAnalysis = parsedData.parseAnalysis || { parsedFields: [], missingFields: [], qualityScore: 80 };

    return {
        resume: parsedData,
        rawText: sanitizedText.substring(0, 500)
    };
}

/**
 * Extracts job description text from an uploaded file (PDF, DOCX, TXT).
 */
async function parseJobDescriptionFile(filePath, mimeType, originalName = '') {
    const rawText = await extractRawText(filePath, mimeType, originalName);
    if (!rawText || rawText.trim().length < 10) {
        throw new Error('Uploaded job description file is empty or could not be read.');
    }
    return rawText.replace(/\0/g, '').trim();
}

module.exports = {
    extractRawText,
    parseResumeFile,
    parseJobDescriptionFile
};
