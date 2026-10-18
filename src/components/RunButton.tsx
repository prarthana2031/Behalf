"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunButton() {
  const r = useRouter();
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  async function run() {
    setBusy(true); setMsg("Agents are dating…");
    const res = await fetch("/api/run", { method: "POST" });
    const j = await res.json();
    setBusy(false); setMsg(res.ok ? `Ran ${j.dated} dates (${j.total} total).` : j.error);
    r.refresh();
  }
  return <div className="row"><button className="btn" disabled={busy} onClick={run}>{busy ? "Dating…" : "Re-run all dates"}</button><span className="hint">{msg}</span></div>;
}
