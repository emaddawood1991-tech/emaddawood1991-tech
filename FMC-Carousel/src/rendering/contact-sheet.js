#!/usr/bin/env node
// Contact sheet: all slides side by side -> output/preview/contact-sheet.{html,png}
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const slug = process.argv[2];
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content', `${slug}.json`), 'utf8'));
const dir = path.join(ROOT, 'output/png', slug);
const n = fs.readdirSync(dir).filter((f) => /^slide-\d+\.png$/.test(f)).length;
const prev = path.join(ROOT, 'output/preview', slug); fs.mkdirSync(prev, { recursive: true });
const imgs = Array.from({ length: n }, (_, i) => `<figure><img src="../../png/${slug}/slide-${fs.existsSync(path.join(dir, `slide-${String(i + 1).padStart(2, '0')}.png`)) ? String(i + 1).padStart(2, '0') : i + 1}.png"><figcaption>${i + 1}</figcaption></figure>`).join('');
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="../../../src/styles/base.css">
<style>body{width:auto;height:auto;overflow:visible;background:#EEF4FB;padding:48px 56px 56px}
h1{font-size:44px;font-weight:800;margin-bottom:6px}p{font-size:26px;color:#3C4F78;margin-bottom:32px}
.row{display:flex;gap:28px;direction:rtl}figure{width:384px;position:relative}img{width:384px;height:480px;display:block;border-radius:14px;box-shadow:0 14px 30px -14px rgba(11,36,85,.5);background:#fff}
figcaption{position:absolute;top:-14px;right:-10px;width:40px;height:40px;border-radius:50%;background:#2E5AB4;color:#fff;font-weight:800;font-size:24px;display:grid;place-items:center}</style></head>
<body><h1>${content.title}</h1><p>مركز الفيصل الطبي · Ideal Care – الرعاية المثالية · ${n} شرائح · <bdi dir="ltr">1080×1350</bdi></p><div class="row">${imgs}</div></body></html>`;
fs.writeFileSync(path.join(prev, 'contact-sheet.html'), html);
const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const b = await chromium.launch(exe ? { executablePath: exe } : {});
const pg = await b.newPage({ viewport: { width: 56 * 2 + n * 384 + (n - 1) * 28, height: 760 } });
await pg.goto(pathToFileURL(path.join(prev, 'contact-sheet.html')).href);
await pg.evaluate(async () => { await document.fonts.load('800 40px Cairo', 'ع'); await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode())); });
await pg.screenshot({ path: path.join(prev, 'contact-sheet.png'), fullPage: true });
await b.close();
console.log(`contact sheet: output/preview/${slug}/contact-sheet.png`);
