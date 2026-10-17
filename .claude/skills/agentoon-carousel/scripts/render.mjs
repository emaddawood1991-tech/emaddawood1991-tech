#!/usr/bin/env node
// Usage: node render.mjs <carousel-dir> [--zip]
// Renders source/index.html → png/slide-NN.png (1080×1350), runs the quality gate, builds contact-sheet.png,
// mobile-preview.png (390px-wide phone scale) and qa-report.md. Exit code 1 = at least one QA error.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { console.error("Playwright not found. Run: npm i -D playwright && npx playwright install chromium"); process.exit(2); }

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || ".");
const doZip = process.argv.includes("--zip");
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "carousel.json"), "utf8"));
const png = path.join(dir, "png");
fs.rmSync(png, { recursive: true, force: true });
fs.mkdirSync(png, { recursive: true });

/** Quality thresholds (px at 1080 wide). A 390pt phone shows slides at 0.361×: 26px → 9.4pt, 30px → 10.8pt, 32px → 11.6pt. */
const legacy = !!cfg.legacyMargins;
const TH = { safeTop: legacy ? 40 : 120, safeBottom: legacy ? 40 : 120, safeX: legacy ? 40 : 70, label: 26, body: 30, code: 32, svg: 28, contrast: 4.5, contrastLarge: 3, largePx: 40, margin: 40, pad: 72, footerGap: 24, emptyWarn: 240 };

let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); }
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, "source", "index.html")).href);
await page.evaluate(() => document.fonts.ready);

const fonts = await page.evaluate(() => ["800 40px Fraunces", "italic 500 40px Fraunces", "500 30px Inter", "600 30px 'JetBrains Mono'"].map((f) => [f, document.fonts.check(f)]));
const missing = fonts.filter(([, ok]) => !ok).map(([f]) => f);

/* ------------------------------------------------------------------ QA (runs in the page, one slide at a time) */
const qa = ({ n, TH }) => {
  const slide = document.querySelector(`.slide[data-slide="${n}"]`);
  slide.scrollIntoView({ block: "start" });
  const out = [], stats = { minFont: 999, minContrast: 99, texts: [] };
  const sr = slide.getBoundingClientRect();
  const footer = slide.querySelector(".footer").getBoundingClientRect();
  const decor = (el) => !!el.closest("[data-decor]");

  // ---- colour helpers (contrast against whatever is really painted behind the text)
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const backdrop = (el, x, y) => {
    const layers = [];
    for (const e of document.elementsFromPoint(x, y)) {
      if (el instanceof SVGElement && (e === el || el.contains(e))) continue;
      const cs = getComputedStyle(e);
      const isSvgShape = e instanceof SVGElement && !(e instanceof SVGSVGElement) && e.tagName !== "text" && e.tagName !== "tspan";
      let c = isSvgShape ? parse(cs.fill) : parse(cs.backgroundColor);
      if (isSvgShape && c) c.a *= parseFloat(cs.fillOpacity || 1);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 0.99) break; }
    }
    let base = layers.length && layers[layers.length - 1].a >= 0.99 ? layers.pop() : { r: 255, g: 255, b: 255, a: 1 };
    while (layers.length) base = over(layers.pop(), base);
    return base;
  };

  // ---- 1) every text node
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = walker.nextNode())) {
    const txt = t.textContent.trim();
    if (!txt) continue;
    const el = t.parentElement;
    if (decor(el)) continue;
    const range = document.createRange(); range.selectNodeContents(t);
    const r = range.getBoundingClientRect();
    if (!r.width) continue;
    const cs = getComputedStyle(el);
    const isSvg = el instanceof SVGElement;
    const fs = parseFloat(isSvg ? el.getAttribute("font-size") || cs.fontSize : cs.fontSize);
    const short = txt.slice(0, 38);
    const inFooter = !!el.closest(".footer");
    const isLabel = !!el.closest(".kicker,.label,.src,.tag,.badge,.footer,.dots");
    const isCode = !!el.closest(".code");
    const need = isSvg ? TH.svg : isLabel ? TH.label : isCode ? TH.code : TH.body;
    if (/\bTODO\b/.test(txt)) out.push({ n, level: "error", msg: `unfilled placeholder: "${short}"` });
    stats.minFont = Math.min(stats.minFont, fs);
    stats.texts.push({ txt: short, fs });
    if (fs < need) out.push({ n, level: "error", msg: `font ${fs}px < ${need}px (${isSvg ? "diagram" : isLabel ? "label" : isCode ? "code" : "body"} text): "${short}"` });
    // safe margins
    if (r.left < sr.left + TH.safeX - 0.5 || r.right > sr.right - TH.safeX + 0.5 || r.top < sr.top + TH.safeTop - 0.5 || r.bottom > sr.bottom - TH.safeBottom + 0.5) out.push({ n, level: "error", msg: `text outside the Instagram safe area (${TH.safeX}px sides, ${TH.safeTop}px top, ${TH.safeBottom}px bottom): "${short}"` });
    if (!inFooter && r.bottom > footer.top - 8) out.push({ n, level: "error", msg: `text collides with footer: "${short}"` });
    // contrast
    const fg0 = parse(isSvg ? cs.fill : cs.color);
    if (fg0) {
      const bg = backdrop(el, r.left + r.width / 2, r.top + r.height / 2);
      const fg = over({ ...fg0, a: fg0.a * (parseFloat(cs.opacity) || 1) }, bg);
      const cr = ratio(fg, bg);
      const large = fs >= TH.largePx;
      stats.minContrast = Math.min(stats.minContrast, cr);
      if (cr < (large ? TH.contrastLarge : TH.contrast)) out.push({ n, level: "error", msg: `low contrast ${cr.toFixed(2)}:1 (need ${large ? TH.contrastLarge : TH.contrast}): "${short}"` });
    }
  }

  // ---- 2) boxes whose content overflows
  for (const el of slide.querySelectorAll(".code,.card,.watch,.pill,.badge")) {
    if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) out.push({ n, level: "error", msg: `content overflows <${el.className}> "${el.textContent.trim().slice(0, 30)}"` });
  }

  // ---- 2b) children must stay inside their card / pill / callout / code box
  for (const box of slide.querySelectorAll(".card,.watch,.pill,.code")) {
    const br = box.getBoundingClientRect();
    for (const ch of box.querySelectorAll("*")) {
      if (decor(ch) || ch instanceof SVGElement && !(ch instanceof SVGSVGElement)) continue;
      const r = ch.getBoundingClientRect();
      if (r.width && (r.right > br.right + 2 || r.left < br.left - 2 || r.bottom > br.bottom + 2 || r.top < br.top - 2)) { out.push({ n, level: "error", msg: `<${ch.tagName.toLowerCase()} class="${ch.className}"> spills out of <${box.className.split(" ")[0]}> ("${ch.textContent.trim().slice(0, 24)}")` }); break; }
    }
  }

  // ---- 3) stacked blocks: no overlap, left-edge alignment, right margin, gap above footer
  const kids = [...slide.children].filter((c) => !c.classList.contains("footer") && getComputedStyle(c).position !== "absolute");
  const blocks = kids.map((c) => {
    if (!c.classList.contains("grow") || !c.children.length) return { el: c, ...c.getBoundingClientRect().toJSON() };
    const rs = [...c.children].map((x) => x.getBoundingClientRect());
    return { el: c, top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)), left: Math.min(...rs.map((r) => r.left)), right: Math.max(...rs.map((r) => r.right)) };
  });
  const real = blocks.filter((b) => b.bottom - b.top > 1);
  const last = real[real.length - 1];
  if (last && last.bottom > footer.top - TH.footerGap) out.push({ n, level: "error", msg: `last block runs into footer by ${Math.round(last.bottom - footer.top + TH.footerGap)}px (keep ${TH.footerGap}px gap)` });
  for (let i = 0; i < real.length - 1; i++) if (real[i].bottom > real[i + 1].top + 2) out.push({ n, level: "error", msg: `block ${i + 1} overlaps block ${i + 2} by ${Math.round(real[i].bottom - real[i + 1].top)}px` });
  for (const b of real) {
    if (Math.abs(b.left - (sr.left + TH.pad)) > 2) out.push({ n, level: "error", msg: `misaligned block (left ${Math.round(b.left - sr.left)}px, expected ${TH.pad}px): <${b.el.className.split(" ")[0] || b.el.tagName.toLowerCase()}>` });
    if (b.right > sr.right - TH.pad + 2) out.push({ n, level: "error", msg: `block pushes past right margin by ${Math.round(b.right - (sr.right - TH.pad))}px: <${b.el.className.split(" ")[0] || b.el.tagName.toLowerCase()}>` });
  }

  // ---- 3b) advisory: large dead zones (not an error, but fix by adding content or enlarging the illustration)
  let free = 0;
  for (const g of slide.querySelectorAll(":scope > .grow")) {
    const gr = g.getBoundingClientRect();
    const ex = g.children.length ? Math.max(...[...g.children].map((x) => x.getBoundingClientRect().bottom)) - Math.min(...[...g.children].map((x) => x.getBoundingClientRect().top)) : 0;
    free += gr.height - ex;
  }
  if (free > TH.emptyWarn) out.push({ n, level: "warn", msg: `${Math.round(free)}px of dead space: add a point/step, enlarge the illustration, or switch layout` });

  // ---- 3c) every card, pill, code box, callout, diagram, mascot and the footer must sit inside the safe area too
  const bad = new Set();
  for (const el of slide.querySelectorAll(".card,.pill,.code,.banner,.watch,.badge,.footer,svg:not(.ic),[data-mascot]")) {
    if (el.closest("svg") && el.tagName.toLowerCase() === "svg" && el.parentElement.closest("svg")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    if (r.left < sr.left + TH.safeX - 1 || r.right > sr.right - TH.safeX + 1 || r.top < sr.top + TH.safeTop - 1 || r.bottom > sr.bottom - TH.safeBottom + 1) {
      const key = (el.className && el.className.baseVal === undefined ? String(el.className).split(" ")[0] : el.tagName.toLowerCase());
      if (!bad.has(key)) { bad.add(key); out.push({ n, level: "error", msg: `<${key}> leaves the safe area (x ${Math.round(r.left - sr.left)}–${Math.round(r.right - sr.left)}, y ${Math.round(r.top - sr.top)}–${Math.round(r.bottom - sr.top)})` }); }
    }
  }

  // ---- 4) SVG text stays inside its own viewBox
  for (const tx of slide.querySelectorAll("svg text")) {
    const r = tx.getBoundingClientRect(), p = tx.ownerSVGElement.getBoundingClientRect();
    if (r.left < p.left - 1 || r.right > p.right + 1 || r.top < p.top - 1 || r.bottom > p.bottom + 1) out.push({ n, level: "error", msg: `svg text clipped: "${tx.textContent}"` });
  }

  // ---- 5) decorative mascots must not sit on top of text
  for (const m of slide.querySelectorAll("[data-mascot]")) {
    if (m.closest(".footer")) continue;
    const mr = m.getBoundingClientRect();
    // the mascot's head must stand out from whatever is painted behind it
    const hv = getComputedStyle(m).getPropertyValue("--m-head").trim();
    const hx = hv.match(/^#([0-9a-f]{6})$/i);
    const hc = hx ? { r: parseInt(hx[1].slice(0, 2), 16), g: parseInt(hx[1].slice(2, 4), 16), b: parseInt(hx[1].slice(4), 16), a: 1 } : parse(hv);
    if (hc) { const bgc = backdrop(m, mr.left + mr.width * 0.5, mr.top + mr.height * 0.3); const rr = ratio(hc, bgc); if (rr < 1.6) out.push({ n, level: "error", msg: `mascot head blends into its background (${rr.toFixed(2)}:1): give it an explicit light/dark palette via mascot(w, mood, "--m-head:…")` }); }
    if (mr.left < sr.left || mr.right > sr.right || mr.top < sr.top || mr.bottom > sr.bottom - 0) out.push({ n, level: "error", msg: "mascot leaves the slide" });
    const w2 = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT); let u;
    while ((u = w2.nextNode())) {
      if (!u.textContent.trim() || decor(u.parentElement)) continue;
      const rg = document.createRange(); rg.selectNodeContents(u); const r = rg.getBoundingClientRect();
      if (r.width && r.left < mr.right - 6 && r.right > mr.left + 6 && r.top < mr.bottom - 6 && r.bottom > mr.top + 6) out.push({ n, level: "error", msg: `mascot overlaps text: "${u.textContent.trim().slice(0, 30)}"` });
    }
  }
  if (stats.texts.length) stats.texts = []; // keep payload small
  return { out, stats };
};

const total = await page.$$eval(".slide", (s) => s.length);
const issues = [], stats = [];
for (let n = 1; n <= total; n++) {
  const r = await page.evaluate(qa, { n, TH });
  issues.push(...r.out); stats.push({ n, ...r.stats });
}
// visible copy for the spell-checker
const texts = await page.$$eval(".slide", (ss) => ss.map((s, i) => ({ slide: i + 1, text: [...s.querySelectorAll("*")].filter((e) => !e.closest(".code,.footer,svg,[data-decor]") && [...e.childNodes].some((c) => c.nodeType === 3)).map((e) => [...e.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join(" ")).join(" . ") })));
const svgTexts = await page.$$eval(".slide", (ss) => ss.map((s, i) => ({ slide: i + 1, text: [...s.querySelectorAll("svg text")].map((t) => t.textContent).join(" . ") })));
fs.writeFileSync(path.join(dir, ".texts.json"), JSON.stringify([...texts, ...svgTexts]));

/* ------------------------------------------------------------------ export PNGs */
await page.evaluate(() => window.scrollTo(0, 0));
const slides = await page.$$(".slide");
for (let i = 0; i < slides.length; i++) await slides[i].screenshot({ path: path.join(png, `slide-${String(i + 1).padStart(2, "0")}.png`) });

/* ------------------------------------------------------------------ canvas size check (all slides identical, 1080x1350) */
const dimErrors = [];
for (const f of fs.readdirSync(png).filter((x) => x.endsWith(".png"))) {
  const b = fs.readFileSync(path.join(png, f)); const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  if (w !== 1080 || h !== 1350) dimErrors.push(`${f} is ${w}×${h}, expected 1080×1350`);
}

/* ------------------------------------------------------------------ contact sheet + phone-scale preview */
const imgs = fs.readdirSync(png).filter((f) => f.endsWith(".png")).sort();
async function sheet(name, w, cols, caption, pad = 40, gap = 28, guides = false) {
  const h = Math.round((w * 1350) / 1080);
  const html = `<!doctype html><body style="margin:0;background:#05070f;font-family:Inter,sans-serif">
<div style="padding:${pad}px ${pad}px 20px;color:#F4F1EA;display:flex;justify-content:space-between;align-items:baseline;gap:20px"><b style="font-size:${w > 380 ? 30 : 34}px">${cfg.title}</b><span style="color:#A9B0C9;font-size:${w > 380 ? 22 : 26}px">${caption}</span></div>
<div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:${gap}px;padding:20px ${pad}px ${pad}px">
${imgs.map((f, i) => `<figure style="margin:0"><div style="position:relative;width:${w}px;height:${h}px"><img src="${pathToFileURL(path.join(png, f)).href}" width="${w}" height="${h}" style="border-radius:${w > 380 ? 22 : 14}px;display:block;box-shadow:0 0 0 2px rgba(255,255,255,.12)">${guides ? `<div style="position:absolute;left:0;right:0;top:0;height:${TH.safeTop * w / 1080}px;background:rgba(255,40,70,.38);border-bottom:2px dashed #ff2846"></div><div style="position:absolute;left:0;right:0;bottom:0;height:${TH.safeBottom * w / 1080}px;background:rgba(255,40,70,.38);border-top:2px dashed #ff2846"></div><div style="position:absolute;top:${TH.safeTop * w / 1080}px;bottom:${TH.safeBottom * w / 1080}px;left:0;width:${TH.safeX * w / 1080}px;background:rgba(255,40,70,.22);border-right:2px dashed #ff2846"></div><div style="position:absolute;top:${TH.safeTop * w / 1080}px;bottom:${TH.safeBottom * w / 1080}px;right:0;width:${TH.safeX * w / 1080}px;background:rgba(255,40,70,.22);border-left:2px dashed #ff2846"></div>` : ""}</div><figcaption style="color:#A9B0C9;font:600 22px 'JetBrains Mono',monospace;margin-top:10px">${String(i + 1).padStart(2, "0")}</figcaption></figure>`).join("")}
</div></body>`;
  const tmp = path.join(dir, `.${name}.html`);
  fs.writeFileSync(tmp, html);
  const sp = await browser.newPage({ viewport: { width: cols * w + 2 * pad + (cols - 1) * gap, height: 400 }, deviceScaleFactor: 1 });
  await sp.goto(pathToFileURL(tmp).href);
  await sp.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await sp.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
  await sp.close(); fs.rmSync(tmp);
}
await sheet("contact-sheet", 360, 3, `agentoon.ai · ${imgs.length} slides · 1080×1350`);
await sheet("mobile-preview", 390, 3, "true phone scale: 390 px wide per slide (1×)", 24, 24);
await sheet("safe-area-check", 360, 3, `red = outside the safe area (${TH.safeTop}px top/bottom, ${TH.safeX}px sides): nothing important may sit there`, 40, 28, true);
await browser.close();

/* ------------------------------------------------------------------ spelling + report */
const sp = spawnSync("python3", [path.join(here, "spellcheck.py"), path.join(dir, ".texts.json"), (cfg.spellAllow || []).join(",")], { encoding: "utf8" });
fs.rmSync(path.join(dir, ".texts.json"));
const spellBad = sp.status === 1;
const errs = issues.filter((i) => i.level === "error");
const pt = (px) => (px * 390 / 1080).toFixed(1);
console.log(`rendered ${imgs.length} slides → ${path.relative(process.cwd(), png)}/ + contact-sheet.png + mobile-preview.png`);
console.log(missing.length ? `✗ fonts missing: ${missing.join(", ")}` : "✓ brand fonts loaded (Fraunces, Inter, JetBrains Mono)");
for (const i of errs) console.log(`✗ slide ${i.n}: ${i.msg}`);
for (const i of issues.filter((x) => x.level === "warn")) console.log(`! slide ${i.n}: ${i.msg}`);
process.stdout.write(sp.stdout || "");
for (const d of dimErrors) console.log(`✗ ${d}`);
if (!dimErrors.length) console.log(`✓ all ${imgs.length} PNGs are exactly 1080×1350`);
if (!errs.length && !missing.length) console.log(`✓ QA passed: safe area (${TH.safeX}px sides, ${TH.safeTop}px top/bottom), margins, overflow, overlap, alignment, footer gap, mascot clearance, contrast ≥ ${TH.contrast}:1, min sizes (label ${TH.label} / body ${TH.body} / code ${TH.code} / diagram ${TH.svg}px)`);

const report = [`# QA report — ${cfg.title}`, "", `Safe area: ${TH.safeX}px left/right, ${TH.safeTop}px top, ${TH.safeBottom}px bottom. Thresholds (px @1080): label ≥ ${TH.label}, body ≥ ${TH.body}, code ≥ ${TH.code}, diagram text ≥ ${TH.svg}; contrast ≥ ${TH.contrast}:1 (${TH.contrastLarge}:1 for text ≥ ${TH.largePx}px); safe margin ${TH.margin}px; content padding ${TH.pad}px; footer gap ${TH.footerGap}px.`, "At 390 pt phone width: label 26px = " + pt(26) + "pt, body 30px = " + pt(30) + "pt, code 32px = " + pt(32) + "pt.", "",
  "| Slide | Smallest text | On phone | Lowest contrast | Errors |", "|---|---|---|---|---|",
  ...stats.map((s) => `| ${String(s.n).padStart(2, "0")} | ${s.minFont}px | ${pt(s.minFont)}pt | ${s.minContrast.toFixed(2)}:1 | ${errs.filter((e) => e.n === s.n).length} |`), "",
  missing.length || errs.length || spellBad ? "**Status: FAILED**" : "**Status: PASSED** (automated). Visual review of every PNG is still required.", ""];
fs.writeFileSync(path.join(dir, "qa-report.md"), report.join("\n"));

if (doZip) {
  const capFile = path.join(dir, "caption.md");
  const cap = fs.existsSync(capFile) ? fs.readFileSync(capFile, "utf8") : "";
  const capProblems = [];
  if (!cap) capProblems.push("caption.md is missing (write the Instagram caption first)");
  else {
    if ((cap.match(/#[A-Za-z0-9_]+/g) || []).length < 10) capProblems.push("caption.md needs ≥ 10 hashtags");
    if (!/@agentoon\.ai/.test(cap)) capProblems.push("caption.md must mention @agentoon.ai");
    if (/\bTODO\b/.test(cap)) capProblems.push("caption.md still has TODO");
  }
  if (capProblems.length) { for (const p of capProblems) console.log("✗ " + p); process.exit(1); }
  const slug = cfg.slug || path.basename(dir);
  const zip = path.join(dir, `${slug}.zip`);
  fs.rmSync(zip, { force: true });
  const inc = ["png", "source", "carousel.json", "extras.mjs", "contact-sheet.png", "mobile-preview.png", "safe-area-check.png", "qa-report.md", "caption.md"].filter((p) => fs.existsSync(path.join(dir, p)));
  execFileSync("zip", ["-qr", zip, ...inc], { cwd: dir });
  console.log("✓ zip →", path.relative(process.cwd(), zip));
}
process.exit(errs.length || missing.length || spellBad || dimErrors.length ? 1 : 0);
