import Link from "next/link";
import { notFound } from "next/navigation";
import { getPeople, getRankings, getDates } from "@/lib/store";

export const dynamic = "force-dynamic";
const Tags = ({ items, c }: { items?: string[]; c: string }) => <>{(items || []).map((t) => <span className={`tag ${c}`} key={t}>{t}</span>)}{!items?.length && <span className="hint">nothing supported by the sources</span>}</>;

export default async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const people = getPeople();
  const p = people.find((x) => x.id === id);
  if (!p) notFound();
  const byId = Object.fromEntries(people.map((x) => [x.id, x]));
  const top = (getRankings()[id] || []).slice(0, 5);
  const myDates = getDates().filter((d) => d.a === id || d.b === id);
  return (
    <section>
      <h1 style={{ fontSize: 40 }}>{p.name} {p.sample && <span className="badge">sample</span>}</h1>
      <p className="lead">{p.headline}{p.location ? ` · ${p.location}` : ""}</p>
      <p style={{ maxWidth: 680 }}>{p.summary}</p>
      <p className="hint">
        {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>} {p.instagram && <>· <a href={p.instagram} target="_blank" rel="noreferrer">Instagram ↗</a></>}
        {p.sources && <> · read via {p.sources.linkedin} / {p.sources.instagram}</>} · analysed by {p.analyzedBy || "agent"} · confidence {p.confidence || "n/a"}
      </p>

      <div className="cols">
        <div className="card"><h3>Needs</h3><Tags items={p.needs} c="r" /></div>
        <div className="card"><h3>Hobbies</h3><Tags items={p.hobbies} c="g" /></div>
        <div className="card"><h3>Interests</h3><Tags items={p.interests} c="s" /></div>
        <div className="card"><h3>Qualities</h3><Tags items={p.qualities} c="" /></div>
        <div className="card"><h3>Values</h3><Tags items={p.values} c="" /></div>
        <div className="card"><h3>Looking for</h3><p style={{ margin: 0 }}>{p.looking_for || "—"}</p>{!!p.dealbreakers?.length && <><h3 style={{ marginTop: 14 }}>Dealbreakers</h3><Tags items={p.dealbreakers} c="" /></>}</div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>What the agent based this on</h3>
        <ul className="plain">{(p.evidence || []).map((e, i) => <li key={i}>{e}</li>)}</ul>
        {p.confidence_note && <p className="hint">{p.confidence_note}</p>}
      </div>

      <h2 style={{ marginTop: 40 }}>Best matches</h2>
      <div className="card">
        {top.map((r, i) => (
          <div className="rank" key={r.id}>
            <span className="n">{i + 1}</span>
            <div><Link href={`/people/${r.id}`}><b>{byId[r.id]?.name}</b></Link> <span className="hint">{byId[r.id]?.headline}</span><div className="bar"><i style={{ width: `${r.score}%` }} /></div></div>
            <div style={{ textAlign: "right" }}><div className="score">{r.score}</div>{r.dateId ? <Link className="hint" href={`/dates/${r.dateId}`}>watch date →</Link> : <span className="hint">not dated</span>}</div>
          </div>
        ))}
      </div>
      <p className="hint">{myDates.length} dates so far · <Link href="/rankings">full rankings</Link></p>
    </section>
  );
}
