#!/usr/bin/env node
// Free local check of the Agentoon.ai AI Gateway setup. Never prints the key and makes no generation request.
//   node verify-gateway.mjs
// Reports: .env present and git-ignored, key set (length only), and the video models the gateway lists.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = join(here, ".env");
let ok = true;
const line = (state, text) => console.log(`${state.padEnd(5)} ${text}`);

// 1. .env exists and is ignored by git
if (!existsSync(envFile)) {
  line("FAIL", ".env not found in agentoon-video/. Copy .env.example to .env and add the key.");
  ok = false;
} else {
  const ignored = spawnSync("git", ["check-ignore", "-q", envFile], { cwd: here }).status === 0;
  line(ignored ? "OK" : "FAIL", ignored ? ".env is git-ignored" : ".env is NOT git-ignored. Do not commit until fixed.");
  ok &&= ignored;
}

// 2. Key present (never shown)
let key = "";
if (existsSync(envFile)) {
  const m = readFileSync(envFile, "utf8").match(/^\s*AI_GATEWAY_API_KEY\s*=\s*(.*?)\s*$/m);
  key = (m?.[1] ?? "").replace(/^["']|["']$/g, "");
}
if (key) line("OK", `AI_GATEWAY_API_KEY is set in .env (${key.length} characters, value hidden)`);
else {
  line("FAIL", "AI_GATEWAY_API_KEY is empty in .env");
  ok = false;
}

// 3. Model catalog (public endpoint, no generation, no charge, key not sent)
try {
  const res = await fetch("https://ai-gateway.vercel.sh/v1/models");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data } = await res.json();
  const video = data.filter((m) => m.type === "video");
  line("OK", `Gateway reachable. ${video.length} video model(s) listed:`);
  for (const m of video) {
    console.log(`      ${m.id}  ${m.name ? `(${m.name})` : ""}  pricing: ${JSON.stringify(m.pricing ?? null)}`);
  }
  console.log("\nCopy per-second prices into pricing.json before any paid call. Listing models does not prove the key is valid.");
} catch (e) {
  line("FAIL", `Could not reach the gateway: ${e.message}`);
  ok = false;
}

process.exit(ok ? 0 : 1);
