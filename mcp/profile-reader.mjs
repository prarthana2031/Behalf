#!/usr/bin/env node
// MCP server: "behalf-profile-reader" — reads a person from their LinkedIn + Instagram.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readLinkedIn, readInstagram } from "../core/scrape.mjs";
import { readPerson } from "../core/analyze.mjs";

const server = new McpServer({ name: "behalf-profile-reader", version: "1.0.0" });
const text = (o) => ({ content: [{ type: "text", text: JSON.stringify(o) }] });

server.tool("read_linkedin", "Fetch a person's public LinkedIn profile data.", { url: z.string() }, async ({ url }) => text(await readLinkedIn(url)));
server.tool("read_instagram", "Fetch a person's public Instagram profile data.", { url: z.string() }, async ({ url }) => text(await readInstagram(url)));
server.tool(
  "read_person",
  "Read both sources and return the agent's analysis: needs, hobbies, interests, qualities, values, evidence.",
  { linkedin_url: z.string(), instagram_url: z.string() },
  async ({ linkedin_url, instagram_url }) => {
    try { return text(await readPerson(linkedin_url, instagram_url)); }
    catch (e) { return { isError: true, content: [{ type: "text", text: String(e.message || e) }] }; }
  },
);

await server.connect(new StdioServerTransport());
