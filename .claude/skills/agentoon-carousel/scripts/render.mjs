#!/usr/bin/env node
// Usage: node render.mjs <carousel-dir> [--zip]
// Renders source/index.html → png/slide-NN.png (1080×1350), runs layout QA, builds contact-sheet.png.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { console.error("Playwright not found. Run: npm i -D playwright && npx playwright install chromium"); process.exit(2); }

const dir = path.resolve(process.argv[2] || ".");
const doZip = process.argv.includes("--zip");
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "carousel.json"), "utf8"));
const png = path.join(dir, "png");
fs.rmSync(png, { recursive: true, force: true });
fs.mkdirSync(png, { recursive: true });

let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); }
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, "source", "index.html")).href);
await page.evaluate(() => document.fonts.ready);

/* ---- font sanity: real brand fonts must be loaded ---- */
const fonts = await page.evaluate(() => ["800 40px Fraunces", "italic 500 40px Fraunces", "500 30px Inter", "600 30px 'JetBrains Mono'"].map((f) => [f, document.fonts.check(f)]));
const missing = fonts.filter(([, ok]) => !ok).map(([f]) => f);

/* ---- layout QA ---- */
const issues = await page.evaluate(() => {
  const out = [];
  for (const slide of document.querySelectorAll(".slide")) {
    const n = slide.dataset.slide, sr = slide.getBoundingClientRect();
    const footer = slide.querySelector(".footer").getBoundingClientRect();
    const decor = (el) => !!el.closest("[data-decor]");
    // 1) text nodes: clipped by slide edge / safe margin / footer collision / tiny
    const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
    let t;
    while ((t = walker.nextNode())) {
      if (!t.textContent.trim()) continue;
      const el = t.parentElement;
      if (decor(el)) continue;
      const range = document.createRange(); range.selectNodeContents(t);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const txt = t.textContent.trim().slice(0, 40);
      const inFooter = !!el.closest(".footer");
      if (r.left < sr.left + 40 || r.right > sr.right - 40 || r.top < sr.top + 40) out.push({ n, level: "error", msg: `text outside safe margin: "${txt}"` });
      if (!inFooter && r.bottom > footer.top - 8) out.push({ n, level: "error", msg: `text collides with footer: "${txt}"` });
      if (fs < 24) out.push({ n, level: "error", msg: `font ${fs}px < 24px: "${txt}"` });
    }
    // 2) boxes whose content overflows (clipped code blocks, cards, callouts)
    for (const el of slide.querySelectorAll(".code,.card,.watch,.pill")) {
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) out.push({ n, level: "error", msg: `content overflows <${el.className}> "${el.textContent.trim().slice(0, 30)}"` });
    }
    // 2b) stacked blocks must not overlap (diagram vs code block etc.)
    const blocks = [...slide.children].filter((c) => !c.classList.contains("footer") && getComputedStyle(c).position !== "absolute").map((c) => {
      if (!c.classList.contains("grow") || !c.children.length) return c.getBoundingClientRect();
      const rs = [...c.children].map((x) => x.getBoundingClientRect());
      return { top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)), el: c };
    });
    const last = blocks[blocks.length - 1];
    if (last && last.bottom > footer.top - 24) out.push({ n, level: "error", msg: `last block runs into footer by ${Math.round(last.bottom - footer.top + 24)}px (keep a 24px gap)` });
    for (let i = 0; i < blocks.length - 1; i++) if (blocks[i].bottom > blocks[i + 1].top + 2 && blocks[i].bottom - blocks[i].top > 1) out.push({ n, level: "error", msg: `block ${i + 1} overlaps block ${i + 2} by ${Math.round(blocks[i].bottom - blocks[i + 1].top)}px` });
    // 3) SVG text must stay inside its viewBox / slide
    for (const tx of slide.querySelectorAll("svg text")) {
      const r = tx.getBoundingClientRect(), p = tx.ownerSVGElement.getBoundingClientRect();
      if (r.left < p.left - 1 || r.right > p.right + 1 || r.top < p.top - 1 || r.bottom > p.bottom + 1) out.push({ n, level: "error", msg: `svg text clipped: "${tx.textContent}"` });
      const fs = parseFloat(tx.getAttribute("font-size"));
      if (fs < 24) out.push({ n, level: "error", msg: `svg font ${fs}px < 24px: "${tx.textContent}"` });
    }
  }
  return out;
});

/* ---- export PNGs ---- */
const slides = await page.$$(".slide");
for (let i = 0; i < slides.length; i++) {
  const file = path.join(png, `slide-${String(i + 1).padStart(2, "0")}.png`);
  await slides[i].screenshot({ path: file });
}

/* ---- contact sheet (3 columns) ---- */
const cols = 3, w = 360, h = Math.round((w * 1350) / 1080);
const imgs = fs.readdirSync(png).filter((f) => f.endsWith(".png")).sort();
const rows = Math.ceil(imgs.length / cols);
const sheetHtml = `<!doctype html><body style="margin:0;background:#05070f;font-family:Inter,sans-serif">
<div style="padding:40px 40px 20px;color:#F4F1EA;display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:34px">${cfg.title}</b><span style="color:#A9B0C9;font-size:26px">agentoon.ai · ${imgs.length} slides · 1080×1350</span></div>
<div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:28px;padding:20px 40px 40px">
${imgs.map((f, i) => `<figure style="margin:0"><img src="${pathToFileURL(path.join(png, f)).href}" width="${w}" height="${h}" style="border-radius:14px;display:block;box-shadow:0 0 0 2px rgba(255,255,255,.12)"><figcaption style="color:#A9B0C9;font:600 22px 'JetBrains Mono',monospace;margin-top:10px">${String(i + 1).padStart(2, "0")}</figcaption></figure>`).join("")}
</div></body>`;
const tmp = path.join(dir, ".contact.html");
fs.writeFileSync(tmp, sheetHtml);
const sheet = await browser.newPage({ viewport: { width: cols * w + 80 + (cols - 1) * 28, height: 400 } });
await sheet.goto(pathToFileURL(tmp).href);
await sheet.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
await sheet.screenshot({ path: path.join(dir, "contact-sheet.png"), fullPage: true });
fs.rmSync(tmp);
await browser.close();

/* ---- report ---- */
const errs = issues.filter((i) => i.level === "error"), warns = issues.filter((i) => i.level === "warn");
console.log(`rendered ${imgs.length} slides → ${path.relative(process.cwd(), png)}/ + contact-sheet.png`);
if (missing.length) console.log("✗ fonts missing:", missing.join(", "));
else console.log("✓ brand fonts loaded (Fraunces, Inter, JetBrains Mono)");
for (const i of [...errs, ...warns]) console.log(`${i.level === "error" ? "✗" : "!"} slide ${i.n}: ${i.msg}`);
if (!errs.length && !missing.length) console.log("✓ QA passed: no clipping, overflow, footer collisions or text under 24px");

if (doZip) {
  const slug = cfg.slug || path.basename(dir);
  const zip = path.join(dir, `${slug}.zip`);
  fs.rmSync(zip, { force: true });
  const inc = ["png", "source", "carousel.json", "contact-sheet.png", "caption.md"].filter((p) => fs.existsSync(path.join(dir, p)));
  execFileSync("zip", ["-qr", zip, ...inc], { cwd: dir });
  console.log("✓ zip →", path.relative(process.cwd(), zip));
}
process.exit(errs.length || missing.length ? 1 : 0);
