"use client";
import { useEffect, useRef, useState } from "react";
import { Fragment } from "react";

type Turn = { from: "a" | "b"; text: string; round?: string };

export default function Replay({ turns, aName, bName }: { turns: Turn[]; aName: string; bName: string }) {
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(true);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const visibleTurns = turns.slice(0, shown);

  useEffect(() => {
    if (!playing) return;
    if (shown >= turns.length) { setPlaying(false); return; }
    t.current = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 400 : 1300);
    return () => clearTimeout(t.current);
  }, [shown, playing, turns.length]);

  return (
    <>
      <div className="row"><button className="btn ghost" onClick={() => { setShown(0); setPlaying(true); }}>▶ Replay</button><button className="btn ghost" onClick={() => { clearTimeout(t.current); setPlaying(false); setShown(turns.length); }}>Show all</button></div>
      <div className="chat">
        {visibleTurns.map((m, i) => (
          <Fragment key={i}>
            {m.round && (i === 0 || visibleTurns[i - 1].round !== m.round) && <h3 className="round-marker">{m.round}</h3>}
            <div className={`msg ${m.from}`}><small>{m.from === "a" ? aName : bName}’s agent</small>{m.text}</div>
          </Fragment>
        ))}
        {playing && shown < turns.length && <div className="hint">…</div>}
      </div>
    </>
  );
}
