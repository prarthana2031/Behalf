// Real ingest: reads data/people-25.csv, reads each person via the
// same code the MCP server uses, then runs the dates + rankings. Needs APIFY_TOKEN (scraping) and
// ANTHROPIC_API_KEY (analysis + dates) for full quality.
import fs from "node:fs";
import { readPerson } from "../core/analyze.mjs";
import { runDate, rank, shortlist } from "../core/dating.mjs";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && !field.trim()) {
      field = "";
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
      if (char === "\r" && text[index + 1] === "\n") index++;
    } else field += char;
  }
  if (quoted) throw new Error("Unclosed quoted field in data/people-25.csv");
  if (field || row.length) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

const [headerRow, ...records] = parseCsv(fs.readFileSync("data/people-25.csv", "utf8"));
if (!headerRow) throw new Error("data/people-25.csv is empty");
const headers = headerRow.map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, "") : header).toLowerCase());
const requiredHeaders = ["name", "linkedin_url", "instagram_url"];
const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
if (missingHeaders.length) throw new Error(`data/people-25.csv is missing columns: ${missingHeaders.join(", ")}`);

const rows = records.map((values, index) => {
  const record = Object.fromEntries(headers.map((header, column) => [header, values[column] || ""]));
  if (!record.linkedin_url || !record.instagram_url) {
    console.warn(`skip CSV row ${index + 2}: missing LinkedIn or Instagram URL`);
    return null;
  }
  return record;
}).filter(Boolean);
if (rows.length < 25) throw new Error(`Expected at least 25 complete profiles in data/people-25.csv; found ${rows.length}`);

let nextRow = 0;
const people = (await Promise.all(Array.from({ length: Math.min(4, rows.length) }, async () => {
  const result = [];
  while (nextRow < rows.length) {
    const { name, linkedin_url: li, instagram_url: ig } = rows[nextRow++];
    try {
      const person = await readPerson(li, ig);
      if (name) person.name = name;
      result.push(person);
      console.log("read", person.name, `[${person.sources.linkedin} / ${person.sources.instagram}]`);
    } catch (error) {
      console.error("skip", name || li, error.message);
    }
  }
  return result;
}))).flat();
if (people.length < 25) throw new Error(`Only ${people.length} profiles were verified and analyzed; need at least 25. Existing demo data was not changed.`);
if (new Set(people.map((person) => person.id)).size !== people.length) throw new Error("Duplicate LinkedIn profiles found; existing demo data was not changed.");

const byId = Object.fromEntries(people.map((p) => [p.id, p]));
const dates = [];
for (const [x, y] of shortlist(people, 3)) {
  const date = await runDate(byId[x], byId[y]);
  dates.push(date);
  console.log("date", x, y);
}
fs.writeFileSync("data/people.json", JSON.stringify(people, null, 1));
fs.writeFileSync("data/dates.json", JSON.stringify(dates, null, 1));
fs.writeFileSync("data/rankings.json", JSON.stringify(rank(people, dates), null, 1));
console.log(`Done: ${people.length} people, ${dates.length} dates.`);
