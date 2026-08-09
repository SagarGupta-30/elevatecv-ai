/**
 * ElevateCV AI — Unified AI Provider Service
 * Supports both Google Gemini SDK and Groq SDK seamlessly based on API key format.
 */

const { GoogleGenAI } = require('@google/genai');
const { Groq } = require('groq-sdk');
/**
 * Internal error class carrying a machine-readable code for HTTP mapping
 */
class GeminiServiceError extends Error {
    constructor(message, code = 'GEMINI_ERROR') {
        super(message);
        this.name = 'GeminiServiceError';
        this.code = code;
    }
}

const DEFAULT_TIMEOUT_MS = 28_000; // 28s timeout

/**
 * Generates JSON output from either Groq or Gemini based on the configured API key.
 * @param {Object} opts
 * @param {string} opts.systemPrompt - System instructions and JSON schema definition
 * @param {string} [opts.userPrompt] - Additional user prompt context (optional)
 * @param {number} [opts.timeoutMs] - Request timeout in ms
 * @returns {Promise<Object>} Parsed JSON object response
 */
async function generateJSON({ systemPrompt, userPrompt = '', timeoutMs = DEFAULT_TIMEOUT_MS }) {
    const apiKey = (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        throw new GeminiServiceError(
            'No AI API key configured. Please set GEMINI_API_KEY or GROQ_API_KEY environment variable.',
            'MISSING_API_KEY'
        );
    }

    const isGroq = apiKey.startsWith('gsk_');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        let rawText = '';
        if (isGroq) {
            const groq = new Groq({ apiKey });
            const messages = [
                { role: 'system', content: systemPrompt }
            ];
            if (userPrompt) {
                messages.push({ role: 'user', content: userPrompt });
            }

            // Attempt with llama-3.3-70b-versatile (fallback to llama3-70b-8192 if needed)
            let response;
            try {
                response = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages,
                    temperature: 0.2,
                    response_format: { type: 'json_object' }
                });
            } catch (groqErr) {
                if (groqErr.status === 404 || groqErr.message?.includes('model')) {
                    response = await groq.chat.completions.create({
                        model: 'llama3-70b-8192',
                        messages,
                        temperature: 0.2
                    });
                } else {
                    throw groqErr;
                }
            }
            rawText = response?.choices?.[0]?.message?.content || '';
        } else {
            const ai = new GoogleGenAI({ apiKey });
            const fullContent = userPrompt ? `${systemPrompt}\n\n${userPrompt}` : systemPrompt;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullContent,
                config: { responseMimeType: 'application/json' }
            });
            rawText = response.text || '';
        }

        clearTimeout(timeoutId);

        if (!rawText.trim()) {
            throw new GeminiServiceError(
                `Empty response received from ${isGroq ? 'Groq' : 'Gemini'} AI model.`,
                'EMPTY_RESPONSE'
            );
        }

        // Clean any potential markdown code fence wrappers (```json ... ```)
        const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(cleanedText);
        } catch {
            throw new GeminiServiceError(
                `${isGroq ? 'Groq' : 'Gemini'} returned invalid JSON. Please retry.`,
                'INVALID_JSON'
            );
        }

        return parsed;

    } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof GeminiServiceError) {
            console.error('[AIProvider]', err.code, err.message);
            throw err;
        }

        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
            console.error('[AIProvider] REQUEST_TIMEOUT within', timeoutMs, 'ms');
            throw new GeminiServiceError(
                'The AI request timed out. Please try again.',
                'REQUEST_TIMEOUT'
            );
        }

        const msgLower = (err.message || '').toLowerCase();
        if (
            msgLower.includes('api key') ||
            msgLower.includes('api_key') ||
            msgLower.includes('invalid_argument') ||
            err.status === 401 ||
            err.status === 400
        ) {
            console.error('[AIProvider] INVALID_API_KEY:', err.message);
            throw new GeminiServiceError(
                'Invalid AI API key provided. Please verify your GEMINI_API_KEY / GROQ_API_KEY environment variable.',
                'INVALID_API_KEY'
            );
        }

        if (
            msgLower.includes('quota') ||
            msgLower.includes('rate limit') ||
            msgLower.includes('resource_exhausted') ||
            err.status === 429
        ) {
            console.error('[AIProvider] QUOTA_EXCEEDED:', err.message);
            throw new GeminiServiceError(
                'AI service quota or rate limit exceeded. Please try again later.',
                'QUOTA_EXCEEDED'
            );
        }

        console.error('[AIProvider] UNHANDLED_ERROR:', err.message);
        throw new GeminiServiceError(
            `AI processing failed: ${err.message}`,
            'GEMINI_ERROR'
        );
    }
}

module.exports = {
    generateJSON,
    GeminiServiceError
};
