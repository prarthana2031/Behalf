import { askJSON } from "./llm.mjs";

const set = (a) => new Set((a || []).map((x) => x.toLowerCase()));
const overlap = (a, b) => [...set(a)].filter((x) => set(b).has(x));
const jac = (a, b) => { const u = new Set([...set(a), ...set(b)]); return u.size ? overlap(a, b).length / u.size : 0; };

// Cheap pre-score for every pair (used to shortlist who actually goes on a date).
export function chemistry(a, b) {
  const shared = { hobbies: overlap(a.hobbies, b.hobbies), interests: overlap(a.interests, b.interests), values: overlap(a.values, b.values) };
  const needsMet = (x, y) => overlap(x.needs, y.qualities).length / Math.max(1, (x.needs || []).length);
  const s = 0.25 * jac(a.hobbies, b.hobbies) + 0.25 * jac(a.interests, b.interests) + 0.2 * jac(a.values, b.values) + 0.15 * needsMet(a, b) + 0.15 * needsMet(b, a);
  return { pre: Math.min(95, Math.round(28 + s * 105)), shared };
}

const first = (p) => p.name.split(" ")[0];
const list = (a) => (a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a.at(-1) : a[0]);

function sourceNote(person, signal) {
  const evidence = (person.evidence || []).find((item) => item.toLowerCase().includes(String(signal || "").toLowerCase()));
  if (!evidence) return `${person.name}'s available profile tags list ${signal || "limited details"}; the source material does not answer more than that.`;
  return evidence.length > 220 ? `${evidence.slice(0, 217)}...` : evidence;
}

function scripted(a, b, shared, pre, date) {
  const A = first(a), B = first(b);
  const uniqueA = [...(a.interests || []), ...(a.hobbies || []), ...(a.values || [])].find((value) => ![...(b.interests || []), ...(b.hobbies || []), ...(b.values || [])].some((other) => other.toLowerCase() === value.toLowerCase()));
  const uniqueB = [...(b.interests || []), ...(b.hobbies || []), ...(b.values || [])].find((value) => ![...(a.interests || []), ...(a.hobbies || []), ...(a.values || [])].some((other) => other.toLowerCase() === value.toLowerCase()));
  const needA = (a.needs || []).find((need) => !(b.qualities || []).some((quality) => quality.toLowerCase() === need.toLowerCase())) || a.needs?.[0];
  const needB = (b.needs || []).find((need) => !(a.qualities || []).some((quality) => quality.toLowerCase() === need.toLowerCase())) || b.needs?.[0];
  const openQuestion = needA ? `How does ${needA} show up in everyday life, and what would help ${A} recognize it?` : `What does a good ordinary weekend look like for ${A} and ${B}?`;
  const sharedTags = [...shared.interests, ...shared.hobbies, ...shared.values];
  const sharedReason = sharedTags.length ? `Both profiles list ${list(sharedTags.slice(0, 3))}.` : "The profiles do not establish a shared interest yet.";
  return [
    { round: "01 · First impressions", from: "a", text: `${A}'s profile gives this first impression: ${sourceNote(a, a.headline || a.interests?.[0] || a.hobbies?.[0])} My starting fit hypothesis is ${pre}/100, based only on listed profile signals.` },
    { round: "01 · First impressions", from: "b", text: `${B}'s profile gives this first impression: ${sourceNote(b, b.headline || b.interests?.[0] || b.hobbies?.[0])} My starting fit hypothesis is also ${pre}/100; the score is a profile comparison, not a personal verdict.` },
    { round: "02 · A question that matters", from: "a", text: needA ? `${B}'s profile does not clearly establish whether ${B} can meet ${A}'s stated need for ${needA}. ${openQuestion}` : openQuestion },
    { round: "02 · A question that matters", from: "b", text: needA && (b.qualities || []).some((quality) => quality.toLowerCase() === needA.toLowerCase()) ? `The profile lists ${needA} as one of ${B}'s qualities, but that tag alone cannot explain how it shows up day to day.` : `The available sources do not answer that. Missing evidence is unknown, not a negative answer.` },
    { round: "03 · Difference or unknown?", from: "a", text: uniqueA ? `${A}'s profile lists ${uniqueA}; ${B}'s profile does not mention it. That is an information gap, not evidence that ${B} dislikes it.` : `${sharedReason} The sources do not establish a lifestyle conflict.` },
    { round: "03 · Difference or unknown?", from: "b", text: uniqueB ? `${B}'s profile also lists ${uniqueB}. We should ask about it directly rather than treating an unlisted preference as a disagreement.` : `Agreed. ${sharedReason} We have no source-backed reason to call a difference a conflict.` },
    { round: "04 · Revised judgment", from: "a", text: `This scripted exchange added no new facts about ${A}. I hold the profile-only hypothesis at ${date.aFinalScore ?? pre}/100; ${date.aWantsMore ? "I would continue exploring" : "I would not recommend a second date yet"}, with the unresolved question above.` },
    { round: "04 · Revised judgment", from: "b", text: `This scripted exchange added no new facts about ${B}. I hold the profile-only hypothesis at ${date.bFinalScore ?? pre}/100; ${date.bWantsMore ? "I would continue exploring" : "I would not recommend a second date yet"}.` },
  ];
}

export function conversationForDate(a, b, date) {
  const { pre, shared } = chemistry(a, b);
  return scripted(a, b, shared, pre, date);
}

export async function runDate(a, b, { requireLlm = false } = {}) {
  const { pre, shared } = chemistry(a, b);
  const slim = (p) => ({ name: p.name, headline: p.headline, summary: p.summary, needs: p.needs, hobbies: p.hobbies, interests: p.interests, qualities: p.qualities, values: p.values, looking_for: p.looking_for, dealbreakers: p.dealbreakers, evidence: p.evidence, confidence: p.confidence, confidence_note: p.confidence_note });
  const llm = await askJSON(
    `Two dating agents represent one person each. They know only the two supplied public-profile summaries and evidence. Run four rounds with two turns each: First impressions; A question that matters; Difference or unknown; Revised judgment. Label every turn with its round.
Do not invent personal facts or answer a question unless the supplied evidence supports it. An agent must say "unknown" when the source is silent; an unlisted preference is not a conflict. Each agent starts with an independent profile-only fit score, asks one targeted question about an unresolved need, considers one evidence-backed difference without treating it as automatically negative, then gives an independent final score and verdict. Do not claim the simulation discovered new biographical facts.
JSON: {"turns":[{"from":"a"|"b","round":"First impressions"|"A question that matters"|"Difference or unknown"|"Revised judgment","text":"..."}], "score":0-100, "chemistry":"...", "friction":"...", "first_date":"...", "a_initial_score":0-100, "b_initial_score":0-100, "a_final_score":0-100, "b_final_score":0-100, "open_question":"one question that could change the judgment", "disagreement_reason":"explain differing verdicts or say the agents agree", "a_wants_more":true|false, "b_wants_more":true|false}`,
    JSON.stringify({ agent_a: slim(a), agent_b: slim(b), prescore: pre }), 2200);
  if (requireLlm && !llm?.turns?.length) throw new Error("Claude date generation failed; configure ANTHROPIC_API_KEY and retry");
  if (llm?.turns?.length) {
    return {
      id: `${a.id}__${b.id}`, a: a.id, b: b.id, turns: llm.turns, score: llm.score, chemistry: llm.chemistry,
      friction: llm.friction, first_date: llm.first_date, aWantsMore: llm.a_wants_more, bWantsMore: llm.b_wants_more,
      aInitialScore: llm.a_initial_score ?? pre, bInitialScore: llm.b_initial_score ?? pre,
      aFinalScore: llm.a_final_score ?? llm.score, bFinalScore: llm.b_final_score ?? llm.score,
      openQuestion: llm.open_question, disagreementReason: llm.disagreement_reason, by: "claude",
    };
  }
  const score = Math.max(15, Math.min(97, pre + (overlap(a.needs, b.qualities).length + overlap(b.needs, a.qualities).length) * 4 - (overlap(a.dealbreakers, b.qualities).length + overlap(b.dealbreakers, a.qualities).length) * 15));
  const top = [...shared.hobbies, ...shared.interests];
  const result = {
    id: `${a.id}__${b.id}`, a: a.id, b: b.id, turns: [], score,
    chemistry: top.length ? `Shared ${list(top.slice(0, 3))}.` : "Little overlap on paper.",
    friction: overlap(a.dealbreakers, b.qualities).length || overlap(b.dealbreakers, a.qualities).length ? "A stated dealbreaker collides with the other's qualities." : "No hard conflicts found.",
    first_date: top[0] ? `Something around ${top[0]}.` : "A low-pressure coffee.", aWantsMore: score >= 60, bWantsMore: score >= 60,
    aInitialScore: pre, bInitialScore: pre, aFinalScore: pre, bFinalScore: pre,
    openQuestion: (a.needs || [])[0] ? `How does ${(a.needs || [])[0]} show up in everyday life, and what would help ${first(a)} recognize it?` : `What does a good ordinary weekend look like for ${first(a)} and ${first(b)}?`,
    disagreementReason: score >= 60 ? "Both agents favour continuing; the underlying profile evidence remains limited." : "Both agents pass on this profile-only fit; missing information is not treated as a conflict.",
    by: "keyword-fallback",
  };
  result.turns = scripted(a, b, shared, pre, result);
  return result;
}

// Final ranking: each person's list ordered by blended score (date score if they dated, pre-score otherwise).
export function rank(people, dates) {
  const byPair = new Map(dates.map((d) => [[d.a, d.b].sort().join("|"), d]));
  const out = {};
  for (const p of people) {
    out[p.id] = people.filter((q) => q.id !== p.id).map((q) => {
      const d = byPair.get([p.id, q.id].sort().join("|"));
      const pre = chemistry(p, q).pre;
      const mine = d ? (d.a === p.id ? d.aWantsMore : d.bWantsMore) : null;
      return { id: q.id, score: d ? Math.round(0.35 * pre + 0.65 * d.score) : Math.round(pre * 0.85), dated: Boolean(d), dateId: d?.id, wantsMore: mine };
    }).sort((x, y) => y.score - x.score);
  }
  return out;
}

// Who goes on dates: each person's top-K by pre-score, deduped.
export function shortlist(people, k = 3) {
  const pairs = new Map();
  for (const p of people) {
    people.filter((q) => q.id !== p.id).map((q) => [q, chemistry(p, q).pre]).sort((x, y) => y[1] - x[1]).slice(0, k)
      .forEach(([q]) => pairs.set([p.id, q.id].sort().join("|"), [p.id, q.id].sort()));
  }
  return [...pairs.values()];
}
