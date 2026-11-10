// Browser test of privacy and monitoring (stage S4). Fresh synthetic DB:
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-privacy.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright'); const fs = require('fs');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const newPage = async () => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load|status of 4\d\d/.test(m.text()) && errors.push(m.text())); await p.goto(base); return p; };
  const signIn = async (p, u, pw) => { await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', pw); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); };
  const rec = await newPage(); await signIn(rec, 'reception', PW);
  // reception looks patients up and opens the schedule
  await rec.click('.nav a:has-text("Visits")'); await rec.fill('input[placeholder^="Search by"]', 'Sample Patient A'); await rec.waitForSelector('.patient-row:has-text("Sample Patient A")');
  await rec.click('.nav a:has-text("Daily Schedule")'); await rec.waitForSelector('table.sch');
  const adm = await newPage(); await signIn(adm, 'admin', PW);
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Security & Access")'); await adm.click('.tabs button:has-text("Patient access")');
  await adm.fill('#sa-access-q', 'Sample Patient A'); await adm.click('.patient-row:has-text("Sample Patient A")');
  await adm.waitForSelector('tbody tr:has-text("Reception (Demo)")'); ok(/Search/.test(await adm.locator('tbody tr:has-text("Reception (Demo)")').first().textContent()), 'Patient access shows who looked a patient up, by name');
  await adm.screenshot({ path: `${out}/pr1-access.png` });
  await adm.selectOption('select[aria-label="Viewed in"]', { label: 'Daily Schedule / lists' }); await adm.waitForTimeout(900);
  ok(await adm.locator('tbody tr').count() === 0 || /Daily Schedule/.test(await adm.locator('tbody').textContent()), 'the list can be filtered by screen');
  // failed sign-ins raise an alert
  const bad = await newPage(); for (let i = 0; i < 5; i++) { await bad.fill('input[autocomplete=username]', 'pt.two'); await bad.fill('input[type=password]', `wrong-password-${i}x`); await bad.click('button.btn:has-text("Sign in")'); await bad.waitForSelector('.err'); await bad.waitForTimeout(150); }
  await adm.click('.tabs button:has-text("Alerts")'); await adm.waitForSelector('tr:has-text("Repeated failed sign-ins")', { timeout: 20000 });
  ok(/pt\.two/.test(await adm.locator('tr:has-text("Repeated failed sign-ins")').textContent()), 'repeated failed sign-ins raise an alert naming the account');
  await adm.screenshot({ path: `${out}/pr2-alerts.png` });
  await adm.locator('tr:has-text("Repeated failed sign-ins") button:has-text("Acknowledge")').click(); await adm.waitForSelector('tr:has-text("Repeated failed sign-ins")', { state: 'detached' }); ok(true, 'an alert can be acknowledged and leaves the open list');
  await adm.click('button:has-text("Show all")'); await adm.waitForSelector('tr:has-text("Repeated failed sign-ins")'); ok(true, 'acknowledged alerts stay available');
  // audit chain
  await adm.click('.tabs button:has-text("Audit History")'); await adm.waitForSelector('#chain-status');
  ok(/Audit log verified/.test(await adm.locator('#chain-status').textContent()) && /entries checked/.test(await adm.locator('#chain-status').textContent()), 'Audit History shows the log is verified, with the entry count and fingerprint');
  await adm.screenshot({ path: `${out}/pr3-audit.png` });
  await adm.click('button:has-text("Verify now")'); await adm.waitForTimeout(500); ok(/verified/.test(await adm.locator('#chain-status').textContent()), 'the check can be repeated on demand');
  // settings
  await adm.click('.tabs button:has-text("Security Settings")'); await adm.fill('#ss-export_max_rows', '5000'); await adm.fill('#ss-rate_search_per_min', '90'); await adm.fill('#ss-alert_office_hours', '07:00-22:00'); await adm.click('.card button:has-text("Save")'); await adm.waitForSelector('.toast:has-text("Saved")');
  await adm.fill('#ss-alert_office_hours', '7-22'); await adm.click('.card button:has-text("Save")'); await adm.waitForSelector('.field-err'); ok(true, 'privacy and alert settings save valid values and refuse invalid ones');
  // export is watermarked and named
  const dl = await adm.evaluate(async () => { const r = await fetch('/api/reports/sessions.csv'); return { name: r.headers.get('content-disposition'), text: await r.text() }; });
  ok(/filename="fmc-sessions-\d{4}-\d\d-\d\d-admin\.csv"/.test(dl.name) && /^# CONFIDENTIAL FMC patient data - exported by admin/m.test(dl.text), 'the export file is named for the person and date and carries a confidentiality line');
  ok(errors.length === 0, `no browser console errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
