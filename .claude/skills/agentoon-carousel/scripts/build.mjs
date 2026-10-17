#!/usr/bin/env node
// Usage: node build.mjs <carousel-dir>   (expects <carousel-dir>/carousel.json)
// Writes <carousel-dir>/source/index.html + copies design-system assets next to it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { layouts, esc } from "./lib.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.resolve(process.argv[2] || ".");
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "carousel.json"), "utf8"));
const src = path.join(dir, "source");
fs.mkdirSync(path.join(src, "assets", "fonts"), { recursive: true });
fs.copyFileSync(path.join(skillRoot, "assets", "base.css"), path.join(src, "assets", "base.css"));
for (const f of fs.readdirSync(path.join(skillRoot, "assets", "fonts")))
  fs.copyFileSync(path.join(skillRoot, "assets", "fonts", f), path.join(src, "assets", "fonts", f));
const sprite = fs.readFileSync(path.join(skillRoot, "assets", "sprite.svg"), "utf8");

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
<link rel="stylesheet" href="assets/base.css">
</head><body>
${sprite}
<main class="deck">
${body}
</main></body></html>`;
fs.writeFileSync(path.join(src, "index.html"), html);
console.log(`built ${total} slides → ${path.relative(process.cwd(), path.join(src, "index.html"))}`);
