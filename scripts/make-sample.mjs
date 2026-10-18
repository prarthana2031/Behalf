// Generates 25 FICTIONAL sample dossiers so the site demos with zero keys.
// Replace with real people via: npm run ingest  (reads data/people-25.csv)
import fs from "node:fs";
import { runDate, rank, shortlist } from "../core/dating.mjs";

const P = (name, headline, location, hobbies, interests, qualities, values, needs, looking_for, dealbreakers = []) => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, "-"), name, headline, location, hobbies, interests, qualities, values, needs, looking_for, dealbreakers,
  summary: `${name} is ${headline.toLowerCase()}. Their sample profile leans on ${hobbies[0]} and ${interests[0]}.`,
  evidence: [`LinkedIn: ${headline}`, `Instagram: weekends are ${hobbies[0]} and ${hobbies[1]}`, `Instagram: posts often about ${interests[0]}`],
  confidence: "sample", confidence_note: "Fictional sample persona for the demo.", sample: true,
});

const people = [
  P("Aanya Rao", "Cloud security engineer at a fintech", "Bengaluru", ["hiking", "reading", "yoga"], ["security", "cloud", "ai"], ["curious", "analytical", "caring"], ["honesty", "growth"], ["intellectual curiosity", "calm presence", "analytical"], "Someone curious who can talk shop and switch off."),
  P("Vikram Shah", "Founder building agent tooling", "Mumbai", ["running", "cooking", "travel"], ["startups", "ai", "finance"], ["driven", "creative", "curious"], ["ambition", "freedom"], ["driven", "shared ambition", "caring"], "A partner with her own big thing going."),
  P("Meera Iyer", "Product designer at a health startup", "Chennai", ["art", "yoga", "photography"], ["design", "health", "education"], ["creative", "caring", "curious"], ["kindness", "craft"], ["caring", "creative", "calm presence"], "Warm, creative, unhurried.", ["workaholic"]),
  P("Rohan Gupta", "DevOps lead, Kubernetes enthusiast", "Pune", ["cycling", "gaming", "cooking"], ["cloud", "security", "ai"], ["analytical", "driven", "curious"], ["reliability", "growth"], ["curious", "analytical", "humour"], "Someone who laughs at his on-call stories."),
  P("Isha Kapoor", "Data scientist in climate tech", "Delhi", ["hiking", "reading", "cycling"], ["climate", "ai", "education"], ["analytical", "caring", "curious"], ["sustainability", "honesty"], ["intellectual curiosity", "caring", "shared purpose"], "Shared purpose and long walks."),
  P("Arjun Nair", "Backend engineer, open-source maintainer", "Kochi", ["running", "music", "gaming"], ["ai", "cloud", "startups"], ["curious", "analytical", "creative"], ["freedom", "growth"], ["curious", "humour", "independence"], "A fellow tinkerer."),
  P("Tara Menon", "Cybersecurity analyst, SOC", "Hyderabad", ["gym", "reading", "travel"], ["security", "cloud", "finance"], ["driven", "analytical", "caring"], ["honesty", "reliability"], ["analytical", "calm presence", "driven"], "Steady, direct, funny."),
  P("Kabir Malhotra", "Venture associate", "Mumbai", ["travel", "running", "music"], ["startups", "finance", "ai"], ["driven", "creative", "curious"], ["ambition", "growth"], ["driven", "creative", "shared ambition"], "Someone ambitious who travels well."),
  P("Nisha Pillai", "Pediatric nurse turned health-tech PM", "Bengaluru", ["yoga", "cooking", "hiking"], ["health", "education", "product"], ["caring", "curious", "driven"], ["kindness", "service"], ["caring", "calm presence", "shared purpose"], "A kind person with good humour."),
  P("Dev Bhatia", "Full-stack dev, React and Supabase", "Gurugram", ["gaming", "cycling", "music"], ["startups", "ai", "product"], ["creative", "driven", "curious"], ["freedom", "craft"], ["creative", "humour", "curious"], "A co-op partner, in games and life."),
  P("Ananya Das", "UX researcher", "Kolkata", ["reading", "photography", "art"], ["design", "education", "health"], ["curious", "caring", "creative"], ["kindness", "craft"], ["intellectual curiosity", "caring", "creative"], "Someone who asks good questions."),
  P("Siddharth Jain", "Cloud architect at an enterprise bank", "Mumbai", ["running", "cooking", "reading"], ["cloud", "finance", "security"], ["analytical", "driven", "caring"], ["reliability", "growth"], ["analytical", "calm presence", "driven"], "Grounded and ambitious.", ["flaky"]),
  P("Priya Venkat", "ML engineer, speech models", "Bengaluru", ["music", "hiking", "yoga"], ["ai", "education", "climate"], ["curious", "analytical", "creative"], ["growth", "honesty"], ["curious", "intellectual curiosity", "humour"], "Music, mountains, models."),
  P("Karan Mehta", "Startup operator, ex-consulting", "Delhi", ["gym", "travel", "cooking"], ["startups", "finance", "product"], ["driven", "analytical", "caring"], ["ambition", "reliability"], ["driven", "shared ambition", "calm presence"], "A partner in building."),
  P("Sara Thomas", "Journalist covering tech policy", "Delhi", ["reading", "running", "travel"], ["security", "education", "climate"], ["curious", "caring", "driven"], ["honesty", "service"], ["curious", "intellectual curiosity", "humour"], "Someone who argues well and kindly."),
  P("Aditya Kulkarni", "Embedded engineer, hobbyist drone pilot", "Pune", ["cycling", "gaming", "photography"], ["ai", "cloud", "health"], ["creative", "analytical", "curious"], ["freedom", "craft"], ["curious", "independence", "creative"], "Someone who likes making things."),
  P("Zoya Khan", "Brand strategist", "Mumbai", ["art", "travel", "music"], ["design", "startups", "education"], ["creative", "driven", "caring"], ["kindness", "freedom"], ["creative", "humour", "caring"], "A funny, creative adventurer."),
  P("Neel Sharma", "Security researcher, bug bounty", "Bengaluru", ["gaming", "running", "reading"], ["security", "ai", "cloud"], ["analytical", "curious", "driven"], ["honesty", "growth"], ["analytical", "curious", "humour"], "A sparring partner."),
  P("Lakshmi Reddy", "Public-health researcher", "Hyderabad", ["hiking", "yoga", "reading"], ["health", "education", "climate"], ["caring", "analytical", "curious"], ["service", "sustainability"], ["caring", "shared purpose", "calm presence"], "Purpose first, then pizza."),
  P("Harsh Vora", "Quant developer", "Mumbai", ["gym", "cooking", "gaming"], ["finance", "ai", "startups"], ["analytical", "driven", "curious"], ["ambition", "reliability"], ["analytical", "driven", "humour"], "Competitive in a good way."),
  P("Diya Bansal", "Teacher and education-content creator", "Jaipur", ["art", "yoga", "photography"], ["education", "design", "health"], ["caring", "creative", "curious"], ["kindness", "service"], ["caring", "creative", "calm presence"], "A gentle, funny partner."),
  P("Omar Siddiqui", "SRE at a streaming company", "Hyderabad", ["music", "cycling", "cooking"], ["cloud", "security", "ai"], ["analytical", "caring", "creative"], ["reliability", "growth"], ["analytical", "humour", "calm presence"], "Someone who cooks and doesn't page him."),
  P("Pooja Narayan", "Climate policy analyst", "Chennai", ["hiking", "reading", "cycling"], ["climate", "finance", "education"], ["analytical", "caring", "driven"], ["sustainability", "honesty"], ["shared purpose", "caring", "intellectual curiosity"], "Someone who lives their values."),
  P("Yash Agarwal", "Indie game developer", "Bengaluru", ["gaming", "music", "art"], ["startups", "design", "ai"], ["creative", "curious", "driven"], ["freedom", "craft"], ["creative", "humour", "independence"], "A creative partner in crime."),
  P("Ritika Sen", "Platform engineer, SRE-turned-manager", "Kolkata", ["running", "reading", "travel"], ["cloud", "ai", "education"], ["driven", "caring", "analytical"], ["growth", "kindness"], ["driven", "caring", "calm presence"], "Ambitious but gentle."),
];

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/people.json", JSON.stringify(people, null, 1));

const byId = Object.fromEntries(people.map((p) => [p.id, p]));
const dates = [];
for (const [x, y] of shortlist(people, 3)) dates.push(await runDate(byId[x], byId[y]));
fs.writeFileSync("data/dates.json", JSON.stringify(dates, null, 1));
fs.writeFileSync("data/rankings.json", JSON.stringify(rank(people, dates), null, 1));
console.log(`Wrote ${people.length} sample people, ${dates.length} dates, rankings.`);
