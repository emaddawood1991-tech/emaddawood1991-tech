#!/usr/bin/env node
// Optional Vercel AI Gateway video clip generator for Agentoon.ai.
// Dry-run by default: prints the approval card and exits. Live calls need --confirm,
// a known price in pricing.json, an estimate under --max-usd, and AI_GATEWAY_API_KEY in agentoon-video/.env.
//
//   node ai-clip.mjs --model google/veo-3.1-generate-001 --prompt "..." --duration 6
//   node ai-clip.mjs --model klingai/kling-v3.0-i2v --image-url https://... --prompt "..." --duration 5 --confirm
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const KEY_NAME = "AI_GATEWAY_API_KEY";

// The agentoon-video/.env value overrides any AI_GATEWAY_API_KEY already in the shell,
// so a key from another project is never used by accident.
function loadEnvFile() {
  const file = join(here, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[2]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function parseArgs(argv) {
  const args = { aspect: "9:16", n: 1, maxUsd: 2, confirm: false, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--confirm") args.confirm = true;
    else if (a === "--model") args.model = argv[++i];
    else if (a === "--prompt") args.prompt = argv[++i];
    else if (a === "--duration") args.duration = Number(argv[++i]);
    else if (a === "--aspect") args.aspect = argv[++i];
    else if (a === "--image-url") args.imageUrl = argv[++i];
    else if (a === "--n") args.n = Number(argv[++i]);
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--max-usd") args.maxUsd = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

function refuse(message) {
  console.error(`REFUSED: ${message}`);
  process.exit(2);
}

function main() {
  loadEnvFile();
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  if (!args.model || !args.prompt || !Number.isFinite(args.duration) || args.duration <= 0) {
    console.error("Required: --model <id> --prompt <text> --duration <seconds>");
    process.exit(1);
  }

  const pricing = JSON.parse(readFileSync(join(here, "pricing.json"), "utf8"));
  const price = pricing.models[args.model]?.usd_per_second ?? null;
  const estimate = price == null ? null : +(price * args.duration * args.n).toFixed(4);
  const keyPresent = Boolean(process.env[KEY_NAME]);

  console.log("--- Paid call approval card ---");
  console.log(`Provider:       Vercel AI Gateway`);
  console.log(`Model:          ${args.model}`);
  console.log(`Mode:           ${args.imageUrl ? "image-to-video" : "text-to-video"}`);
  console.log(`Duration/size:  ${args.duration}s x ${args.n}, ${args.aspect}`);
  console.log(`Estimated cost: ${estimate == null ? 'unknown - price not set in pricing.json' : `$${estimate}`}`);
  console.log(`Spend cap:      $${args.maxUsd}`);
  console.log(`API key:        ${KEY_NAME} ${keyPresent ? "is set" : "is NOT set"} (value never printed)`);
  console.log("-------------------------------");

  if (!args.confirm) {
    console.log("Dry run only. Nothing was sent. Re-run with --confirm after the user approves.");
    return;
  }
  if (!keyPresent) refuse(`${KEY_NAME} is not set (agentoon-video/.env).`);
  if (estimate == null) refuse("estimated cost unknown. Set usd_per_second in pricing.json first.");
  if (estimate > args.maxUsd) refuse(`estimate $${estimate} exceeds --max-usd ${args.maxUsd}.`);

  return live(args);
}

async function live(args) {
  let gatewayPkg, ai;
  try {
    gatewayPkg = await import("@ai-sdk/gateway");
    ai = await import("ai");
  } catch {
    console.error("Missing packages: `ai` and `@ai-sdk/gateway`. Install them in agentoon-video only after approval.");
    process.exit(3);
  }
  const gateway = gatewayPkg.createGateway({ apiKey: process.env[KEY_NAME] });
  const prompt = args.imageUrl ? { image: args.imageUrl, text: args.prompt } : args.prompt;
  const result = await ai.experimental_generateVideo({
    model: gateway.videoModel(args.model),
    prompt,
    duration: args.duration,
    aspectRatio: args.aspect,
    n: args.n,
    poll: { intervalMs: 5000, timeoutMs: 10 * 60 * 1000 },
  });
  const outDir = join(here, "out");
  mkdirSync(outDir, { recursive: true });
  result.videos.forEach((video, i) => {
    const file = args.out ?? join(outDir, `clip-${Date.now()}-${i + 1}.mp4`);
    writeFileSync(file, video.uint8Array);
    console.log(`Saved ${file}`);
  });
}

main();
