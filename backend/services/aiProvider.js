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
 * Returns current AI provider configuration status safely (NO API keys or secrets exposed).
 * @returns {{ configured: boolean, provider: string, keyFormatValid: boolean }}
 */
function getAIStatus() {
    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (groqKey && groqKey.startsWith('gsk_')) {
        return {
            configured: true,
            provider: 'groq',
            keyFormatValid: true
        };
    } else if (geminiKey && geminiKey.length > 5) {
        return {
            configured: true,
            provider: 'gemini',
            keyFormatValid: true
        };
    } else if (groqKey) {
        return {
            configured: true,
            provider: 'groq',
            keyFormatValid: false
        };
    } else if (geminiKey) {
        return {
            configured: true,
            provider: 'gemini',
            keyFormatValid: false
        };
    }

    return {
        configured: false,
        provider: 'none',
        keyFormatValid: false
    };
}

/**
 * Logs safe AI provider diagnostic on application startup.
 * MUST NEVER print full/partial API keys or authorization credentials.
 */
function logAIConfig() {
    const status = getAIStatus();
    console.log('AI Provider Configuration:');
    console.log(`provider=${status.provider}`);
    console.log(`configured=${status.configured}`);
    console.log(`formatValid=${status.keyFormatValid}`);
}

/**
 * Generates JSON output from either Groq or Gemini based on the configured API key.
 * @param {Object} opts
 * @param {string} opts.systemPrompt - System instructions and JSON schema definition
 * @param {string} [opts.userPrompt] - Additional user prompt context (optional)
 * @param {number} [opts.timeoutMs] - Request timeout in ms
 * @returns {Promise<Object>} Parsed JSON object response
 */
async function generateJSON({ systemPrompt, userPrompt = '', timeoutMs = DEFAULT_TIMEOUT_MS }) {
    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

    let provider = null;
    let apiKey = '';

    if (groqKey && groqKey.startsWith('gsk_')) {
        provider = 'groq';
        apiKey = groqKey;
    } else if (geminiKey && geminiKey.length > 0) {
        provider = 'gemini';
        apiKey = geminiKey;
    } else if (groqKey) {
        throw new GeminiServiceError(
            'GROQ_API_KEY environment variable is invalid. Groq API keys must start with "gsk_".',
            'INVALID_API_KEY'
        );
    } else {
        throw new GeminiServiceError(
            'AI provider is not configured. Please set GROQ_API_KEY or GEMINI_API_KEY environment variable.',
            'MISSING_API_KEY'
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        let rawText = '';
        if (provider === 'groq') {
            const groq = new Groq({ apiKey });

            // Groq requires that system/user messages explicitly mention the string "json" when using response_format json_object
            let finalSystemPrompt = systemPrompt;
            if (!finalSystemPrompt.toLowerCase().includes('json')) {
                finalSystemPrompt += '\n\nRespond strictly in valid JSON format.';
            }

            const messages = [
                { role: 'system', content: finalSystemPrompt }
            ];
            if (userPrompt) {
                messages.push({ role: 'user', content: userPrompt });
            }

            let response;
            try {
                response = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages,
                    temperature: 0.2,
                    response_format: { type: 'json_object' }
                });
            } catch (groqErr) {
                const groqMsg = (groqErr.message || '').toLowerCase();
                if (groqErr.status === 404 || groqMsg.includes('model_not_found') || groqMsg.includes('decommissioned')) {
                    console.warn('[AIProvider] Groq model llama-3.3-70b-versatile failed, attempting fallback to llama-3.1-8b-instant...');
                    response = await groq.chat.completions.create({
                        model: 'llama-3.1-8b-instant',
                        messages,
                        temperature: 0.2,
                        response_format: { type: 'json_object' }
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
                model: 'gemini-2.0-flash',
                contents: fullContent,
                config: { responseMimeType: 'application/json' }
            });
            rawText = response.text || '';
        }

        clearTimeout(timeoutId);

        if (!rawText.trim()) {
            throw new GeminiServiceError(
                `Empty response received from ${provider === 'groq' ? 'Groq' : 'Gemini'} AI model.`,
                'EMPTY_RESPONSE'
            );
        }

        // Clean potential markdown code fence wrappers (```json ... ```)
        const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(cleanedText);
        } catch {
            throw new GeminiServiceError(
                `${provider === 'groq' ? 'Groq' : 'Gemini'} returned invalid JSON formatting. Please retry.`,
                'INVALID_JSON'
            );
        }

        return parsed;

    } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof GeminiServiceError) {
            console.error(`[AIProvider] [${err.code}] ${err.message}`);
            throw err;
        }

        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
            console.error('[AIProvider] REQUEST_TIMEOUT within', timeoutMs, 'ms');
            throw new GeminiServiceError(
                'AI provider request timed out.',
                'REQUEST_TIMEOUT'
            );
        }

        const status = err.status || err.statusCode || err.response?.status;
        const msgLower = (err.message || '').toLowerCase();

        console.error(`[AIProvider] Raw execution error (status=${status}):`, err.message);

        // 401 / 403 Authentication Error
        if (
            status === 401 ||
            status === 403 ||
            msgLower.includes('api key not valid') ||
            msgLower.includes('invalid api key') ||
            msgLower.includes('unauthorized') ||
            msgLower.includes('authentication failed')
        ) {
            throw new GeminiServiceError(
                'AI authentication failed. Check the configured API key.',
                'INVALID_API_KEY'
            );
        }

        // 429 Quota / Rate Limit Error
        if (
            status === 429 ||
            msgLower.includes('quota') ||
            msgLower.includes('rate limit') ||
            msgLower.includes('resource_exhausted') ||
            msgLower.includes('too many requests')
        ) {
            throw new GeminiServiceError(
                'AI provider rate limit reached. Please try again shortly.',
                'QUOTA_EXCEEDED'
            );
        }

        // 404 Model Not Found Error
        if (
            status === 404 ||
            msgLower.includes('model_not_found') ||
            msgLower.includes('model not found') ||
            msgLower.includes('unknown model') ||
            msgLower.includes('decommissioned')
        ) {
            throw new GeminiServiceError(
                'Configured AI model is unavailable.',
                'MODEL_NOT_FOUND'
            );
        }

        // 5xx Service Unavailable Error
        if (
            (status >= 500 && status < 600) ||
            msgLower.includes('service unavailable') ||
            msgLower.includes('internal server error') ||
            msgLower.includes('bad gateway')
        ) {
            throw new GeminiServiceError(
                'AI provider is temporarily unavailable.',
                'SERVICE_UNAVAILABLE'
            );
        }

        // Detailed processing error for bad requests, parameter mismatch, etc.
        throw new GeminiServiceError(
            `AI processing failed: ${err.message || 'Unknown error'}`,
            'AI_PROVIDER_ERROR'
        );
    }
}

module.exports = {
    generateJSON,
    getAIStatus,
    logAIConfig,
    GeminiServiceError
};

