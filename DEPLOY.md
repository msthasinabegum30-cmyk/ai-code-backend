# AI Code Backend - Deploy Guide (Banglish)

## Ki eita?
Tomar nijer server - Gemini, Groq, DeepSeek, OpenRouter (Grok, Qwen) ke call kore
HTML/SVG animation code banay dey. API key server e thake, browser e jay na.

## Step 1: API Key naw (free)

**Gemini (free):**
1. https://aistudio.google.com/apikey khulo
2. "Create API Key" chap daw
3. Key copy koro

**Groq (free tier):**
1. https://console.groq.com/keys khulo
2. "Create API Key" chap daw
3. Key copy koro

**OpenRouter (Grok, Qwen, aro onek - ek key te sob):**
1. https://openrouter.ai/keys khulo
2. Key banaw, copy koro

Jekono ekta holei cholbe. Beshi model chaile sob gular key naw.

## Step 2: Render e deploy (free)

1. https://render.com e account khulo (GitHub diye login easy)
2. Ei `ai-code-backend` folder ta GitHub e push koro
3. Render dashboard → "New +" → "Web Service"
4. Tomar GitHub repo select koro
5. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. **Environment Variables** e key gula add koro:
   - `GEMINI_API_KEY` = tomar key
   - `GROQ_API_KEY` = tomar key
   - `DEEPSEEK_API_KEY` = tomar key
   - `OPENROUTER_API_KEY` = tomar key
   - (jeta nai, oita bad daw - khali rakhle hobe na, add e korba na)
7. "Create Web Service" chap daw
8. 2-3 min wait koro - URL paba, jemon: `https://tomar-app.onrender.com`

**Key kokhono code e likhba na, kawke diba na!**

## Step 3: Tool e connect koro

1. Animation Code Generator tool khulo
2. "AI Server URL" field e tomar Render URL bosaw
   - jemon: `https://tomar-app.onrender.com`
3. Provider select koro (Gemini / Groq / DeepSeek / OpenRouter)
4. Description likho → Generate chap daw → AI code likhe dibe!

## Reference Image (AI analyze korbe)

1. Tool e "Reference Image" button e image upload koro
2. Description likho (jemon "ei image er style e animation banaw")
3. AI Generate chap daw → AI image analyze kore matching code likhbe

**Image support:**
- Gemini: ✅ image analyze kore
- OpenRouter (Grok/Qwen): ✅ image analyze kore
- Groq: ✅ vision model e image analyze kore
- DeepSeek: ❌ image support nai - text prompt only

## Test

Browser e khulo: `https://tomar-app.onrender.com/providers`
Provider list dekhale server OK!

## Somossa hole

- "API key set koro" error → Environment variable thik ase kina dekho
- Server slow (free tier ghumay) → prothom request e 30-60 sec lagte pare, normal
- Key invalid → key abar copy kore bosaw, space jeno na thake
