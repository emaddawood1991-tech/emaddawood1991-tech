// Usability sweep (stage S14): every screen, as five roles, in English and Arabic (right-to-left).
// Hard checks fail the run: script errors, a field that loses focus or drops letters while typing, text overflowing its box, page-wide sideways scrolling,
// an unlabeled button or field, a leaked translation key, and a broken right-to-left layout. Notes (not failures) list English text still showing in Arabic.
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-sweep.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright'); const fs = require('fs');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ROLES = ['admin', 'super', 'reception', 'pt.one', 'dr.ort']; const LANGS = ['en', 'ar'];
const hard = []; const notes = []; let pagesChecked = 0; let fieldsTyped = 0;
const fail = (where, what) => { hard.push(`${where}: ${what}`); };

async function inspect(page) {
  return page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const name = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim() || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent?.trim()) || (el.closest('label')?.textContent || '').trim() || el.getAttribute('placeholder') || el.getAttribute('alt') || '';
    const unlabeled = [...document.querySelectorAll('button, a[role=link], input:not([type=hidden]), select, textarea')].filter(vis).filter((el) => !name(el) && !el.querySelector('img[alt]:not([alt=""])')).map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`);
    const clipped = [...document.querySelectorAll('button, .chip, th, td, label, h1, h2, .nav a')].filter(vis).filter((el) => { const s = getComputedStyle(el); return el.scrollWidth > el.clientWidth + 2 && s.overflow !== 'visible' && s.overflowX !== 'auto' && s.overflowX !== 'scroll'; }).map((el) => (el.textContent || '').trim().slice(0, 40));
    const text = document.body.innerText;
    const keyLeaks = [...new Set(text.match(/\b(?:sa|ds|dup|rep|ev|saAl|saKind|saEv)[A-Z][A-Za-z0-9]{2,}\b/g) || [])];
    const sideRect = document.querySelector('.side')?.getBoundingClientRect();
    const headings = [...document.querySelectorAll('h1, h2')].filter(vis).map((h) => h.textContent.trim()).filter(Boolean);
    const latinOnly = (t) => /^[A-Z][A-Za-z &/'’.,()+-]*$/.test(t) && /[A-Za-z]{3,}/.test(t) && t !== 'English'; // the language switch is deliberately in the other language; lowercase tokens are data (usernames, record types)
    const UI = 'h1, h2, h3, legend, th, button, label, .chip, .nav a, summary, option, .kpi span, .small.muted, dt';
    const englishUi = [...new Set([...document.querySelectorAll(UI)].filter(vis).filter((el) => !el.closest('code, pre, .mono') && el.children.length === 0 || el.matches('th, button, label')).map((el) => (el.matches('select') ? '' : (el.textContent || '').trim().replace(/\s+/g, ' '))).filter((t) => t.length <= 60 && latinOnly(t)))];
    const englishHints = [...document.querySelectorAll('input[placeholder], textarea[placeholder]')].filter(vis).map((el) => el.getAttribute('placeholder').trim()).filter(latinOnly);
    return { overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, unlabeled, clipped, keyLeaks, dir: document.documentElement.dir, lang: document.documentElement.lang,
      sideLeft: sideRect ? sideRect.left : null, vw: document.documentElement.clientWidth, headings, englishUi, englishHints };
  });
}
/** Types into every visible text-like field the way a person does and checks that the same field keeps focus and holds every letter. */
async function typingCheck(page, where) {
  const fields = await page.locator('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=date]):not([type=time]):not([type=color]):not([type=range]), textarea').all();
  for (const f of fields) {
    if (!(await f.isVisible()) || !(await f.isEnabled()) || (await f.getAttribute('readonly')) != null) continue;
    const type = (await f.getAttribute('type')) || 'text'; const sample = type === 'number' ? '12' : 'ab';
    const before = await f.inputValue().catch(() => null); if (before == null) continue;
    const id = (await f.getAttribute('id')) || (await f.getAttribute('placeholder')) || (await f.getAttribute('aria-label')) || type;
    try {
      await f.click({ timeout: 2000 }); await f.press('Control+A'); await page.keyboard.press('Backspace');
      for (const ch of sample) await page.keyboard.type(ch, { delay: 12 });
      const val = await f.inputValue(); const focused = await f.evaluate((el) => document.activeElement === el);
      fieldsTyped++;
      if (val !== sample || !focused) fail(where, `field "${id}" lost ${focused ? 'letters' : 'focus'} while typing (got "${val}")`);
      await f.press('Control+A'); await page.keyboard.press('Backspace'); if (before) { await f.fill(before); }
    } catch (e) { /* a field covered by an overlay or removed while typing is not a typing fault */ }
  }
}

(async () => {
  const b = await chromium.launch();
  for (const role of ROLES) for (const lang of LANGS) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/40[01234]|409|Forbidden|Unauthorized|Bad Request|Not Found|Conflict|Too Many/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript((l) => { try { localStorage.setItem('fmc_lang', l); } catch { /* ignore */ } }, lang);
    await page.goto(base); await page.fill('input[autocomplete=username]', role); await page.fill('input[type=password]', PW); await page.click('button.btn:not(.ghost)'); await page.waitForSelector('.shell');
    const labels = await page.locator('.nav a').allTextContents();
    for (let i = 0; i < labels.length; i++) {
      const where = `${role}/${lang}/${labels[i].trim()}`;
      await page.locator('.nav a').nth(i).click(); await page.waitForTimeout(700);
      // open the first tab of tabbed pages one by one too (Settings has many)
      const tabs = await page.locator('.tabs button').all(); const views = tabs.length ? tabs.length : 1;
      for (let k = 0; k < views; k++) {
        const w = tabs.length ? `${where}/tab${k + 1}` : where;
        if (tabs.length) { await page.locator('.tabs button').nth(k).click(); await page.waitForTimeout(500); const sub = await page.locator('.tabs.sub button, .subtabs button').all(); void sub; }
        const r = await inspect(page); pagesChecked++;
        if (r.overflowX) fail(w, 'the page scrolls sideways');
        if (r.unlabeled.length) fail(w, `unlabeled control(s): ${[...new Set(r.unlabeled)].slice(0, 5).join(', ')}`);
        if (r.clipped.length) fail(w, `text cut off: ${[...new Set(r.clipped)].slice(0, 4).join(' | ')}`);
        if (r.keyLeaks.length) fail(w, `translation key visible: ${r.keyLeaks.join(', ')}`);
        if (lang === 'ar') {
          if (r.dir !== 'rtl' || r.lang !== 'ar') fail(w, `not right-to-left (dir=${r.dir}, lang=${r.lang})`);
          if (r.sideLeft != null && r.sideLeft < r.vw / 2) fail(w, 'the menu is on the left in Arabic');
          for (const t of [...r.englishUi, ...r.englishHints]) fail(w, `English text in Arabic: "${t}"`);
          const latin = r.headings.filter((h) => /^[A-Za-z0-9 &·,.()/'-]+$/.test(h) && !/^(EMR|FMC)/.test(h)); if (latin.length) notes.push(`${w}: English heading(s) in Arabic: ${latin.slice(0, 3).join(' | ')}`);
        }
        await typingCheck(page, w);
      }
    }
    if (errors.length) fail(`${role}/${lang}`, `script error: ${errors[0].slice(0, 160)}`);
    if (role === 'admin' && lang === 'ar') await page.screenshot({ path: `${out}/sweep-admin-ar.png` });
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(`${out}/sweep-report.json`, JSON.stringify({ pagesChecked, fieldsTyped, hard, notes }, null, 2));
  const uniq = (a) => [...new Set(a)];
  console.log(`checked ${pagesChecked} screens, typed into ${fieldsTyped} fields`);
  for (const h of uniq(hard)) console.log('FAIL:', h);
  for (const n of uniq(notes).slice(0, 40)) console.log('note:', n);
  console.log(hard.length ? `${uniq(hard).length} problem(s)` : 'ok  - every screen passes the usability sweep (roles x English/Arabic)');
  if (hard.length) process.exitCode = 1;
})();
