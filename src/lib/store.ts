import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type Person = {
  id: string; name: string; headline?: string; location?: string; summary?: string;
  needs: string[]; hobbies: string[]; interests: string[]; qualities: string[]; values: string[];
  looking_for?: string; dealbreakers?: string[]; evidence?: string[];
  confidence?: string; confidence_note?: string; linkedin?: string; instagram?: string;
  sample?: boolean; analyzedBy?: string; sources?: { linkedin: string; instagram: string };
};
export type Turn = { from: "a" | "b"; text: string; round?: string };
export type DateRec = {
  id: string; a: string; b: string; turns: Turn[]; score: number; chemistry: string; friction: string; first_date: string;
  aWantsMore: boolean; bWantsMore: boolean; by: string; aInitialScore?: number; bInitialScore?: number;
  aFinalScore?: number; bFinalScore?: number; openQuestion?: string; disagreementReason?: string;
};
export type Rank = { id: string; score: number; dated: boolean; dateId?: string; wantsMore: boolean | null };

const SEED_DIR = path.join(process.cwd(), "data");
const DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), "behalf-data") : SEED_DIR);
const read = <T,>(f: string, d: T): T => {
  for (const dir of DIR === SEED_DIR ? [DIR] : [DIR, SEED_DIR]) {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch {}
  }
  return d;
};
const write = (f: string, v: unknown) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, f), JSON.stringify(v, null, 1)); };

export const getPeople = () => read<Person[]>("people.json", []);
export const getDates = () => read<DateRec[]>("dates.json", []);
export const getRankings = () => read<Record<string, Rank[]>>("rankings.json", {});
export const savePeople = (p: Person[]) => write("people.json", p);
export const saveDates = (d: DateRec[]) => write("dates.json", d);
export const saveRankings = (r: Record<string, Rank[]>) => write("rankings.json", r);
export const personById = (id: string) => getPeople().find((p) => p.id === id);
