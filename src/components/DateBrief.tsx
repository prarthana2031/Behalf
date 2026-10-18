import { chemistry } from "../../core/dating.mjs";
import type { DateRec, Person, Rank } from "@/lib/store";

type SignalGroup = { label: string; first: string[]; second: string[] };

function evidenceFor(person: Person, signal: string) {
  const evidence = person.evidence?.find((item) => item.toLowerCase().includes(signal.toLowerCase()));
  if (!evidence) return { source: "Profile tags", text: `Listed as ${signal} in ${person.name}'s profile.` };
  const match = evidence.match(/^(LinkedIn|Instagram):\s*/i);
  const source = match?.[1] || "Profile";
  const fullText = evidence.slice(match?.[0].length || 0).trim();
  const point = fullText.toLowerCase().indexOf(signal.toLowerCase());
  const start = point > 70 ? point - 55 : 0;
  const end = Math.min(fullText.length, start + 150);
  const excerpt = `${start ? "…" : ""}${fullText.slice(start, end).trim()}${end < fullText.length ? "…" : ""}`;
  return { source, text: excerpt };
}

function comparable(values: string[] = []) {
  return values.map((value) => value.trim()).filter(Boolean);
}

export default function DateBrief({ a, b, date, people, rankings }: { a: Person; b: Person; date: DateRec; people: Person[]; rankings: Record<string, Rank[]> }) {
  const groups: SignalGroup[] = [
    { label: "interest", first: comparable(a.interests), second: comparable(b.interests) },
    { label: "hobby", first: comparable(a.hobbies), second: comparable(b.hobbies) },
    { label: "value", first: comparable(a.values), second: comparable(b.values) },
  ];
  const sparks = groups.flatMap((group) => {
    const secondValues = new Set(group.second.map((value) => value.toLowerCase()));
    return group.first
      .filter((value) => secondValues.has(value.toLowerCase()))
      .map((value) => ({ value, label: group.label }));
  }).slice(0, 2);

  const aNeed = a.needs?.find((need) => !b.qualities?.some((quality) => quality.toLowerCase() === need.toLowerCase()));
  const bNeed = b.needs?.find((need) => !a.qualities?.some((quality) => quality.toLowerCase() === need.toLowerCase()));
  const exploringPerson = aNeed ? a : bNeed ? b : undefined;
  const need = aNeed || bNeed;
  const other = exploringPerson?.id === a.id ? b : a;
  const hasLimitedSignal = date.by === "keyword-fallback" || [a, b].some((person) => person.confidence === "low" || person.analyzedBy === "keyword-fallback");
  const profileFit = chemistry(a, b).pre;
  const assessments = [
    { person: a, initial: date.aInitialScore ?? profileFit, final: date.aFinalScore ?? (date.by === "keyword-fallback" ? profileFit : date.score), wantsMore: date.aWantsMore, other: b },
    { person: b, initial: date.bInitialScore ?? profileFit, final: date.bFinalScore ?? (date.by === "keyword-fallback" ? profileFit : date.score), wantsMore: date.bWantsMore, other: a },
  ];
  const rankFor = (person: Person, match: Person, initial: boolean) => {
    if (!initial) {
      const rank = rankings[person.id]?.findIndex((item) => item.id === match.id) ?? -1;
      return rank < 0 ? null : rank + 1;
    }
    const ordered = people.filter((item) => item.id !== person.id)
      .map((item) => ({ id: item.id, score: chemistry(person, item).pre }))
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
    const rank = ordered.findIndex((item) => item.id === match.id);
    return rank < 0 ? null : rank + 1;
  };
  const question = date.openQuestion || (need && exploringPerson
    ? `How does ${need} show up in everyday life, and what would help ${exploringPerson.name.split(" ")[0]} recognize it?`
    : `What does a good ordinary weekend look like for ${a.name.split(" ")[0]} and ${b.name.split(" ")[0]}?`);
  const disagreement = date.disagreementReason || (date.aWantsMore !== date.bWantsMore
    ? "The agents reached different verdicts; the stored dialogue does not explain why."
    : "The agents reached the same verdict; no disagreement was recorded.");

  return (
    <section className="date-brief" aria-labelledby="brief-title">
      <div className="brief-heading">
        <div><p className="eyebrow">Before they meet</p><h2 id="brief-title">The first-date brief</h2></div>
        <span className={`brief-signal ${hasLimitedSignal ? "limited" : ""}`}>{date.by === "keyword-fallback" ? "Scripted exploration" : hasLimitedSignal ? "Limited profile signal" : "Profile signals available"}</span>
      </div>
      <div className="brief-grid">
        <div className="brief-block">
          <span className="brief-label">Two sparks</span>
          {sparks.length ? sparks.map((spark) => {
            const aEvidence = evidenceFor(a, spark.value);
            const bEvidence = evidenceFor(b, spark.value);
            return (
              <article className="spark" key={`${spark.label}-${spark.value}`}>
                <strong>{spark.value}</strong><span className="hint">Shared {spark.label}</span>
                <p><b>{a.name}</b> · {aEvidence.source}: “{aEvidence.text}”</p>
                <p><b>{b.name}</b> · {bEvidence.source}: “{bEvidence.text}”</p>
              </article>
            );
          }) : <p className="brief-empty">No shared interests, hobbies or values were extracted. Treat that as missing information, not a mismatch.</p>}
        </div>
        <div className="brief-block">
          <span className="brief-label">One thing to explore</span>
          <p className="brief-prompt">{question}</p>
          <p className="hint">{need && exploringPerson ? `Grounded in ${exploringPerson.name}’s stated need.` : "The source profiles do not answer this yet."}</p>
        </div>
        <div className="brief-block brief-date-idea">
          <span className="brief-label">A first date to try</span>
          <p className="brief-date-text">{date.first_date}</p>
          <p className="hint">An opening suggestion, not a prediction.</p>
        </div>
      </div>
      <div className="assessment-heading"><span className="brief-label">Beliefs before and after the conversation</span><span className="hint">Initial scores use profile signals; final scores use the saved date assessment.</span></div>
      <div className="assessment-grid">
        {assessments.map((assessment) => {
          const startRank = rankFor(assessment.person, assessment.other, true);
          const endRank = date.by === "keyword-fallback" ? startRank : rankFor(assessment.person, assessment.other, false);
          const rankChange = startRank !== null && endRank !== null ? endRank - startRank : 0;
          return (
            <article className="assessment-card" key={assessment.person.id}>
              <div className="assessment-card-heading"><strong>{assessment.person.name}’s agent</strong><span>{assessment.wantsMore ? "Continue exploring" : "Pass"}</span></div>
              <div className="assessment-scores"><span>Initial <b>{assessment.initial}</b></span><span aria-hidden="true">→</span><span>Final <b>{assessment.final}</b></span></div>
              <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, assessment.final))}%` }} /></div>
              <p className="assessment-rank">Match rank: #{startRank ?? "—"} → #{endRank ?? "—"}{date.by === "keyword-fallback" ? " · unchanged; scripted exchange adds no evidence" : rankChange < 0 ? ` · up ${Math.abs(rankChange)}` : rankChange > 0 ? ` · down ${rankChange}` : " · unchanged"}</p>
            </article>
          );
        })}
      </div>
      <p className="brief-disagreement"><strong>{date.aWantsMore !== date.bWantsMore ? "Agents disagree" : "Agent verdicts"}</strong> · {disagreement}</p>
      <p className="brief-footnote">Analysis: {a.confidence || "unrated"} for {a.name} · {b.confidence || "unrated"} for {b.name} · conversation: {date.by}</p>
    </section>
  );
}