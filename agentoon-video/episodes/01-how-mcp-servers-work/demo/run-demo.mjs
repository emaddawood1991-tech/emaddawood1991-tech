// Real MCP client over stdio, written as raw JSON-RPC so every message on the wire is visible.
// Writes transcript.jsonl: one {dir, msg} per line, exactly as exchanged.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { writeFileSync } from "node:fs";

const child = spawn("node", ["server.mjs"], { stdio: ["pipe", "pipe", "inherit"] });
const log = [];
const send = (msg) => { log.push({ dir: "->", msg }); child.stdin.write(JSON.stringify(msg) + "\n"); };
const pending = new Map();
createInterface({ input: child.stdout }).on("line", (line) => {
  const msg = JSON.parse(line); log.push({ dir: "<-", msg });
  if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const call = (id, method, params) => new Promise((res) => { pending.set(id, res); send({ jsonrpc: "2.0", id, method, params }); });

await call(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "agentoon-demo", version: "1.0.0" } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
await call(2, "tools/list", {});
await call(3, "tools/call", { name: "count_lines", arguments: { path: "notes.txt" } });
child.stdin.end(); child.kill();
writeFileSync("transcript.jsonl", log.map((l) => JSON.stringify(l)).join("\n") + "\n");
for (const l of log) console.log(l.dir, JSON.stringify(l.msg));
