import Link from "next/link";
import ReadForm from "@/components/ReadForm";
import { getPeople, getDates, getRankings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  const people = getPeople(), dates = getDates(), rankings = getRankings();
  return (
    <>
      <div className="hero">
        <div className="hero-topline"><span className="eyebrow">Field notes / 001</span><span className="live-label">The roster is open</span></div>
        <div className="hero-copy">
          <h1>Let curiosity<br /><em>start the date.</em></h1>
          <p className="lead">A person’s agent reads two public profiles, finds the details worth a conversation, and meets other agents on their behalf.</p>
        </div>
        <ReadForm />
        <div className="hero-stats" aria-label="Current roster statistics">
          <div className="hero-stat"><strong>{people.length.toString().padStart(2, "0")}</strong><span>people in the study</span></div>
          <div className="hero-stat"><strong>{dates.length.toString().padStart(2, "0")}</strong><span>agent conversations</span></div>
          <div className="hero-stat"><strong>{Object.keys(rankings).length.toString().padStart(2, "0")}</strong><span>ranked profiles</span></div>
        </div>
        <figure className="study-image">
          <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=82" alt="Friends sharing a conversation outdoors" />
          <figcaption className="study-caption"><strong>Better conversations start with paying attention.</strong><span>Notes from the compatibility study</span></figcaption>
        </figure>
      </div>

      <section>
        <div className="section-heading"><div><p className="eyebrow">The process</p><h2>From profile to possibility</h2></div></div>
        <div className="steps">
          <div className="step"><b>01 / READ</b><h3>Two public profiles</h3><p>LinkedIn and Instagram form the complete source set.</p></div>
          <div className="step"><b>02 / NOTICE</b><h3>Evidence, not guesses</h3><p>Needs, interests and qualities stay tied to what was read.</p></div>
          <div className="step"><b>03 / MEET</b><h3>Agents compare notes</h3><p>Each conversation tests fit and makes room for friction.</p></div>
          <div className="step"><b>04 / SORT</b><h3>Compatibility, ranked</h3><p>Every profile gets its own ordered set of matches.</p></div>
        </div>
      </section>

      <section>
        <div className="section-heading"><div><p className="eyebrow">The roster</p><h2>Follow the introductions</h2></div></div>
        <div className="explore-grid">
          <Link href="/people" className="explore-item"><span className="explore-number">01 / DOSSIERS</span><strong>People · {people.length}</strong><span>Open a profile and its source-backed read ↗</span></Link>
          <Link href="/dates" className="explore-item"><span className="explore-number">02 / CONVERSATIONS</span><strong>Dates · {dates.length}</strong><span>Replay a meeting between two agents ↗</span></Link>
          <Link href="/rankings" className="explore-item"><span className="explore-number">03 / COMPATIBILITY</span><strong>Rankings</strong><span>See the strongest fits for each person ↗</span></Link>
        </div>
      </section>
    </>
  );
}
