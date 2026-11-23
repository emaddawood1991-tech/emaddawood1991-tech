// Builds the printable pilot pack (one A4 page per role guide, per language, plus a feedback sheet) from pilot/content.json.
//   node scripts/build-pilot-pack.mjs [outDir]      (default: ../docs/pilot)
// HTML only; tests/e2e-pilot-pack.cjs prints each page to PDF and checks that every guide really fits on one page.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CSS = `
@page { size: A4; margin: 11mm 12mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 9.7pt/1.34 'Noto Naskh Arabic','Segoe UI',Tahoma,Arial,sans-serif; color: #17284b; }
.brand { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #2e55b2; padding-bottom: 4px; margin-bottom: 7px; font-weight: 700; color: #2e55b2; font-size: 10pt; }
.brand small { font-weight: 400; color: #5a6b8c; }
h1 { margin: 2px 0 2px; font-size: 17pt; color: #12235a; }
.who { margin: 0 0 6px; color: #3d4f78; }
.box { border: 1px solid #c8d3ea; border-radius: 6px; padding: 5px 8px; margin: 5px 0; background: #f6f8fd; }
.box b { color: #12235a; }
.sign { display: flex; gap: 14px; margin-top: 4px; font-size: 9pt; }
.sign span { flex: 1; border-bottom: 1px dotted #7d8db3; min-height: 14px; }
h2 { margin: 7px 0 2px; font-size: 11pt; color: #2e55b2; }
ol { margin: 2px 0 0; padding-inline-start: 18px; } li { margin: 1.6px 0; }
.cols { display: flex; gap: 8px; } .cols > div { flex: 1; }
.do { border-color: #bfe3cc; background: #f3faf6; } .dont { border-color: #f0c9c9; background: #fdf5f5; } .wrong { border-color: #f1dfb0; background: #fffaf0; }
ul { margin: 2px 0 0; padding-inline-start: 16px; } ul li { margin: 1px 0; }
.foot { margin-top: 7px; font-size: 8.2pt; color: #5a6b8c; border-top: 1px solid #d8e0f0; padding-top: 3px; display: flex; justify-content: space-between; }
table { width: 100%; border-collapse: collapse; margin-top: 4px; } th, td { border: 1px solid #c8d3ea; padding: 3px 6px; font-size: 9pt; text-align: start; } th { background: #eef2fb; }
td.c { text-align: center; width: 15%; } .lines { border: 1px solid #c8d3ea; border-radius: 6px; min-height: 52px; margin: 2px 0 6px; }
.chk { display: inline-block; width: 11px; height: 11px; border: 1px solid #556; margin: 0 3px; vertical-align: -1px; }
`;
const page = (lang, title, body) => `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;
const head = (c, lang) => `<div class="brand"><span>${esc(c.brand[lang])}</span><small>FMC Patient Flow · ${lang === 'ar' ? 'تجربة' : 'Pilot'}</small></div>`;
const foot = (c, lang) => `<div class="foot"><span>${esc(c.footer[lang])}</span><span>${esc(c.labels[lang].ask)}</span></div>`;

export function guide(c, role, lang) {
  const g = c.roles[role][lang]; const L = c.labels[lang];
  return page(lang, g.title, `${head(c, lang)}<h1>${esc(g.title)}</h1><p class="who">${esc(g.who)}</p>
<div class="box"><b>${esc(L.signin)}.</b> ${esc(g.signin)}<div class="sign"><span>${esc(L.user)}: <b>${esc(c.roles[role].user)}</b></span><span>${esc(L.pw)}:</span></div></div>
<h2>${esc(L.day)}</h2><ol>${g.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<div class="cols"><div class="box do"><b>${esc(L.do)}</b><ul>${g.do.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div><div class="box dont"><b>${esc(L.dont)}</b><ul>${g.dont.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div></div>
<div class="box wrong"><b>${esc(L.wrong)}</b><ul>${g.wrong.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>${foot(c, lang)}`);
}

export function feedback(c, lang) {
  const f = c.feedback[lang];
  return page(lang, f.title, `${head(c, lang)}<h1>${esc(f.title)}</h1><p class="who">${esc(f.sub)}</p>
<div class="sign"><span>${esc(f.name)}:</span><span>${esc(f.role)}:</span><span>${esc(f.date)}:</span></div>
<h2>${esc(f.rate)}</h2><table><thead><tr><th></th><th>${esc(f.easy)}</th><th>${esc(f.ok)}</th><th>${esc(f.hard)}</th><th>${esc(f.na)}</th></tr></thead>
<tbody>${f.tasks.map((t) => `<tr><td>${esc(t)}</td>${'<td class="c"><span class="chk"></span></td>'.repeat(4)}</tr>`).join('')}</tbody></table>
<h2>${esc(f.free1)}</h2><div class="lines"></div><h2>${esc(f.free2)}</h2><div class="lines"></div><p class="who">${esc(f.sev)}</p><h2>${esc(f.free3)}</h2><div class="lines" style="min-height:34px"></div>
<p><b>${esc(f.daily)}</b> &nbsp; <span class="chk"></span> ${esc(f.yes)} &nbsp; <span class="chk"></span> ${esc(f.maybe)} &nbsp; <span class="chk"></span> ${esc(f.no)}</p>${foot(c, lang)}`);
}

export function build(outDir = join(here, '..', '..', 'docs', 'pilot')) {
  const c = JSON.parse(readFileSync(join(here, '..', 'pilot', 'content.json'), 'utf8'));
  const dir = join(outDir, 'guides'); mkdirSync(dir, { recursive: true });
  const files = [];
  for (const role of Object.keys(c.roles)) for (const lang of ['en', 'ar']) { const f = join(dir, `${role}-${lang}.html`); writeFileSync(f, guide(c, role, lang)); files.push(f); }
  for (const lang of ['en', 'ar']) { const f = join(dir, `feedback-${lang}.html`); writeFileSync(f, feedback(c, lang)); files.push(f); }
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = build(process.argv[2]); console.log(`Wrote ${files.length} printable pages:\n${files.join('\n')}`);
}
