// Detects which production engines can run in this environment (free, read-only, no network).
//   node available.mjs
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === "win32";
const require = createRequire(import.meta.url);

const run = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", shell: isWin, timeout: 20000 });

export function findBlender() {
  const onPath = run(isWin ? "where" : "which", ["blender"]);
  if (onPath.status === 0 && onPath.stdout.trim()) return onPath.stdout.split(/\r?\n/)[0].trim();
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

export function readEnv() {
  const file = process.env.AGENTOON_ENV_FILE ?? join(here, ".env");
  const env = {};
  if (existsSync(file)) {
    for (const l of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

export function detectAvailable() {
  const env = readEnv();
  const ffmpeg = run("ffmpeg", ["-version"]).status === 0;
  let playwright = false;
  try {
    require.resolve("playwright");
    playwright = true;
  } catch {
    playwright = run("npx", ["--no-install", "playwright", "--version"]).status === 0;
  }
  return {
    blender: Boolean(findBlender()),
    threejs: existsSync(join(here, "threejs", "node_modules", "three")) && playwright && ffmpeg,
    playwright,
    remotion: existsSync(join(here, "..", "remotion-studio", "node_modules")),
    ffmpeg,
    hyperframes: Boolean(process.env.AGENTOON_HYPERFRAMES),
    pexels: Boolean(env.PEXELS_API_KEY),
    "ai-gateway": Boolean(env.AI_GATEWAY_API_KEY),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [k, ok] of Object.entries(detectAvailable())) console.log(`${k.padEnd(12)} ${ok ? "available" : "not available here"}`);
}
