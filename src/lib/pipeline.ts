import { readPerson } from "../../core/analyze.mjs";
import { runDate, rank, shortlist } from "../../core/dating.mjs";
import { getPeople, getDates, savePeople, saveDates, saveRankings, type Person, type DateRec, type Rank } from "./store";

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

export async function readOne(linkedin: string, instagram: string): Promise<Person> {
  return readPerson(linkedin, instagram) as Promise<Person>;
}

// Date a set of pairs through the dating MCP server, merge into the store, re-rank.
export async function dateAndRank(pairs?: [string, string][], k = 3) {
  const people = getPeople();
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const todo: [string, string][] = pairs ?? shortlist(people, k);
  const done = await pool(todo, 4, ([x, y]) => runDate(byId[x], byId[y]) as Promise<DateRec>);
  const merged = new Map(getDates().map((d) => [[d.a, d.b].sort().join("|"), d]));
  for (const d of done) merged.set([d.a, d.b].sort().join("|"), d);
  const dates = [...merged.values()].filter((d) => byId[d.a] && byId[d.b]);
  saveDates(dates);
  saveRankings(rank(people, dates) as Record<string, Rank[]>);
  return { dated: done.length, total: dates.length };
}

export async function addPerson(linkedin: string, instagram: string) {
  const person = await readOne(linkedin, instagram);
  const others = getPeople().filter((p) => p.id !== person.id);
  savePeople([...others, person]);
  const chemistryPairs = shortlist([...others, person], 4).filter(([x, y]) => x === person.id || y === person.id);
  try {
    await dateAndRank(chemistryPairs);
  } catch (error) {
    savePeople(others);
    throw error;
  }
  return person;
}
