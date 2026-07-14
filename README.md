# Your Math Assistant — NCF 2023

A chapter-by-chapter AI maths tutor for Grade 4 (age 9-10), aligned to India's NCF 2023 primary maths textbooks. Built with Next.js (App Router). Chat requests can be served by **Anthropic (Claude)**, **OpenAI**, or **Google Gemini**.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add an API key. Copy `.env.example` to `.env.local` and fill in as many providers as you like:

   ```bash
   cp .env.example .env.local
   ```

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=...
   ```

   - Anthropic key: [console.anthropic.com](https://console.anthropic.com/)
   - OpenAI key: [platform.openai.com/api-keys](https://platform.openai.com/api-keys) — use a vision-capable model (the default, `gpt-4o-mini`, is fine) so the photo-upload feature keeps working.
   - Gemini key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

   If `CHAT_PROVIDER` is unset, every provider with a key configured is tried in order — **Anthropic, then OpenAI, then Gemini** — and the first one to actually succeed answers the request. So if one runs out of credits or hits a quota limit, the request automatically falls through to the next configured provider instead of failing outright. Set `CHAT_PROVIDER` to `anthropic`, `openai`, or `gemini` to force a single provider with no fallback.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## What's here

- `components/MathTutor.js` — the whole tutor UI: chapter picker, spike abacus, live column-math calculator, Roman numeral converter, chat with voice input/output, photo upload, multi-language replies, "Deep Think" (visible reasoning), and "Multi-tutor" (rotating teaching personalities).
- `app/api/chat/route.js` — server route that forwards chat requests to whichever provider(s) are configured, cascading through them in order on failure, and translating between the request/response shape the UI uses (Anthropic's Messages API format) and each provider's own format. Never exposes any key to the browser.
- Adding a new chapter is data-only: add an entry to the `CHAPTERS` array in `components/MathTutor.js`.

## Note on the "Claude" tutor style

The Multi-tutor rotation includes a teaching persona named "Claude" (alongside Nova, Sage, Pixel, etc.) — that's just a character/personality description in the prompt, not a reference to which model is actually answering. Every tutor voice, including that one, runs on whichever provider ends up serving the request.
