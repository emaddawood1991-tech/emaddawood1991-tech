#!/usr/bin/env node
// Deterministic engine router for Agentoon.ai scenes. Free, local, no network.
//   node route.mjs "scene description"
//   node route.mjs --manifest scenes.json      (array of { "description": "...", "seconds": 6 })
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const config = JSON.parse(readFileSync(join(here, "engines.json"), "utf8"));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const has = (text, phrase) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(phrase)}([^a-z0-9]|$)`).test(text);
const hasAny = (text, phrases) => phrases.some((p) => has(text, p));

export function routeScene(description, opts = {}) {
  const text = String(description).toLowerCase();
  const scores = {};
  const matched = {};

  for (const [name, engine] of Object.entries(config.engines)) {
    scores[name] = 0;
    matched[name] = [];
    for (const [phrase, weight] of Object.entries(engine.keywords)) {
      if (has(text, phrase)) {
        scores[name] += weight;
        matched[name].push(phrase);
      }
    }
  }

  const notes = [];
  let requiresReferenceImage = false;
  const o = config.overrides;
  const imageToVideo = has(text, "image-to-video") || has(text, "image to video");

  if (hasAny(text, o.mascotTerms) && scores["ai-gateway"] > 0 && !imageToVideo) {
    scores["ai-gateway"] = 0;
    scores.blender += 3;
    notes.push("Mascot rule: never generate the Agentoon robot from text. Use Blender or HyperFrames.");
  }
  if (hasAny(text, o.mascotTerms) && imageToVideo) {
    requiresReferenceImage = true;
    notes.push("Use an approved render of the real robot as the first frame.");
  }
  if (scores.blender > 0 && scores["ai-gateway"] > 0 && hasAny(text, o.precisionTerms) && !requiresReferenceImage) {
    scores["ai-gateway"] = 0;
    notes.push("Precision wins: exact control, rigs and consistent characters go to Blender.");
  }
  if (hasAny(text, o.softwareTerms)) {
    scores.playwright += 3;
    if (scores["ai-gateway"] > 0) {
      scores["ai-gateway"] = 0;
      notes.push("Real software is always captured for real, never AI-generated.");
    }
  }

  const ranked = Object.keys(scores).sort(
    (a, b) => scores[b] - scores[a] || config.priority.indexOf(a) - config.priority.indexOf(b)
  );
  const top = ranked[0];
  const topScore = scores[top];
  const second = scores[ranked[1]];

  let engine = top;
  let confidence;
  if (topScore === 0) {
    engine = config.defaultComposer;
    confidence = "low";
    notes.push("No strong match: defaulting to the composer. Ask the user for more detail.");
  } else if (topScore >= 4 && topScore - second >= 2) {
    confidence = "high";
  } else if (topScore >= 2) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  // If the chosen engine cannot run in this environment, fall back to the best available match.
  let fallbackFrom = null;
  if (Array.isArray(opts.available) && !opts.available.includes(engine)) {
    const alt = ranked.find(
      (n) => scores[n] > 0 && opts.available.includes(n) && !hasAny(text, config.engines[n].not_for ?? [])
    );
    if (alt) {
      fallbackFrom = engine;
      engine = alt;
      notes.push(`${fallbackFrom} is not available in this environment; using ${alt}. Re-run on the machine that has ${fallbackFrom} for the precise version.`);
    } else {
      notes.push(`${engine} is not available in this environment and nothing else matched: hand off to a machine that has it.`);
    }
  }

  const info = config.engines[engine];
  if (info.paid) {
    notes.push("Paid engine: show provider, model and estimated cost and get approval first.");
    notes.push("Free alternatives: Blender (3D) or Pexels (stock footage).");
  }

  return {
    engine,
    fallbackFrom,
    confidence,
    score: topScore,
    matched: matched[engine] ?? [],
    alternatives: ranked.filter((n) => n !== engine && scores[n] > 0),
    cost: info.cost,
    paid: info.paid,
    requiresApproval: info.paid,
    requiresReferenceImage,
    composer: engine === "hyperframes" ? "hyperframes" : config.defaultComposer,
    notes,
  };
}

export function routeManifest(scenes, opts = {}) {
  const routed = scenes.map((scene, i) => ({
    scene: i + 1,
    seconds: scene.seconds ?? null,
    description: scene.description,
    ...routeScene(scene.description, opts),
  }));
  const paidScenes = routed.filter((s) => s.paid).map((s) => s.scene);
  const finalComposer = routed.some((s) => s.engine === "hyperframes")
    ? "hyperframes"
    : config.defaultComposer;
  return { scenes: routed, paidScenes, finalComposer, hybrid: new Set(routed.map((s) => s.engine)).size > 1 };
}

async function main(argv) {
  const opts = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--available") opts.available = argv[++i].split(",").map((x) => x.trim()).filter(Boolean);
    else if (argv[i] === "--auto") {
      const { detectAvailable } = await import("./available.mjs");
      opts.available = Object.entries(detectAvailable()).filter(([, ok]) => ok).map(([k]) => k);
    } else rest.push(argv[i]);
  }
  argv = rest;
  if (argv[0] === "--manifest") {
    const scenes = JSON.parse(readFileSync(argv[1], "utf8"));
    const plan = routeManifest(scenes, opts);
    for (const s of plan.scenes) {
      console.log(`Scene ${s.scene}: ${s.engine.padEnd(11)} [${s.confidence}] ${s.cost}  - ${s.description}`);
      for (const n of s.notes) console.log(`   note: ${n}`);
    }
    console.log(`\nFinal composer: ${plan.finalComposer}`);
    console.log(`Hybrid: ${plan.hybrid}`);
    console.log(`Scenes needing paid approval: ${plan.paidScenes.length ? plan.paidScenes.join(", ") : "none"}`);
    return;
  }
  const description = argv.join(" ").trim();
  if (!description) {
    console.error('Usage: node route.mjs [--available blender,threejs,... | --auto] "scene description" | --manifest scenes.json');
    process.exit(1);
  }
  console.log(JSON.stringify(routeScene(description, opts), null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
