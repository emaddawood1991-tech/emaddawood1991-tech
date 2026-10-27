#!/usr/bin/env node
// Free, read-only readiness check for each Agentoon.ai production engine. Runs on Windows, macOS or Linux.
// Never prints key values, makes no network requests and no paid calls.
//   node check-tools.mjs
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const isWin = process.platform === "win32";
const rows = [];
const add = (engine, status, detail) => rows.push({ engine, status, detail });
const run = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", shell: isWin, timeout: 20000 });

// Blender: PATH first, then the standard Windows install folders.
function findBlender() {
  const onPath = run(isWin ? "where" : "which", ["blender"]);
  if (onPath.status === 0) return onPath.stdout.split(/\r?\n/)[0].trim();
  if (!isWin) return null;
  for (const base of ["C:\\Program Files\\Blender Foundation", "C:\\Program Files (x86)\\Blender Foundation"]) {
    if (!existsSync(base)) continue;
    for (const dir of readdirSync(base).sort().reverse()) {
      const exe = join(base, dir, "blender.exe");
      if (existsSync(exe)) return exe;
    }
  }
  return null;
}
const blender = findBlender();
add("blender", blender ? "found" : "not found", blender ?? "install location not detected (do not reinstall: check the path or add Blender to PATH)");

// Blender MCP: look at the Claude Code MCP list, if the CLI is available.
const mcp = run("claude", ["mcp", "list"]);
if (mcp.status === 0) {
  const lines = mcp.stdout.split(/\r?\n/).filter((l) => /blender/i.test(l));
  add("blender-mcp", lines.length ? "listed" : "not listed", lines.length ? lines.join(" | ").slice(0, 160) : "no Blender entry in `claude mcp list` (also check /mcp inside Claude Code)");
} else {
  add("blender-mcp", "unknown", "claude CLI not available here; run /mcp inside Claude Code");
}

// Remotion
const studio = join(repo, "remotion-studio");
if (!existsSync(join(studio, "package.json"))) add("remotion", "missing", "remotion-studio not found");
else if (!existsSync(join(studio, "node_modules"))) add("remotion", "needs npm install", "run `npm install` in remotion-studio (once, after approval)");
else add("remotion", "ready", "remotion-studio dependencies installed");

// ffmpeg and node
const ff = run("ffmpeg", ["-version"]);
add("ffmpeg", ff.status === 0 ? "ready" : "not found", ff.status === 0 ? ff.stdout.split(/\r?\n/)[0] : "needed for clip normalization and audio");
add("node", "ready", process.version);

// Playwright (resolvable from the repo or globally)
const pw = run("npx", ["--no-install", "playwright", "--version"]);
add("playwright", pw.status === 0 ? "ready" : "not found", pw.status === 0 ? pw.stdout.trim() : "needed for real software demos");

// Keys: presence only, from agentoon-video/.env
const envFile = join(here, ".env");
const env = {};
if (existsSync(envFile)) {
  for (const l of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
add("ai-gateway", env.AI_GATEWAY_API_KEY ? "key set" : "no key", env.AI_GATEWAY_API_KEY ? "AI_GATEWAY_API_KEY set in agentoon-video/.env (value hidden); run verify-gateway.mjs" : "add AI_GATEWAY_API_KEY to agentoon-video/.env (optional paid provider)");
add("pexels", env.PEXELS_API_KEY ? "key set" : "no key", env.PEXELS_API_KEY ? "PEXELS_API_KEY set (value hidden)" : "add PEXELS_API_KEY to agentoon-video/.env (free key)");

// Router
const router = run(process.execPath, [join(here, "route.mjs"), "Rigged 3D character animation"]);
add("router", router.status === 0 && router.stdout.includes('"engine": "blender"') ? "ready" : "FAILED", "route.mjs picks Blender for a 3D scene");

const width = Math.max(...rows.map((r) => r.engine.length));
for (const r of rows) console.log(`${r.engine.padEnd(width)}  ${r.status.padEnd(18)}  ${r.detail}`);
process.exit(rows.some((r) => r.status === "FAILED") ? 1 : 0);
