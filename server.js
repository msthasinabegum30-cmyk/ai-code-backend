// AI Code Backend - Multi-AI proxy for HTML/SVG animation code generation
// Providers: Gemini, Groq, DeepSeek, OpenRouter (Grok, Qwen, aro onek)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const PORT = process.env.PORT || 3000;

// ---------- System prompt: AI ke bole animation code likhte ----------
const SYSTEM_PROMPT = `You are an expert motion graphics coder. Write clean, single-file HTML with embedded CSS/SVG/Canvas animation code.
Rules:
- Output ONLY the HTML code, no explanations, no markdown fences.
- Single file, no external dependencies (no CDN, no images).
- 1920x1080 canvas/stage where relevant, 60fps smooth animation.
- Premium easing, no jitter. No text watermarks, no logos, no brand names.
- No burned-in captions unless the user explicitly asks for text.
- The animation must loop seamlessly if it is a loop type.
- If a reference image is provided: analyze its colors, shapes, style, mood and subject. Create animation code that MATCHES the image's visual identity - same color palette, same style, recognizable elements from the image brought to life with motion. Do not just describe the image; make it move.`;

// ---------- Provider configs ----------
const PROVIDERS = {
  gemini: {
    name: 'Gemini',
    needsKey: 'GEMINI_API_KEY',
    model: 'gemini-2.0-flash',
    async call(apiKey, prompt, image) {
      const parts = [{ text: prompt }];
      if (image && image.data) {
        parts.push({ inlineData: { mimeType: image.mimeType || 'image/png', data: image.data } });
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 8000 }
        })
      });
      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  },
  groq: {
    name: 'Groq',
    needsKey: 'GROQ_API_KEY',
    model: 'llama-3.3-70b-versatile',
    visionModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    async call(apiKey, prompt, image) {
      const useVision = !!(image && image.data);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: useVision ? this.visionModel : this.model,
          messages: openAiVisionMessages(prompt, image),
          temperature: 0.9,
          max_tokens: 8000
        })
      });
      if (!res.ok) throw new Error(`Groq error: ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  },
  deepseek: {
    name: 'DeepSeek',
    needsKey: 'DEEPSEEK_API_KEY',
    model: 'deepseek-chat',
    async call(apiKey, prompt, image) {
      if (image && image.data) {
        throw new Error('DeepSeek e image analysis support nai - Gemini ba OpenRouter use koro');
      }
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.9,
          max_tokens: 8000
        })
      });
      if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  },
  openrouter: {
    name: 'OpenRouter (Grok, Qwen, aro onek)',
    needsKey: 'OPENROUTER_API_KEY',
    model: 'x-ai/grok-4.1-fast',
    async call(apiKey, prompt, image, model) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://animation-code-generator/',
          'X-Title': 'Animation Code Generator'
        },
        body: JSON.stringify({
          model: model || this.model,
          messages: openAiVisionMessages(prompt, image),
          temperature: 0.9,
          max_tokens: 8000
        })
      });
      if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }
};

function openAiVisionMessages(prompt, image) {
  const userContent = [{ type: 'text', text: prompt }];
  if (image && image.data) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${image.mimeType || 'image/png'};base64,${image.data}` }
    });
  }
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ];
}

// ---------- Helpers ----------
function cleanCode(raw) {
  let code = (raw || '').trim();
  // markdown fence thakle soray daw
  code = code.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  return code.trim();
}

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'ai-code-backend', providers: Object.keys(PROVIDERS) });
});

app.get('/providers', (req, res) => {
  const list = Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    name: p.name,
    keyConfigured: !!process.env[p.needsKey]
  }));
  res.json({ providers: list });
});

app.post('/generate', async (req, res) => {
  try {
    const { provider, prompt, model, apiKey: sessionKey, image, regenerate, attempt, inspiredBy } = req.body;

    if (!provider || !PROVIDERS[provider]) {
      return res.status(400).json({ ok: false, error: 'Valid provider daw: gemini, groq, deepseek, openrouter' });
    }
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ ok: false, error: 'Animation description likho (minimum 3 character)' });
    }
    // Image thakle validate koro
    let refImage = null;
    if (image && image.data) {
      if (typeof image.data !== 'string' || image.data.length > 12 * 1024 * 1024) {
        return res.status(400).json({ ok: false, error: 'Image boro hoye gese - choto image daw' });
      }
      refImage = { data: image.data, mimeType: image.mimeType || 'image/png' };
    }

    const p = PROVIDERS[provider];
    // Key priority: session key (tool theke pathano) > server env key
    const apiKey = (sessionKey && sessionKey.trim()) || process.env[p.needsKey];
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: `${p.name} er API key set koro` });
    }

    const fullPrompt = refImage
      ? `Create a motion graphics animation based on the attached reference image: ${prompt.trim()}. Analyze the image first, then write matching animation code.`
      : `Create a motion graphics animation: ${prompt.trim()}`;

    // Regenerate: protibar genuinely notun style
    const styleTwists = [
      'Use a BOLD NEON/GLOW aesthetic with dark background, luminous edges and energetic motion.',
      'Use a SOFT PASTEL minimal aesthetic with gentle easing, clean shapes and calm motion.',
      'Use a 3D-ISOMETRIC look with depth, layered parallax and dimensional motion.',
      'Use a PAPER-CUT / COLLAGE style with textured layers and playful staggered motion.',
      'Use a GRADIENT-MESH premium style with flowing color transitions and smooth morphing.',
      'Use a MONOCHROME high-contrast style with striking black/white dynamics.',
      'Use a RETRO-VINTAGE style with warm tones, grain texture feel and classic easing.',
      'Use a GEOMETRIC-ABSTRACT style with bold shapes, rotations and rhythmic patterns.'
    ];
    let finalPrompt = fullPrompt;
    // Competitor-inspired: same niche, different execution (similarity safe)
    if (inspiredBy && typeof inspiredBy === 'string' && inspiredBy.trim().length > 3) {
      finalPrompt += `\n\nINSPIRATION MODE: The user described a competitor file: "${inspiredBy.trim()}". Create an animation in the SAME NICHE that appeals to the same buyers, but with CLEARLY DIFFERENT execution: different color palette, different composition, different motion style. Must NOT look like a copy - an original take on the same popular theme. Keep quality premium.`;
    }
    if (regenerate) {
      const n = Math.max(1, parseInt(attempt) || 1);
      const twist = styleTwists[(n - 1) % styleTwists.length];
      finalPrompt += `\n\nIMPORTANT - REGENERATION #${n}: Create a COMPLETELY DIFFERENT visual style from any default version. ${twist} Different color palette, different motion feel, different composition. Must NOT look similar to a standard version of this concept.`;
    }

    let raw = await p.call(apiKey, finalPrompt, refImage, model);
    const code = cleanCode(raw);

    if (!code || code.length < 50) {
      return res.status(502).json({ ok: false, error: 'AI khali response dise - abar try koro' });
    }

    res.json({ ok: true, provider, code });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ ok: false, error: 'Server error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI Code Backend cholche port ${PORT} e`);
  console.log('Providers:', Object.keys(PROVIDERS).join(', '));
});
