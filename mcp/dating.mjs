#!/usr/bin/env node
// MCP server: "behalf-dating" — agents date each other on their person's behalf, then rank.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runDate, rank, shortlist } from "../core/dating.mjs";

const server = new McpServer({ name: "behalf-dating", version: "1.0.0" });
const text = (o) => ({ content: [{ type: "text", text: JSON.stringify(o) }] });
const person = z.object({ id: z.string(), name: z.string() }).passthrough();

server.tool("plan_dates", "Shortlist which pairs go on a date (each person's top-k by pre-score).", { people: z.array(person), k: z.number().optional() }, async ({ people, k }) => text(shortlist(people, k ?? 3)));
server.tool("date_agents", "Two agents have a multi-turn date on behalf of their people; returns transcript + verdict.", { a: person, b: person }, async ({ a, b }) => text(await runDate(a, b)));
server.tool("rank_pool", "Rank every person's best matches from pre-scores and completed dates.", { people: z.array(person), dates: z.array(z.any()) }, async ({ people, dates }) => text(rank(people, dates)));

await server.connect(new StdioServerTransport());
