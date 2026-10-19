#!/usr/bin/env node
// FMC renderer: content JSON -> HTML source -> verified PNG (Playwright).
// Usage: node src/rendering/render.js <content.json> [--style=premium] [--scale=1] [--only=1,3] [--out=output/png]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const W = 1080, H = 1350, FOOTER_TOP = 1220;
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
if (!file) { console.error('Usage: node src/rendering/render.js <content.json> [--style=..] [--scale=1] [--only=1,2] [--out=dir]'); process.exit(1); }

const content = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
if (opt.style) content.style = opt.style;
content.style ||= 'premium';
const scale = Number(opt.scale || 1);
const only = opt.only ? String(opt.only).split(',').map(Number) : null;
const tplDir = path.join(ROOT, 'templates', content.template);
const tpl = await import(pathToFileURL(path.join(tplDir, 'index.js')).href);
const slides = tpl.build(content);

const variant = opt.style ? `-${opt.style}` : '';
const srcDir = path.join(ROOT, 'output/source', content.slug + variant);
const pngDir = path.resolve(opt.out || path.join(ROOT, 'output/png', content.slug + variant));
fs.mkdirSync(srcDir, { recursive: true }); fs.mkdirSync(pngDir, { recursive: true });

// Editable source: one HTML file per slide, with relative links to shared CSS/assets.
const rel = (p) => path.relative(srcDir, p).split(path.sep).join('/');
const doc = (body) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=1080">
<title>${content.title || content.slug}</title>
<link rel="stylesheet" href="${rel(path.join(ROOT, 'src/styles/base.css'))}">
${tpl.css ? `<link rel="stylesheet" href="${rel(path.join(tplDir, tpl.css))}">` : ''}
</head><body>${body}</body></html>`;
const files = slides.map((s, i) => { const f = path.join(srcDir, `slide-${String(i + 1).padStart(2, '0')}.html`); fs.writeFileSync(f, doc(s)); return f; });

const exe = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find((p) => p && fs.existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: scale });
const report = []; const proof = [];
let failed = false;

for (let i = 0; i < files.length; i++) {
  if (only && !only.includes(i + 1)) continue;
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(files[i]).href, { waitUntil: 'load' });
  // Wait for fonts + images — never export an incomplete render.
  const state = await page.evaluate(async ({ FOOTER_TOP }) => {
    await Promise.all(['500', '700', '800'].map((w) => document.fonts.load(`${w} 40px Cairo`, 'عربي Ab')));
    await document.fonts.ready;
    const imgs = [...document.images]; await Promise.all(imgs.map((im) => im.decode().catch(() => {})));
    const problems = [];
    if (!document.fonts.check('800 40px Cairo', 'ع')) problems.push('Cairo Arabic font not loaded');
    imgs.forEach((im) => { if (!im.naturalWidth) problems.push('missing image: ' + im.getAttribute('src')); });
    const content = document.querySelector('.content');
    if (content && content.scrollHeight > content.clientHeight + 1) problems.push(`content overflows by ${content.scrollHeight - content.clientHeight}px`);
    document.querySelectorAll('.slide *').forEach((el) => {
      if (el.closest('svg') || el.closest('.bg') || el.classList.contains('frame')) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (el.closest('.content') && r.bottom > FOOTER_TOP + 1) problems.push(`below safe area: <${el.tagName.toLowerCase()} class="${el.className}"> bottom=${Math.round(r.bottom)}`);
      if (r.left < 60 || r.right > 1020) { if (!el.closest('.footer') && !el.closest('.illus') && !el.closest('.hook-art')) problems.push(`outside side margins: <${el.tagName.toLowerCase()} class="${el.className}"> ${Math.round(r.left)}-${Math.round(r.right)}`); }
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible' && el.children.length === 0) problems.push(`clipped text: "${el.textContent.slice(0, 30)}"`);
    });
    // Phone readability: at 1080px canvas shown ~390px wide, text <24px is ~8px on screen.
    document.querySelectorAll('.slide *').forEach((el) => {
      if (el.closest('svg') || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 24) problems.push(`small text (${fs}px): "${el.textContent.trim().slice(0, 20)}"`);
    });
    // Logos / illustrations must be fully inside the canvas and above the footer.
    document.querySelectorAll('.slide img, .slide .illus svg, .slide .hook-art svg').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.left < 0 || r.right > 1080 || r.top < 0 || (!el.closest('.footer') && r.bottom > FOOTER_TOP + 1)) problems.push(`visual clipped/out of bounds: <${el.tagName.toLowerCase()}> ${Math.round(r.left)},${Math.round(r.top)}-${Math.round(r.right)},${Math.round(r.bottom)}`);
    });
    // Text-on-text overlap detector (catches content colliding with other content).
    const tx = [...document.querySelectorAll('.slide *')].filter((e) => !e.closest('svg') && getComputedStyle(e).display !== 'inline' && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
    for (let a = 0; a < tx.length; a++) for (let b = a + 1; b < tx.length; b++) {
      if (tx[a].contains(tx[b]) || tx[b].contains(tx[a])) continue;
      const A = tx[a].getBoundingClientRect(), B = tx[b].getBoundingClientRect();
      const ox = Math.min(A.right, B.right) - Math.max(A.left, B.left), oy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (ox > 4 && oy > 4) problems.push(`overlap: "${tx[a].textContent.trim().slice(0, 18)}" x "${tx[b].textContent.trim().slice(0, 18)}"`);
    }
    const lines = [...document.querySelectorAll('.slide h1,.slide h2,.slide h3,.slide p,.slide .label,.slide .chip,.slide .check,.slide .note,.slide .tag,.slide .slogan,.slide .more,.slide .num,.slide .disclaimer,.slide .cell,.slide .rowlabel,.slide .col-title')].map((e) => e.innerText.replace(/\s+/g, ' ').trim());
    return { problems, lines };
  }, { FOOTER_TOP });
  const out = path.join(pngDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H }, animations: 'disabled' });
  const buf = fs.readFileSync(out); const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const ok = w === W * scale && h === H * scale;
  if (!ok) state.problems.push(`wrong dimensions ${w}x${h}`);
  if (state.problems.length) failed = true;
  report.push({ slide: i + 1, png: path.relative(ROOT, out), size: `${w}x${h}`, problems: state.problems });
  proof.push(`--- slide ${i + 1} ---\n${state.lines.join('\n')}`);
  await page.close();
}
fs.writeFileSync(path.join(srcDir, only ? 'text-proof.partial.txt' : 'text-proof.txt'), proof.join('\n\n') + '\n');
await browser.close();
for (const r of report) console.log(`slide ${r.slide}: ${r.size} ${r.png}${r.problems.length ? '\n   ! ' + r.problems.join('\n   ! ') : '  OK'}`);
console.log(`source: ${path.relative(ROOT, srcDir)}  proof text: text-proof.txt`);
process.exit(failed ? 2 : 0);
