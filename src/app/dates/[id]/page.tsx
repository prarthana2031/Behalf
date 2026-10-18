import Link from "next/link";
import { notFound } from "next/navigation";
import Replay from "@/components/Replay";
import DateBrief from "@/components/DateBrief";
import { conversationForDate } from "../../../../core/dating.mjs";
import { getDates, getPeople, getRankings, personById, type Turn } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = getDates().find((x) => x.id === decodeURIComponent(id));
  if (!d) notFound();
  const a = personById(d.a), b = personById(d.b);
  if (!a || !b) notFound();
  const people = getPeople();
  const turns: Turn[] = d.by === "keyword-fallback" ? conversationForDate(a, b, d) as Turn[] : d.turns;
  return (
    <section>
      <h1 style={{ fontSize: 38 }}><Link href={`/people/${a.id}`}>{a.name}</Link> × <Link href={`/people/${b.id}`}>{b.name}</Link></h1>
      <p className="lead">Two agents, on their people’s behalf · fit {d.score}/100 · written by {d.by}</p>
      <DateBrief a={a} b={b} date={d} people={people} rankings={getRankings()} />
      <Replay turns={turns} aName={a.name.split(" ")[0]} bName={b.name.split(" ")[0]} />
      <div className="cols" style={{ marginTop: 28 }}>
        <div className="card"><h3>Chemistry</h3>{d.chemistry}</div>
        <div className="card"><h3>Friction</h3>{d.friction}</div>
        <div className="card"><h3>Verdicts</h3>{a.name.split(" ")[0]}’s agent: {d.aWantsMore ? "wants a second date" : "passes"}<br />{b.name.split(" ")[0]}’s agent: {d.bWantsMore ? "wants a second date" : "passes"}</div>
      </div>
    </section>
  );
}
