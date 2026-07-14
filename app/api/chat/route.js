import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

// The client (components/MathTutor.js) builds its request/response
// expectations around Anthropic's Messages API shape — a top-level
// "system" string, and message "content" that's either a plain string or
// an array of blocks like { type: "image", source: { media_type, data } }
// / { type: "text", text }. This route accepts that same shape from the
// browser (so the UI never has to know which provider is behind it), and
// can serve it from Anthropic, OpenAI, or Gemini depending on which key(s)
// are configured.
//
// If CHAT_PROVIDER is set, only that provider is tried (no fallback —
// an explicit choice is respected as-is). Left unset, every configured
// provider is tried in order (Anthropic, then OpenAI, then Gemini) and
// the first one to succeed wins — so if one runs out of credits/quota,
// the request automatically falls through to the next instead of erroring.
const PROVIDER_ORDER = ["anthropic", "openai", "gemini"];

function hasKey(provider) {
  if (provider === "anthropic") return !!process.env.ANTHROPIC_API_KEY;
  if (provider === "openai") return !!process.env.OPENAI_API_KEY;
  if (provider === "gemini") return !!process.env.GEMINI_API_KEY;
  return false;
}

function resolveProviderChain() {
  const explicit = (process.env.CHAT_PROVIDER || "").toLowerCase();
  if (PROVIDER_ORDER.includes(explicit)) return [explicit];
  return PROVIDER_ORDER.filter(hasKey);
}

async function callAnthropic({ system, messages, max_tokens }) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // Anthropic's Messages API is exactly the shape the client already sends,
  // so messages/content blocks pass through untouched.
  return anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens,
    system,
    messages,
  });
}

function toOpenAiContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((block) => {
    if (block.type === "image") {
      return {
        type: "image_url",
        image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` },
      };
    }
    return { type: "text", text: block.text || "" };
  });
}

async function callOpenAI({ system, messages, max_tokens }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const openAiMessages = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages.map((m) => ({ role: m.role, content: toOpenAiContent(m.content) })),
  ];
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    max_tokens,
    messages: openAiMessages,
  });
  const text = completion.choices?.[0]?.message?.content || "";
  // Re-shaped to match what the client expects (Anthropic's content-block
  // array, which is the format the UI was originally written against).
  return { content: [{ type: "text", text }] };
}

function toGeminiParts(content) {
  if (typeof content === "string") return [{ text: content }];
  if (!Array.isArray(content)) return [{ text: "" }];
  return content.map((block) => {
    if (block.type === "image") {
      return { inlineData: { mimeType: block.source.media_type, data: block.source.data } };
    }
    return { text: block.text || "" };
  });
}

async function callGemini({ system, messages, max_tokens }) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: toGeminiParts(m.content),
  }));
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents,
    config: { systemInstruction: system, maxOutputTokens: max_tokens },
  });
  return { content: [{ type: "text", text: response.text || "" }] };
}

const PROVIDER_CALLERS = { anthropic: callAnthropic, openai: callOpenAI, gemini: callGemini };

export async function POST(request) {
  const providers = resolveProviderChain();
  if (providers.length === 0) {
    return Response.json(
      {
        error:
          "The tutor isn't configured yet — set ANTHROPIC_API_KEY, OPENAI_API_KEY, and/or GEMINI_API_KEY on the server.",
      },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { system, messages, max_tokens } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const clampedMaxTokens = Math.min(Math.max(Number(max_tokens) || 1000, 1), 4096);

  const failures = [];
  for (const provider of providers) {
    try {
      const result = await PROVIDER_CALLERS[provider]({ system, messages, max_tokens: clampedMaxTokens });
      return Response.json(result);
    } catch (err) {
      const message = err && err.message ? err.message : "Unknown error";
      console.error(`${provider} request failed:`, err?.status, message);
      failures.push(`${provider}: ${message}`);
    }
  }

  return Response.json({ error: failures.join(" | ") }, { status: 502 });
}
