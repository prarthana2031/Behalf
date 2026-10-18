// Minimal Claude client (no SDK). Returns null when no key is set so callers can fall back.
export const hasLLM = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function askJSON(system, user, maxTokens = 1800) {
  if (!hasLLM()) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: maxTokens,
        system: system + "\nReply with a single JSON object only. No prose, no code fences.",
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.map((c) => c.text || "").join("") || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
