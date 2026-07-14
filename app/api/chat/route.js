import OpenAI from "openai";

// The client (components/MathTutor.js) builds its request/response
// expectations around Anthropic's Messages API shape — a top-level
// "system" string, and message "content" that's either a plain string or
// an array of blocks like { type: "image", source: { media_type, data } }
// / { type: "text", text }. This route accepts that same shape from the
// browser (so the UI never has to know which provider is behind it) and
// translates it to/from OpenAI's Chat Completions format here.
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

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "The tutor isn't configured yet — OPENAI_API_KEY is missing on the server.",
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

  const openai = new OpenAI({ apiKey });

  const openAiMessages = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages.map((m) => ({ role: m.role, content: toOpenAiContent(m.content) })),
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: Math.min(Math.max(Number(max_tokens) || 1000, 1), 4096),
      messages: openAiMessages,
    });

    const text = completion.choices?.[0]?.message?.content || "";
    // Re-shaped to match what the client expects (mirrors the Anthropic
    // content-block array it was originally written against).
    return Response.json({ content: [{ type: "text", text }] });
  } catch (err) {
    const message = err && err.message ? err.message : "Unknown error";
    console.error("OpenAI request failed:", err?.status, message);
    return Response.json({ error: message }, { status: 502 });
  }
}
