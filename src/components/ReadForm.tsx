"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReadForm() {
  const r = useRouter();
  const [li, setLi] = useState(""); const [ig, setIg] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [stage, setStage] = useState("");

  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    setStage("Reading both profiles and preparing the introduction…");
    try {
      const res = await fetch("/api/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ linkedin: li, instagram: ig }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      r.push(`/people/${j.id}`);
    } catch (x: any) { setErr(x.message); setBusy(false); setStage(""); }
  }

  return (
    <form className="card read" onSubmit={go}>
      <div><label htmlFor="li">LinkedIn · public profile</label><input id="li" type="url" autoComplete="url" inputMode="url" placeholder="https://www.linkedin.com/in/name" value={li} onChange={(e) => setLi(e.target.value)} required /></div>
      <div><label htmlFor="ig">Instagram · public profile</label><input id="ig" type="url" autoComplete="url" inputMode="url" placeholder="https://www.instagram.com/name" value={ig} onChange={(e) => setIg(e.target.value)} required /></div>
      <div className="row"><button className="btn" disabled={busy}>{busy ? "Preparing introduction…" : "Read this person"}</button><span className={`hint form-status ${busy ? "form-progress" : ""}`} aria-live="polite">{stage || "Their profile opens first; rankings follow."}</span></div>
      {err && <div className="err" role="alert">{err}</div>}
    </form>
  );
}
