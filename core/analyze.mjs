import { askJSON, llmProvider } from "./llm.mjs";
import { readLinkedIn, readInstagram, parseLinkedIn, parseInstagram } from "./scrape.mjs";

const SYSTEM = `You are a person's dating agent. You have read exactly two sources about them: their public LinkedIn and public Instagram. Build their profile.
Only state what the sources support; if thin, say so in "confidence_note" and keep lists short rather than inventing.
JSON keys: name, headline, location, summary (2 sentences, plain), needs[] (what they likely need in a partner/relationship, 3-5), hobbies[] (3-6), interests[] (3-6), qualities[] (3-6), values[] (2-4), looking_for (1 sentence), dealbreakers[] (0-3), evidence[] (3-5 short quotes or facts from the sources, each prefixed "LinkedIn:" or "Instagram:"), confidence ("high"|"medium"|"low"), confidence_note.
Use short lowercase tags for hobbies/interests/qualities/values/needs.`;

// Keyword lexicon used only when no LLM key is configured.
const LEX = {
  hobbies: { hiking: /hik|trek|trail/, running: /run|marathon/, cooking: /cook|chef|recipe|foodie/, photography: /photo/, travel: /travel|wander|passport/, music: /music|guitar|piano|dj\b|concert/, reading: /book|read/, yoga: /yoga|meditat/, gym: /gym|fitness|lift/, art: /art|paint|design/, gaming: /gaming|gamer/, cycling: /cycl|bike/ },
  interests: { ai: /\bai\b|machine learning|llm|agent/, startups: /startup|founder|venture/, security: /security|cyber|infosec/, cloud: /cloud|aws|devops|kubernetes/, climate: /climate|sustainab/, health: /health|medic/, finance: /financ|invest|fintech/, education: /teach|educat/, product: /product (manager|design)/ },
  qualities: { curious: /learn|curio|explor/, driven: /lead|build|ship|scale|drive/, creative: /creat|design|craft/, caring: /mentor|volunteer|care|communit/, analytical: /data|analy|research|engineer/ },
};
function heuristic(li, ig) {
  const text = JSON.stringify([li, ig]).toLowerCase();
  const pick = (map) => Object.entries(map).filter(([, re]) => re.test(text)).map(([k]) => k).slice(0, 6);
  const hobbies = pick(LEX.hobbies), interests = pick(LEX.interests), qualities = pick(LEX.qualities);
  const slug = li?.slug || ig?.handle || "unknown";
  const name = (li?.name && !/linkedin/i.test(li.name) ? li.name.split(" - ")[0] : null) || ig?.name?.split(/[(@•]/)[0].trim() || slug.replace(/[-_.]+/g, " ").replace(/\d+/g, "").trim();
  const thin = li?.via === "handle-only" || ig?.via === "handle-only";
  return {
    name: name.replace(/\b\w/g, (c) => c.toUpperCase()), headline: li?.headline || ig?.bio || "", location: li?.location || "",
    summary: thin ? "One or both profiles could only be read at handle level, so this read is thin." : `Read from ${li?.via} and ${ig?.via}.`,
    needs: qualities.includes("caring") ? ["emotional warmth", "shared purpose"] : ["shared ambition", "good conversation"],
    hobbies, interests, qualities, values: [], looking_for: "", dealbreakers: [], evidence: [li?.headline && `LinkedIn: ${li.headline}`, ig?.bio && `Instagram: ${ig.bio}`].filter(Boolean),
    confidence: thin ? "low" : "medium", confidence_note: thin ? "Limited public profile metadata; no LLM key configured." : "Keyword-level read (no LLM key configured).",
  };
}

export async function readPerson(linkedinUrl, instagramUrl, { requireLlm = false } = {}) {
  const [li, ig] = await Promise.all([readLinkedIn(linkedinUrl), readInstagram(instagramUrl)]);
  if (!li.ok) throw new Error(li.error);
  if (!ig.ok) throw new Error(ig.error);
  const llm = await askJSON(SYSTEM, JSON.stringify({ linkedin: li, instagram: ig }));
  if (requireLlm && !llm) throw new Error("Claude profile analysis failed; configure ANTHROPIC_API_KEY and retry");
  const profile = llm || heuristic(li, ig);
  const id = (parseLinkedIn(linkedinUrl) || parseInstagram(instagramUrl)).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id, linkedin: linkedinUrl, instagram: instagramUrl, ...profile,
    sources: { linkedin: li.via, instagram: ig.via }, analyzedBy: llm ? llmProvider() : "keyword-fallback", readAt: new Date().toISOString(),
  };
}
