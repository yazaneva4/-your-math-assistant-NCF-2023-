import Anthropic from "@anthropic-ai/sdk";

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "The tutor isn't configured yet — ANTHROPIC_API_KEY is missing on the server.",
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

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: Math.min(Math.max(Number(max_tokens) || 1000, 1), 4096),
      system,
      messages,
    });
    return Response.json(response);
  } catch (err) {
    const message = err && err.message ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
