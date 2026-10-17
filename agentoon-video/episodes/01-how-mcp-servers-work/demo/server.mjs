// Tiny real MCP server (official TypeScript SDK): one tool that counts the lines of a file next to it.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "node:fs/promises";
import { basename, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));
const server = new McpServer({ name: "count-lines", version: "1.0.0" });

server.tool(
  "count_lines",
  "Count the lines in a text file",
  { path: z.string() },
  async ({ path }) => {
    const file = join(here, basename(path));          // basename: stay inside this folder
    const text = await readFile(file, "utf8");
    const n = text.split("\n").filter((l, i, a) => i < a.length - 1 || l !== "").length;
    return { content: [{ type: "text", text: `${basename(path)} has ${n} lines` }] };
  }
);

await server.connect(new StdioServerTransport());
