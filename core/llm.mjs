// Minimal Anthropic/Ollama clients (no SDK). Returns null when no provider is available.
const provider = () => (process.env.LLM_PROVIDER || (process.env.ANTHROPIC_API_KEY ? "anthropic" : "none")).toLowerCase();
export const llmProvider = () => provider();
export const hasLLM = () => provider() === "ollama" || (provider() === "anthropic" && Boolean(process.env.ANTHROPIC_API_KEY));

function parseJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end >= start ? JSON.parse(text.slice(start, end + 1)) : null;
}

async function askOllama(system, user, maxTokens) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "qwen2.5:3b",
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: `${system}\nReply with a single JSON object only. No prose, no code fences.` },
        { role: "user", content: user },
      ],
      options: { num_predict: maxTokens, temperature: 0.3 },
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return parseJSON(data.message?.content || "");
}

export async function askJSON(system, user, maxTokens = 1800) {
  if (!hasLLM()) return null;
  try {
    if (provider() === "ollama") return await askOllama(system, user, maxTokens);
    if (provider() !== "anthropic") return null;
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
    return parseJSON(text);
  } catch {
    return null;
  }
}
