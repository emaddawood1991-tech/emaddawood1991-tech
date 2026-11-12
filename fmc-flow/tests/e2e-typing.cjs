// Typing test: real people type one character at a time. A field that loses focus after each letter, or drops letters, fails here.
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-typing.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
const NEW = 'Str0ng-Typing-Phrase-91';
(async () => {
  const b = await chromium.launch(); const errors = [];
  const newPage = async () => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); await p.goto(base); return p; };
  const signIn = async (p, u, pw) => { await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', pw); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); };
  // type like a person: click once, then key by key; the same element must keep focus and hold every character
  const typeLikeAPerson = async (p, sel, text) => {
    await p.click(sel); await p.locator(sel).press('Control+A'); await p.keyboard.press('Backspace');
    for (const ch of text) await p.keyboard.type(ch, { delay: 15 });
    const val = await p.locator(sel).inputValue(); const focused = await p.evaluate((s) => document.activeElement === document.querySelector(s), sel);
    return val === text && focused;
  };
  const pt = await newPage(); await signIn(pt, 'pt.one', PW);
  await pt.click('.nav a:has-text("My Account")'); await pt.waitForSelector('#pw-current');
  ok(await typeLikeAPerson(pt, '#pw-current', PW), 'the current-password box keeps focus and every letter while typing');
  ok(await typeLikeAPerson(pt, '#pw-new', NEW), 'the new-password box keeps focus and every letter while typing');
  ok(await typeLikeAPerson(pt, '#pw-confirm', NEW), 'the confirm-password box keeps focus and every letter while typing');
  await pt.screenshot({ path: `${out}/t1-password.png` });
  await pt.click('.card:has(#pw-current) button.btn:not(.ghost):has-text("password")'); await pt.waitForSelector('.toast');
  ok(/changed|saved|updated/i.test(await pt.locator('.toast').first().textContent()), 'typing a new password by hand and saving it works end to end');
  const again = await newPage(); await again.fill('input[autocomplete=username]', 'pt.one'); await again.fill('input[type=password]', NEW); await again.click('button.btn:has-text("Sign in")');
  await again.waitForSelector('.shell'); ok(true, 'the new password signs in');
  // other forms that had the same fault
  const adm = await newPage(); await signIn(adm, 'admin', PW);
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Security & Access")'); await adm.click('.tabs button:has-text("Security Settings")'); await adm.waitForSelector('#ss-password_min_length');
  ok(await typeLikeAPerson(adm, '#ss-password_min_length', '12'), 'Security Settings number boxes keep focus while typing');
  ok(await typeLikeAPerson(adm, '#ss-rate_search_per_min', '75'), 'a second Security Settings box also keeps focus');
  ok(await typeLikeAPerson(adm, '#ss-session_idle_minutes', '45'), 'the idle sign-out (minutes) box keeps focus while typing');
  await adm.click('.card button:has-text("Save")'); await adm.waitForSelector('.toast:has-text("Saved")'); ok(true, 'the idle minutes setting saves');
  await adm.click('.nav a:has-text("Daily Schedule")'); await adm.waitForSelector('.sch-toolbar'); await adm.click('button:has-text("Add appointment")'); await adm.waitForSelector('#ds-notes');
  ok(await typeLikeAPerson(adm, '#ds-notes', 'Bring previous X-ray'), 'the appointment notes box keeps focus while typing');
  await adm.screenshot({ path: `${out}/t2-booking.png` });
  ok(errors.length === 0, `no browser errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})();
