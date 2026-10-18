import Link from "next/link";
import { getDates, getPeople } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Dates() {
  const people = Object.fromEntries(getPeople().map((p) => [p.id, p]));
  const dates = getDates().filter((d) => people[d.a] && people[d.b]).sort((x, y) => y.score - x.score);
  return (
    <section>
      <h2>Dates · {dates.length}</h2>
      <p className="hint">Every pair the dating server shortlisted. Open one to watch the two agents talk.</p>
      <div className="grid">
        {dates.map((d) => (
          <Link key={d.id} href={`/dates/${d.id}`} className="card person">
            <h3>{people[d.a].name.split(" ")[0]} × {people[d.b].name.split(" ")[0]}</h3>
            <p>{d.chemistry}</p>
            <div><span className="tag g">fit {d.score}</span>{d.aWantsMore && d.bWantsMore && <span className="tag s">both want more</span>}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
