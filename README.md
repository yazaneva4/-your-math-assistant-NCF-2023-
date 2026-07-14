# Your Math Assistant — NCF 2023

A chapter-by-chapter AI maths tutor for Grade 4 (age 9-10), aligned to India's NCF 2023 primary maths textbooks. Built with Next.js (App Router) and the Claude API.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your Anthropic API key. Copy `.env.example` to `.env.local` and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   Get a key from [console.anthropic.com](https://console.anthropic.com/). This app calls the **Anthropic Claude API** (the chat request/response shapes used throughout — `system` prompt, `content` blocks, image `source.media_type`/`data` — are Anthropic's Messages API format), so it needs `ANTHROPIC_API_KEY`, not an OpenAI key.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## What's here

- `components/MathTutor.js` — the whole tutor UI: chapter picker, spike abacus, live column-math calculator, Roman numeral converter, chat with voice input/output, photo upload, multi-language replies, "Deep Think" (visible reasoning), and "Multi-tutor" (rotating teaching personalities).
- `app/api/chat/route.js` — server route that forwards chat requests to the Claude API using `ANTHROPIC_API_KEY`. Never exposes the key to the browser.
- Adding a new chapter is data-only: add an entry to the `CHAPTERS` array in `components/MathTutor.js`.
