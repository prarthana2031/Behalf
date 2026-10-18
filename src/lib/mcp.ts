import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// The web app talks to its two MCP servers over stdio, exactly like any other MCP host.
export async function withMcp<T>(server: "profile-reader" | "dating", fn: (call: (tool: string, args: object) => Promise<any>) => Promise<T>): Promise<T> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(process.cwd(), "mcp", `${server}.mjs`)],
    env: { ...(process.env as Record<string, string>) },
  });
  const client = new Client({ name: "behalf-web", version: "1.0.0" });
  await client.connect(transport);
  try {
    return await fn(async (tool, args) => {
      const res: any = await client.callTool({ name: tool, arguments: args as any });
      const txt = res.content?.[0]?.text ?? "";
      if (res.isError) throw new Error(txt || "MCP tool error");
      return JSON.parse(txt);
    });
  } finally {
    await client.close();
  }
}

export async function listTools() {
  const out: Record<string, { name: string; description?: string }[]> = {};
  for (const s of ["profile-reader", "dating"] as const) {
    const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(process.cwd(), "mcp", `${s}.mjs`)] });
    const client = new Client({ name: "behalf-web", version: "1.0.0" });
    await client.connect(transport);
    out[`behalf-${s}`] = (await client.listTools()).tools.map((t) => ({ name: t.name, description: t.description }));
    await client.close();
  }
  return out;
}
