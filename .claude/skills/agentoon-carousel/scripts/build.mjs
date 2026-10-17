#!/usr/bin/env node
// Usage: node build.mjs <carousel-dir>   (expects <carousel-dir>/carousel.json)
// Writes <carousel-dir>/source/index.html + copies design-system assets next to it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { layouts, diagrams, ills, esc } from "./lib.mjs";
import "./diagrams-generic.mjs";
import "./layouts-extra.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.resolve(process.argv[2] || ".");
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "carousel.json"), "utf8"));
const src = path.join(dir, "source");
fs.mkdirSync(path.join(src, "assets", "fonts"), { recursive: true });
fs.copyFileSync(path.join(skillRoot, "assets", "base.css"), path.join(src, "assets", "base.css"));
for (const f of fs.readdirSync(path.join(skillRoot, "assets", "fonts")))
  fs.copyFileSync(path.join(skillRoot, "assets", "fonts", f), path.join(src, "assets", "fonts", f));
const sprite = fs.readFileSync(path.join(skillRoot, "assets", "sprite.svg"), "utf8");

// Per-carousel bespoke illustrations/layouts: <carousel-dir>/extras.mjs may export { diagrams, layouts, css }.
let extraCss = "";
const extrasPath = path.join(dir, "extras.mjs");
if (fs.existsSync(extrasPath)) {
  const ex = await import(pathToFileURL(extrasPath).href + "?t=" + Date.now());
  const kit = await import("./kit.mjs");
  const r = typeof ex.default === "function" ? await ex.default(kit) : ex; // default export receives the kit: no import paths needed
  Object.assign(diagrams, r.diagrams || {});
  Object.assign(ills, r.ills || {});
  Object.assign(layouts, r.layouts || {});
  extraCss = r.css || "";
}
if (extraCss) fs.writeFileSync(path.join(src, "assets", "extra.css"), extraCss);

const total = cfg.slides.length;
if (total < 7 || total > 9) console.warn(`! carousel has ${total} slides (target 7–9)`);
const body = cfg.slides
  .map((s, i) => {
    const fn = layouts[s.layout];
    if (!fn) throw new Error(`Unknown layout "${s.layout}" on slide ${i + 1}`);
    return fn(s, { index: i + 1, total, handle: cfg.handle || "@agentoon.ai" });
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=1080">
<title>${esc(cfg.title)} — Agentoon.ai carousel</title>
<link rel="stylesheet" href="assets/base.css">${cfg.legacyMargins ? "\n<style>:root{--safe-top:72px;--safe-bottom:48px;--safe-x:72px;--pad-top:72px;--mascot-top:50px;--pad-bottom:150px}</style>" : ""}${extraCss ? '\n<link rel="stylesheet" href="assets/extra.css">' : ""}
</head><body>
${sprite}
<main class="deck">
${body}
</main></body></html>`;
fs.writeFileSync(path.join(src, "index.html"), html);
console.log(`built ${total} slides → ${path.relative(process.cwd(), path.join(src, "index.html"))}`);
