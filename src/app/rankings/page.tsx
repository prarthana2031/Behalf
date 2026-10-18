import Link from "next/link";
import RunButton from "@/components/RunButton";
import { getPeople, getRankings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Rankings({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const { for: sel } = await searchParams;
  const people = getPeople(), ranks = getRankings();
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const who = byId[sel || ""] || people[0];
  const list = who ? (ranks[who.id] || []).slice(0, 10) : [];
  const mutual = people.filter((p) => ranks[p.id]?.[0] && ranks[ranks[p.id][0].id]?.[0]?.id === p.id);
  return (
    <section>
      <h2>Rankings</h2>
      <RunButton />
      <div className="row" style={{ marginTop: 18 }}>
        {people.map((p) => <Link key={p.id} href={`/rankings?for=${p.id}`} className={`tag ${p.id === who?.id ? "r" : ""}`}>{p.name.split(" ")[0]}</Link>)}
      </div>
      {who && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Best fits for <Link href={`/people/${who.id}`} style={{ color: "var(--rose)" }}>{who.name}</Link></h3>
          {list.map((r, i) => (
            <div className="rank" key={r.id}>
              <span className="n">{i + 1}</span>
              <div><Link href={`/people/${r.id}`}><b>{byId[r.id]?.name}</b></Link> <span className="hint">{byId[r.id]?.headline}</span><div className="bar"><i style={{ width: `${r.score}%` }} /></div></div>
              <div style={{ textAlign: "right" }}><div className="score">{r.score}</div>{r.dateId ? <Link className="hint" href={`/dates/${r.dateId}`}>watch date →</Link> : <span className="hint">not dated</span>}</div>
            </div>
          ))}
        </div>
      )}
      <h3 style={{ marginTop: 30 }}>Mutual first choices</h3>
      <p className="hint">{mutual.length ? mutual.filter((p) => p.id < ranks[p.id][0].id).map((p) => `${p.name.split(" ")[0]} + ${byId[ranks[p.id][0].id].name.split(" ")[0]}`).join(" · ") : "None yet."}</p>
    </section>
  );
}
