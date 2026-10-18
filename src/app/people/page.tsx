import Link from "next/link";
import { getPeople } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function People() {
  const people = getPeople();
  return (
    <section>
      <h2>People · {people.length}</h2>
      <p className="hint">Each one is represented by an agent. Open a profile to see what the agent read and concluded.</p>
      <div className="grid">
        {people.map((p) => (
          <Link key={p.id} href={`/people/${p.id}`} className="card person">
            <h3>{p.name} {p.sample && <span className="badge">sample</span>}</h3>
            <p>{p.headline}</p>
            <div>{[...p.hobbies.slice(0, 2), ...p.interests.slice(0, 1)].map((t) => <span className="tag" key={t}>{t}</span>)}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
