import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// The client (components/MathTutor.js) builds its request/response
// expectations around Anthropic's Messages API shape — a top-level
// "system" string, and message "content" that's either a plain string or
// an array of blocks like { type: "image", source: { media_type, data } }
// / { type: "text", text }. This route accepts that same shape from the
// browser (so the UI never has to know which provider is behind it), and
// can serve it from either Anthropic or OpenAI depending on which key(s)
// are configured — set CHAT_PROVIDER to force one, or leave it unset to
// auto-pick (Anthropic first, since its shape needs no translation, then
// OpenAI) based on whichever API key is actually present.
function resolveProvider() {
  const explicit = (process.env.CHAT_PROVIDER || "").toLowerCase();
  if (explicit === "anthropic" || explicit === "openai") return explicit;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
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

export async function POST(request) {
  const provider = resolveProvider();
  if (!provider) {
    return Response.json(
      {
        error:
          "The tutor isn't configured yet — set ANTHROPIC_API_KEY and/or OPENAI_API_KEY on the server.",
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

  try {
    const result =
      provider === "anthropic"
        ? await callAnthropic({ system, messages, max_tokens: clampedMaxTokens })
        : await callOpenAI({ system, messages, max_tokens: clampedMaxTokens });
    return Response.json(result);
  } catch (err) {
    const message = err && err.message ? err.message : "Unknown error";
    console.error(`${provider} request failed:`, err?.status, message);
    return Response.json({ error: message }, { status: 502 });
  }
}
