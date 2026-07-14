# Your Math Assistant — NCF 2023

A chapter-by-chapter AI maths tutor for Grade 4 (age 9-10), aligned to India's NCF 2023 primary maths textbooks. Built with Next.js (App Router) and the OpenAI API.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your OpenAI API key. Copy `.env.example` to `.env.local` and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   ```
   OPENAI_API_KEY=sk-...
   ```

   Get a key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys). Use a vision-capable model (the default, `gpt-4o-mini`, is fine) so the photo-upload feature keeps working — override with `OPENAI_MODEL` if you want a different one.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## What's here

- `components/MathTutor.js` — the whole tutor UI: chapter picker, spike abacus, live column-math calculator, Roman numeral converter, chat with voice input/output, photo upload, multi-language replies, "Deep Think" (visible reasoning), and "Multi-tutor" (rotating teaching personalities).
- `app/api/chat/route.js` — server route that forwards chat requests to the OpenAI API using `OPENAI_API_KEY`, translating between the request/response shape the UI uses and OpenAI's Chat Completions format. Never exposes the key to the browser.
- Adding a new chapter is data-only: add an entry to the `CHAPTERS` array in `components/MathTutor.js`.

## Note on the "Claude" tutor style

The Multi-tutor rotation includes a teaching persona named "Claude" (alongside Nova, Sage, Pixel, etc.) — that's just a character/personality description in the prompt, not a reference to which model is actually answering. Every tutor voice, including that one, runs on whatever `OPENAI_MODEL` you configure above.
