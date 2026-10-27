#!/usr/bin/env node
// Optional Vercel AI Gateway video generation for Agentoon.ai (paid). Dry run by default: prints the approval card and
// exits. A live call needs --confirm, a known price in pricing.json, an estimate under --max-usd, and
// AI_GATEWAY_API_KEY in agentoon-video/.env (the .env value overrides any shell value).
//
// Modes (chosen from the flags you pass):
//   text-to-video       --model google/veo-3.1-generate-001 --prompt "..." --duration 6
//   image-to-video      --model klingai/kling-v3.0-i2v --image-url https://... --prompt "slow push-in"
//   first-last-frame    --model google/veo-3.1-generate-001 --first-frame https://... --last-frame https://...
//   reference-to-video  --model alibaba/wan-v2.6-r2v --ref https://a.png --ref https://b.png [--ref-video https://x.mp4]
//   motion-control      --model klingai/kling-v3.0-motion-control --character-image https://... --motion-video https://... [--orientation video] [--quality pro]
//   camera control      add --camera simple:horizontal=2,zoom=3 (or forward_up, down_back, right_turn_forward, left_turn_forward) to Kling image-to-video
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const KEY_NAME = "AI_GATEWAY_API_KEY";
const FLAGS_WITH_VALUE = {
  "--model": "model", "--prompt": "prompt", "--duration": "duration", "--aspect": "aspect", "--resolution": "resolution",
  "--image-url": "imageUrl", "--first-frame": "firstFrame", "--last-frame": "lastFrame", "--ref-video": "refVideo",
  "--character-image": "characterImage", "--motion-video": "motionVideo", "--orientation": "orientation",
  "--quality": "quality", "--camera": "camera", "--n": "n", "--out": "out", "--max-usd": "maxUsd",
};

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

export function parseArgs(argv) {
  const a = { aspect: "9:16", n: 1, maxUsd: 2, confirm: false, allowUnverified: false, refs: [], orientation: "video", quality: "std" };
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i];
    if (f === "--confirm") a.confirm = true;
    else if (f === "--allow-unverified") a.allowUnverified = true;
    else if (f === "--ref") a.refs.push(argv[++i]);
    else if (f in FLAGS_WITH_VALUE) a[FLAGS_WITH_VALUE[f]] = argv[++i];
    else throw new Error(`Unknown argument: ${f}`);
  }
  for (const k of ["duration", "n", "maxUsd"]) if (a[k] !== undefined) a[k] = Number(a[k]);
  return a;
}

export function detectMode(a) {
  if (a.motionVideo || a.characterImage) return "motion-control";
  if (a.refs.length || a.refVideo) return "reference-to-video";
  if (a.firstFrame || a.lastFrame) return "first-last-frame";
  if (a.imageUrl) return "image-to-video";
  return "text-to-video";
}

export function parseCamera(spec) {
  const [type, cfg] = spec.split(":");
  const out = { type };
  if (cfg) {
    out.config = {};
    for (const pair of cfg.split(",")) {
      const [k, v] = pair.split("=");
      out.config[k.trim()] = Number(v);
    }
  }
  return out;
}

export function buildRequest(a) {
  const mode = detectMode(a);
  const req = { model: a.model, duration: a.duration, aspectRatio: a.aspect, n: a.n, poll: { intervalMs: 5000, timeoutMs: 10 * 60 * 1000 } };
  if (a.resolution) req.resolution = a.resolution;
  if (mode === "text-to-video") req.prompt = a.prompt;
  else if (mode === "image-to-video") req.prompt = { image: a.imageUrl, text: a.prompt };
  else if (mode === "first-last-frame") {
    req.prompt = a.prompt;
    req.frameImages = [];
    if (a.firstFrame) req.frameImages.push({ image: a.firstFrame, frameType: "first_frame" });
    if (a.lastFrame) req.frameImages.push({ image: a.lastFrame, frameType: "last_frame" });
  } else if (mode === "reference-to-video") {
    req.prompt = a.prompt;
    req.inputReferences = [...a.refs];
    if (a.refVideo) req.inputReferences.push({ data: a.refVideo, mediaType: "video/mp4" });
  } else if (mode === "motion-control") {
    req.prompt = { image: a.characterImage, text: a.prompt };
    req.providerOptions = { klingai: { videoUrl: a.motionVideo, characterOrientation: a.orientation, mode: a.quality } };
  }
  if (a.camera) {
    req.providerOptions = { ...(req.providerOptions ?? {}), klingai: { ...(req.providerOptions?.klingai ?? {}), cameraControl: parseCamera(a.camera) } };
  } else if (mode === "first-last-frame" && a.model.startsWith("klingai/")) {
    req.providerOptions = { klingai: { mode: a.quality === "std" ? "pro" : a.quality } };
  }
  return { mode, req };
}

export function validate(a, mode) {
  const problems = [];
  if (!a.model || !Number.isFinite(a.duration) || a.duration <= 0) problems.push("Required: --model <id> --duration <seconds>");
  if (mode === "text-to-video" && !a.prompt) problems.push("--prompt is required for text-to-video");
  if (mode === "image-to-video" && !a.imageUrl) problems.push("--image-url is required");
  if (mode === "motion-control" && !(a.characterImage && a.motionVideo)) problems.push("motion-control needs both --character-image and --motion-video");
  if (a.camera && mode !== "image-to-video") problems.push("--camera works with image-to-video only (it cannot be combined with first/last frame or motion control)");
  for (const k of ["imageUrl", "firstFrame", "lastFrame", "refVideo", "characterImage", "motionVideo"]) {
    if (a[k] && !/^https:\/\//i.test(a[k])) problems.push(`--${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())} must be a hosted https URL (inline data is capped at 300 KiB)`);
  }
  for (const r of a.refs) if (!/^https:\/\//i.test(r)) problems.push("--ref must be a hosted https URL");
  return problems;
}

function hostOf(u) {
  try {
    return new URL(u).host;
  } catch {
    return "invalid-url";
  }
}

function main() {
  loadEnvFile();
  let a;
  try {
    a = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  const mode = detectMode(a);
  const problems = validate(a, mode);
  if (problems.length) {
    for (const p of problems) console.error(p);
    process.exit(1);
  }
  const caps = JSON.parse(readFileSync(join(here, "capabilities.json"), "utf8"));
  const listed = (caps.modes[mode] ?? []).includes(a.model);
  const cameraListed = !a.camera || caps.camera_control.includes(a.model);
  const pricing = JSON.parse(readFileSync(join(here, "pricing.json"), "utf8"));
  const price = pricing.models[a.model]?.usd_per_second ?? null;
  const estimate = price == null ? null : +(price * a.duration * a.n).toFixed(4);
  const keyPresent = Boolean(process.env[KEY_NAME]);
  const { req } = buildRequest(a);

  console.log("--- Paid call approval card ---");
  console.log(`Provider:       Vercel AI Gateway`);
  console.log(`Model:          ${a.model}`);
  console.log(`Mode:           ${mode}${a.camera ? " + camera control" : ""}`);
  console.log(`Duration/size:  ${a.duration}s x ${a.n}, ${a.aspect}${a.resolution ? `, ${a.resolution}` : ""}`);
  const inputs = [a.imageUrl, a.firstFrame, a.lastFrame, a.refVideo, a.characterImage, a.motionVideo, ...a.refs].filter(Boolean);
  if (inputs.length) console.log(`Inputs:         ${inputs.length} hosted file(s) from ${[...new Set(inputs.map(hostOf))].join(", ")}`);
  console.log(`Estimated cost: ${estimate == null ? "unknown - price not set in pricing.json" : `$${estimate}`}`);
  console.log(`Spend cap:      $${a.maxUsd}`);
  console.log(`Capability:     ${listed && cameraListed ? "model is listed for this mode in capabilities.json" : "UNVERIFIED: this model is not listed for this mode (check verify-gateway.mjs)"}`);
  console.log(`API key:        ${KEY_NAME} ${keyPresent ? "is set" : "is NOT set"} (value never printed)`);
  console.log("-------------------------------");

  if (!a.confirm) {
    console.log("Dry run only. Nothing was sent. Re-run with --confirm after the user approves.");
    return;
  }
  const refuse = (m) => {
    console.error(`REFUSED: ${m}`);
    process.exit(2);
  };
  if (!keyPresent) refuse(`${KEY_NAME} is not set (agentoon-video/.env).`);
  if (estimate == null) refuse("estimated cost unknown. Set usd_per_second in pricing.json first.");
  if (estimate > a.maxUsd) refuse(`estimate $${estimate} exceeds --max-usd ${a.maxUsd}.`);
  if (!(listed && cameraListed) && !a.allowUnverified) refuse("model is not listed for this mode. Check the live catalog, or pass --allow-unverified.");
  return live(a, req);
}

async function live(a, req) {
  let gatewayPkg, ai;
  try {
    gatewayPkg = await import("@ai-sdk/gateway");
    ai = await import("ai");
  } catch {
    console.error("Missing packages: `ai` and `@ai-sdk/gateway`. Install them in agentoon-video only after approval.");
    process.exit(3);
  }
  const gateway = gatewayPkg.createGateway({ apiKey: process.env[KEY_NAME] });
  const result = await ai.experimental_generateVideo({ ...req, model: gateway.videoModel(a.model) });
  const outDir = join(here, "out", "ai");
  mkdirSync(outDir, { recursive: true });
  result.videos.forEach((video, i) => {
    const file = a.out && result.videos.length === 1 ? a.out : join(outDir, `clip-${Date.now()}-${i + 1}.mp4`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, video.uint8Array);
    console.log(`Saved ${file}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
