#!/usr/bin/env node
// Usage: node new.mjs "<topic>" [--slug my-slug] [--recipe how-to|explainer|toolkit|workflow] [--out carousels]
// Scaffolds <out>/<slug>/carousel.json from a layout recipe. Picks a recipe whose slide sequence differs from
// your existing carousels so posts don't look identical. Then YOU fill every TODO with researched copy.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const topic = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")))[0];
if (!topic) { console.error('Usage: new.mjs "<topic>" [--slug s] [--recipe r] [--out dir]'); process.exit(2); }
const out = path.resolve(flag("out") || "carousels");
const slug = flag("slug") || topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
const { recipes } = JSON.parse(fs.readFileSync(path.join(here, "..", "templates", "recipes.json"), "utf8"));

// signatures of carousels you already made (layout + theme sequence)
const sig = (slides) => slides.map((s) => `${s.layout}:${s.theme}:${s.diagram?.type || s.diagram || ""}`).join("|");
const used = [];
if (fs.existsSync(out)) for (const d of fs.readdirSync(out)) {
  const f = path.join(out, d, "carousel.json");
  if (fs.existsSync(f)) try { used.push(JSON.parse(fs.readFileSync(f, "utf8")).slides.map((s) => s.layout).join(",")); } catch {}
}
const names = Object.keys(recipes);
let pick = flag("recipe");
if (!pick) {
  const start = parseInt(crypto.createHash("md5").update(topic).digest("hex").slice(0, 6), 16) % names.length;
  const order = names.map((_, i) => names[(start + i) % names.length]);
  pick = order.find((n) => !used.includes(recipes[n].slides.map((s) => s.layout).join(","))) || order[0];
}
if (!recipes[pick]) { console.error(`Unknown recipe "${pick}". Choose: ${names.join(", ")}`); process.exit(2); }
const dir = path.join(out, slug);
if (fs.existsSync(path.join(dir, "carousel.json"))) { console.error(`✗ ${dir}/carousel.json already exists. Pick another --slug (existing carousels are never overwritten).`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const cfg = { slug, title: topic, handle: "@agentoon.ai", recipe: pick, slides: recipes[pick].slides };
fs.writeFileSync(path.join(dir, "carousel.json"), JSON.stringify(cfg, null, 2));
console.log(`✓ ${path.relative(process.cwd(), dir)}/carousel.json  (recipe: ${pick} — ${recipes[pick].description})`);
console.log(`  slides: ${cfg.slides.map((s) => s.layout).join(" → ")}`);
console.log("  Next: fill every TODO, swap diagram types/moods to fit the topic, add extras.mjs for a bespoke illustration, then build + render.");
