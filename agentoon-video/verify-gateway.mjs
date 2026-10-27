#!/usr/bin/env node
// Free local check of the Agentoon.ai Vercel AI Gateway setup. No generation requests, no charge, key never printed.
//   node verify-gateway.mjs                 verify key, credits and video models
//   node verify-gateway.mjs --write-pricing also write per-second prices it can read into pricing.json
// Checks: .env present and git-ignored, key set (length only), authentication via GET /v1/credits,
// credit balance, and the video models (with pricing) listed by GET /v1/models.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh").replace(/\/$/, "");
const envFile = process.env.AGENTOON_ENV_FILE ?? join(here, ".env");
const pricingFile = process.env.AGENTOON_PRICING_FILE ?? join(here, "pricing.json");
const modelsFile = process.env.AGENTOON_MODELS_FILE ?? join(here, "gateway-models.json");
const writePricing = process.argv.includes("--write-pricing");

const problems = [];
const line = (state, text) => console.log(`${state.padEnd(5)} ${text}`);
const fail = (text) => {
  line("FAIL", text);
  problems.push(text);
};

// 1. .env exists and is ignored by git
if (!existsSync(envFile)) fail(".env not found in agentoon-video/. Copy .env.example to .env and add the key.");
else if (envFile === join(here, ".env")) {
  const ignored = spawnSync("git", ["check-ignore", "-q", envFile], { cwd: here }).status === 0;
  if (ignored) line("OK", ".env is git-ignored");
  else fail(".env is NOT git-ignored. Do not commit until fixed.");
}

// 2. Key present (value never shown)
let key = "";
if (existsSync(envFile)) {
  const m = readFileSync(envFile, "utf8").match(/^\s*AI_GATEWAY_API_KEY\s*=\s*(.*?)\s*$/m);
  key = (m?.[1] ?? "").replace(/^["']|["']$/g, "");
}
if (key) line("OK", `AI_GATEWAY_API_KEY is set in .env (${key.length} characters, value hidden)`);
else fail("AI_GATEWAY_API_KEY is empty in .env");

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(20000),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// Find a per-second price inside a pricing object: only when exactly one candidate exists.
function perSecond(pricing) {
  const found = new Set();
  const walk = (value, name) => {
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, k);
    } else if (/second/i.test(name) && value !== null && value !== "" && Number.isFinite(Number(value))) {
      found.add(Number(value));
    }
  };
  walk(pricing, "");
  return found.size === 1 ? [...found][0] : null;
}

let creditsOk = false;
let videoModels = [];

if (key) {
  try {
    // 3. Authentication + balance (authenticated, non-generation endpoint)
    const credits = await get("/v1/credits");
    if (credits.status === 200) {
      const balance = Number(credits.body?.balance);
      const used = Number(credits.body?.total_used);
      line("OK", "Authenticated with Vercel AI Gateway (key accepted)");
      line(balance > 0 ? "OK" : "WARN", `Credits: balance $${Number.isFinite(balance) ? balance.toFixed(2) : "?"}, used $${Number.isFinite(used) ? used.toFixed(2) : "?"}`);
      creditsOk = balance > 0;
      if (!creditsOk) problems.push("no AI Gateway credits: add credits to the Vercel team before generating video");
    } else if (credits.status === 401 || credits.status === 403) {
      fail(`Key rejected by the gateway (HTTP ${credits.status}). Check the key is Active and copied in full.`);
    } else {
      fail(`Unexpected response from /v1/credits (HTTP ${credits.status})`);
    }

    // 4. Video models with pricing
    const models = await get("/v1/models");
    if (models.status === 200 && Array.isArray(models.body?.data)) {
      videoModels = models.body.data
        .filter((m) => m.type === "video")
        .map((m) => ({ id: m.id, name: m.name ?? m.id, pricing: m.pricing ?? null, perSecond: perSecond(m.pricing) }));
      if (videoModels.length === 0) fail("No models typed as video were returned. Check the Models page filtered by video generation.");
      else {
        line("OK", `${videoModels.length} video model(s) available:`);
        for (const m of videoModels) {
          const price = m.perSecond !== null ? `$${m.perSecond}/s` : `pricing: ${JSON.stringify(m.pricing)}`;
          console.log(`      ${m.id.padEnd(36)} ${price}`);
        }
        writeFileSync(modelsFile, JSON.stringify({ fetchedAt: new Date().toISOString(), models: videoModels }, null, 2) + "\n");
      }
    } else {
      fail(`Could not list models (HTTP ${models.status})`);
    }
  } catch (e) {
    fail(`Could not reach the gateway: ${e.message}`);
  }
}

// 4b. Which requested video modes are covered by the live catalog (capabilities.json comes from the docs)
if (videoModels.length) {
  const capsFile = join(here, "capabilities.json");
  if (existsSync(capsFile)) {
    const caps = JSON.parse(readFileSync(capsFile, "utf8"));
    const live = new Set(videoModels.map((m) => m.id));
    console.log("\nVideo modes (docs) vs live catalog:");
    for (const [mode, ids] of Object.entries({ ...caps.modes, "camera-control": caps.camera_control })) {
      console.log(`  ${mode.padEnd(20)} ${ids.map((id) => `${id}${live.has(id) ? "" : " (not in live catalog)"}`).join(", ")}`);
    }
    console.log("");
  }
}

// 5. Compare with pricing.json and optionally fill prices
if (videoModels.length && existsSync(pricingFile)) {
  const pricing = JSON.parse(readFileSync(pricingFile, "utf8"));
  const catalog = new Set(videoModels.map((m) => m.id));
  const missing = Object.keys(pricing.models).filter((id) => !catalog.has(id));
  if (missing.length) line("WARN", `In pricing.json but not listed by the gateway: ${missing.join(", ")}`);
  const unknown = videoModels.filter((m) => !(m.id in pricing.models)).map((m) => m.id);
  if (unknown.length) line("INFO", `Listed by the gateway but not in pricing.json: ${unknown.join(", ")}${writePricing ? " (adding)" : " (use --write-pricing to add)"}`);

  if (writePricing) {
    let updated = 0;
    for (const m of videoModels) {
      const entry = pricing.models[m.id] ?? { usd_per_second: null, verified: false };
      if (m.perSecond !== null) {
        entry.usd_per_second = m.perSecond;
        entry.verified = true;
        updated++;
      }
      pricing.models[m.id] = entry;
    }
    writeFileSync(pricingFile, JSON.stringify(pricing, null, 2) + "\n");
    line("OK", `pricing.json updated (${updated} model price(s) read from the gateway)`);
  }
  const priced = Object.entries(pricing.models).filter(([id, v]) => catalog.has(id) && v.usd_per_second !== null).length;
  if (priced === 0) problems.push("no video model has a per-second price in pricing.json yet (run with --write-pricing or enter prices from the Models page)");
}

console.log("");
if (problems.length === 0) {
  console.log("READY: authenticated, credits available, video models and prices known. Paid clips still need your approval each time.");
  process.exit(0);
}
console.log("NOT READY:");
for (const p of problems) console.log(`  - ${p}`);
process.exit(1);
