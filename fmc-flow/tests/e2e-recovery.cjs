// Browser test of account recovery requests and break-glass emergency access (stage S7). Fresh synthetic DB:
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-recovery.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
const TEMP = 'Temp-Recovery-Pass-91';
(async () => {
  const b = await chromium.launch(); const errors = [];
  const newPage = async () => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/40[01234]|Forbidden|Unauthorized|Bad Request|Not Found/.test(m.text())) errors.push(m.text()); }); await p.goto(base); return p; };
  const signIn = async (p, u, pw) => { await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', pw); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); };
  // 1. forgot password from the sign-in page
  const lp = await newPage(); await lp.click('[data-testid=forgot-link]'); await lp.waitForSelector('[data-testid=forgot-box] input');
  await lp.fill('[data-testid=forgot-box] input', 'pt.two'); await lp.click('[data-testid=forgot-box] button:has-text("Ask for help")');
  await lp.waitForSelector('[data-testid=forgot-box] .banner'); ok(/administrator has been notified/.test(await lp.locator('[data-testid=forgot-box]').textContent()), 'the sign-in page lets a person ask for help, with a neutral answer');
  await lp.screenshot({ path: `${out}/s7-forgot.png` });
  // 2. administrator resolves it
  const adm = await newPage(); await signIn(adm, 'admin', PW);
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Security & Access")'); await adm.click('.tabs button:has-text("Recovery & Emergency")');
  await adm.waitForSelector('[data-testid=recovery-table] tr:has-text("pt.two")'); ok(true, 'the administrator sees the request');
  await adm.click('[data-testid=recovery-table] tr:has-text("pt.two") button:has-text("Reset password")'); await adm.fill('#rc-temp', 'short'); await adm.click('.modal button:has-text("Reset password")');
  await adm.waitForSelector('.modal .field-err'); ok(true, 'a weak temporary password is refused');
  await adm.fill('#rc-temp', TEMP); await adm.click('.modal button:has-text("Reset password")'); await adm.waitForSelector('.modal', { state: 'detached' });
  await adm.waitForSelector('[data-testid=recovery-table] tr:has-text("pt.two"):has-text("DONE")'); ok(true, 'the request is marked done');
  const t2 = await newPage(); await t2.fill('input[autocomplete=username]', 'pt.two'); await t2.fill('input[type=password]', TEMP); await t2.click('button.btn:has-text("Sign in")');
  await t2.waitForSelector('#pw-new'); ok(true, 'the person must choose their own password after the temporary one');
  // 3. emergency access
  await adm.click('[data-testid=bg-enabled]'); await adm.waitForSelector('[data-testid=bg-enabled]:checked'); ok(true, 'the administrator switches emergency access on');
  const rec = await newPage(); await signIn(rec, 'reception', PW);
  const mrn = await rec.evaluate(async () => { const H = { 'content-type': 'application/json', 'x-requested-with': 'fmc' };
    const cfg = await (await fetch('/api/config')).json(); const dep = cfg.departments.find((d) => d.name === 'Physiotherapy').id;
    const p = await (await fetch('/api/patients', { method: 'POST', headers: H, body: JSON.stringify({ name: 'Emergency Browser Patient' }) })).json();
    await fetch('/api/registrations', { method: 'POST', headers: H, body: JSON.stringify({ patient_id: p.id, department_id: dep }) }); return p.mrn; });
  const ort = await newPage(); await signIn(ort, 'dr.ort', PW);
  const direct = await ort.evaluate(async (m) => (await fetch(`/api/patients?q=${m}`)).json(), mrn); ok(direct.length === 0, 'before emergency access the orthopedic doctor cannot find the physiotherapy patient');
  await ort.click('.nav a:has-text("My Account")'); await ort.waitForSelector('[data-testid=emergency-card]');
  ok(await ort.locator('#bg-reason').count() === 1, 'the emergency card appears once the administrator has enabled it');
  await ort.fill('#bg-mrn', mrn); await ort.fill('#bg-reason', 'short'); ok(await ort.locator('button:has-text("Open emergency access")').isDisabled(), 'a short reason cannot be submitted');
  await ort.fill('#bg-reason', 'Patient collapsed in the corridor, need history'); await ort.click('button:has-text("Open emergency access")');
  await ort.waitForSelector('[data-testid=emergency-view]'); ok(/Read-only/.test(await ort.locator('[data-testid=emergency-view]').textContent()), 'emergency access opens a read-only view');
  await ort.click('[data-testid=emergency-view] button:has-text("Timeline")'); await ort.waitForSelector('[data-testid=emergency-detail] tr'); ok(true, 'the visit timeline can be read during the emergency');
  await ort.screenshot({ path: `${out}/s7-emergency.png` });
  // 4. administrator reviews
  await adm.reload(); await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Security & Access")'); await adm.click('.tabs button:has-text("Recovery & Emergency")');
  await adm.waitForSelector('[data-testid=bg-table] tr:has-text("dr.ort")'); ok(/Awaiting review/.test(await adm.locator('[data-testid=bg-table] tr:has-text("dr.ort")').textContent()), 'the administrator sees the emergency use awaiting review');
  await adm.click('[data-testid=bg-table] button:has-text("Review")'); await adm.fill('#bg-note', 'Confirmed with the duty manager'); await adm.click('.modal button:has-text("Save")'); await adm.waitForSelector('.modal', { state: 'detached' });
  await adm.waitForSelector('[data-testid=bg-table] tr:has-text("Confirmed with the duty manager")'); ok(true, 'the review is recorded');
  await adm.screenshot({ path: `${out}/s7-recovery.png`, fullPage: true });
  await adm.click('.tabs button:has-text("Alerts")'); await adm.waitForSelector('tr:has-text("Emergency access used")'); ok(true, 'a critical alert was raised for the emergency access');
  ok(errors.length === 0, `no browser console errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})();
