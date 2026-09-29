const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait a few minutes and try again.'
  }
});

app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Universal AI Explainer API',
    model: DEFAULT_MODEL,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

function parseGeminiJson(rawText) {
  if (!rawText) {
    return {
      explanation: '',
      key_points: []
    };
  }

  let cleaned = rawText.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  try {
    const parsed = JSON.parse(cleaned);

    return {
      explanation:
        typeof parsed.explanation === 'string'
          ? parsed.explanation
          : String(parsed.explanation || ''),

      key_points:
        Array.isArray(parsed.key_points)
          ? parsed.key_points.map(String)
          : []
    };
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          explanation:
            typeof parsed.explanation === 'string'
              ? parsed.explanation
              : String(parsed.explanation || ''),

          key_points:
            Array.isArray(parsed.key_points)
              ? parsed.key_points.map(String)
              : []
        };
      } catch {}
    }

    return {
      explanation: rawText,
      key_points: []
    };
  }
}

app.post('/api/verify-key', async (req, res) => {
  const apiKey =
    req.body?.apiKey ||
    req.headers['x-api-key'] ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      valid: false,
      error: 'No Gemini API key provided.'
    });
  }

  try {
    const url =
      `${GEMINI_API_URL}/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Reply with only the word OK.'
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 5
        }
      })
    });

    if (response.ok) {
      return res.json({ valid: true });
    }

    const errorBody = await response.text();

    let message = errorBody;

    try {
      message =
        JSON.parse(errorBody)?.error?.message ||
        errorBody;
    } catch {}

    return res.status(response.status).json({
      valid: false,
      error: message
    });

  } catch (error) {
    return res.status(500).json({
      valid: false,
      error: `Network error connecting to Gemini: ${error.message}`
    });
  }
});

app.post('/api/explain', async (req, res) => {
  const {
    selected_text,
    content_type = 'text',
    explain_style = 'simple',
    target_language = 'English',
    indian_nuance = true,
    page_url
  } = req.body;

  if (
    !selected_text ||
    typeof selected_text !== 'string' ||
    !selected_text.trim()
  ) {
    return res.status(400).json({
      error:
        'Invalid request: "selected_text" is required and must be a non-empty string.'
    });
  }

  const apiKey =
    req.headers['x-api-key'] ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(401).json({
      error:
        'Gemini API key is missing. Set GEMINI_API_KEY in server/.env.'
    });
  }

  let styleGuidance = '';

  switch (explain_style.toLowerCase()) {
    case 'technical':
      styleGuidance =
        'Target Audience: Technical developer. Focus on architecture, mechanics, data structures, edge cases and performance.';
      break;

    case 'detailed':
      styleGuidance =
        'Target Audience: In-depth learner. Give a comprehensive but clear explanation with practical examples.';
      break;

    case 'simple':
    default:
      styleGuidance =
        'Target Audience: Beginner. Explain like I am five. Use simple language, intuitive analogies and avoid unnecessary jargon.';
      break;
  }

  let culturalNuance = '';
  if (indian_nuance) {
    culturalNuance =
      'Teaching Style: Friendly Indian English Mentor. Use a warm, encouraging tone and relatable everyday analogies (such as cricket, trains, chai stalls, UPI/daily tech) that make complex concepts click effortlessly.';
  }

  let languageInstruction = '';
  if (target_language && target_language.toLowerCase() !== 'english') {
    languageInstruction = `Output Language: Respond ENTIRELY in ${target_language}. Translate the explanation and key points accurately into ${target_language}.`;
  }

  const systemPrompt = [
    'You are an expert AI assistant that explains complex text and code clearly.',
    styleGuidance,
    culturalNuance,
    languageInstruction,
    'Always return ONLY a valid JSON object using exactly this structure:',
    '{',
    '  "explanation": "Clear explanation tailored to the requested style.",',
    '  "key_points": ["First takeaway", "Second takeaway", "Third takeaway"]',
    '}',
    'Do not use markdown code fences.',
    'Do not add any text before or after the JSON object.'
  ].filter(Boolean).join('\n');

  const isCode =
    content_type.toLowerCase() === 'code';

  let userPrompt = '';

  if (isCode) {
    userPrompt = [
      `Explain the following code. Explanation style: ${explain_style.toUpperCase()}.`,
      'Break down what it does step by step.',
      'Explain important parts in simple language.',
      'Give a simple example or analogy when useful.',
      'Provide 2 to 4 key takeaways.',
      page_url
        ? `Source page: ${page_url}`
        : '',
      'Code:',
      '```',
      selected_text.trim(),
      '```'
    ]
      .filter(Boolean)
      .join('\n\n');
  } else {
    userPrompt = [
      `Explain the following text. Explanation style: ${explain_style.toUpperCase()}.`,
      'Simplify technical or difficult terms.',
      'Keep the explanation accurate and easy to understand.',
      'Provide 2 to 4 key takeaways.',
      page_url
        ? `Source page: ${page_url}`
        : '',
      'Text:',
      '"""',
      selected_text.trim(),
      '"""'
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const url =
      `${GEMINI_API_URL}/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: systemPrompt
            }
          ]
        },

        contents: [
          {
            role: 'user',
            parts: [
              {
                text: userPrompt
              }
            ]
          }
        ],

        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      }),

      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      return res.status(429).json({
        error:
          'Gemini API rate limit reached. Please wait and try again.'
      });
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      return res.status(response.status).json({
        error:
          'Gemini authentication failed. Check your API key.'
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();

      let message = errorBody;

      try {
        message =
          JSON.parse(errorBody)?.error?.message ||
          errorBody;
      } catch {}

      return res.status(response.status).json({
        error:
          `Gemini API error (${response.status}): ${message}`
      });
    }

    const data = await response.json();

    const rawContent =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const result =
      parseGeminiJson(rawContent);

    return res.json({
      explanation: result.explanation,
      key_points: result.key_points
    });

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        error:
          'Request timed out waiting for Gemini API.'
      });
    }

    console.error(
      '[Server Error /api/explain]:',
      error
    );

    return res.status(500).json({
      error:
        'Internal server error while processing the explanation.',
      details: error.message
    });
  }
});

app.post('/api/translate', async (req, res) => {
  const { text, explanation, key_points, target_language = 'Hindi' } = req.body;

  const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'Gemini API key is missing.' });
  }

  try {
    const isStructured = Boolean(explanation);
    const systemPrompt = isStructured
      ? `You are an expert multilingual translator. Translate the provided explanation and key takeaways into ${target_language}. Always return ONLY valid JSON: { "explanation": "...", "key_points": ["..."] }. Do not wrap in markdown fences.`
      : `You are an expert translator. Translate the provided text into ${target_language}. Always return ONLY valid JSON: { "translated_text": "..." }. Do not wrap in markdown fences.`;

    const userPrompt = isStructured
      ? JSON.stringify({ explanation, key_points: key_points || [] })
      : text;

    const url = `${GEMINI_API_URL}/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${err}` });
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseGeminiJson(rawContent);

    if (isStructured) {
      return res.json({
        explanation: parsed.explanation,
        key_points: parsed.key_points || [],
        target_language
      });
    } else {
      return res.json({
        translated_text: parsed.translated_text || parsed.explanation || rawContent,
        target_language
      });
    }
  } catch (err) {
    console.error('[Server Error /api/translate]:', err);
    return res.status(500).json({ error: 'Translation error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(
    `[Universal AI Explainer Backend] Server running on http://localhost:${PORT}`
  );

  console.log(
    `- Health Check: http://localhost:${PORT}/health`
  );

  console.log(
    `- Explain Endpoint: http://localhost:${PORT}/api/explain`
  );

  console.log(
    `- Configured Model: ${DEFAULT_MODEL}`
  );

  console.log(
    `- Gemini API Key Status: ${
      process.env.GEMINI_API_KEY
        ? 'Configured'
        : 'Missing'
    }`
  );
});