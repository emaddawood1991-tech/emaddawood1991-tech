// Browser test: documentation → schedule colour, and automatic operational check-out. Server MUST run with FMC_TEST_CLOCK=1 on a fresh synthetic DB:
//   FMC_TEST_CLOCK=1 FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-documentation.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const login = async (u) => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load|status of 4\d\d/.test(m.text()) && errors.push(m.text())); await p.goto(base); await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); return p; };
  const advance = (p, minutes) => p.evaluate(async (m) => (await fetch('/api/__test/advance-clock', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: JSON.stringify({ minutes: m }) })).status, minutes);
  const adm = await login('admin'); const rec = await login('reception'); const pt = await login('pt.one');
  const N = 'Sample Patient C';
  const closeModal = async (p) => { await p.click('.modal button:has-text("✕")'); await p.waitForSelector('.modal', { state: 'detached' }); };

  // administrator enters the clinic's approved procedure codes (synthetic test codes)
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Procedure codes")');
  for (const [code, min] of [['TST30', '30'], ['TST40', '40']]) {
    await adm.click('.card button:has-text("Add")'); const m = adm.locator('.modal');
    await m.locator('input[type=text]').nth(0).fill(code); await m.locator('input[type=text]').nth(1).fill('synthetic test code'); await m.locator('input[type=number]').fill(min); await m.locator('button:has-text("Save")').click();
    await adm.waitForSelector(`td:has-text("${code}")`);
  }
  ok(await adm.locator('td:has-text("TST30")').count() === 1 && await adm.locator('td:has-text("TST40")').count() === 1, 'administrator added approved procedure codes in Settings');

  // reception: arrival + room
  await rec.click('.nav a:has-text("Visits")');
  await rec.fill('input[placeholder^="Search by"]', N); await rec.click(`.patient-row:has-text("${N}")`); await rec.selectOption('#ci-dept', { label: 'Physiotherapy' }); await rec.click('button.btn:has-text("Check in")'); await rec.waitForSelector(`tr:has-text("${N}")`);
  await rec.click(`tr:has-text("${N}") button:has-text("Assign room")`); const o = await rec.locator('.modal select').first().locator('option').allTextContents(); await rec.locator('.modal select').first().selectOption({ label: o.find((x) => x.includes('PT-01')) }); await rec.click('.modal button:has-text("Confirm")');
  await rec.click(`tr:has-text("${N}") button:has-text("Confirm entry")`); await rec.waitForSelector(`tr:has-text("${N}") button:has-text("Transfer")`);

  // clinician starts treatment; the approved code sets the duration
  await pt.click('.nav a:has-text("Visits")'); await pt.click(`tr:has-text("${N}") button:has-text("Start treatment")`); await pt.waitForSelector('#st-service');
  await pt.selectOption('#st-service', { label: 'PT Treatment' }); await pt.waitForSelector('#st-cpt');
  await pt.selectOption('#st-cpt', { label: (await pt.locator('#st-cpt option').allTextContents()).find((x) => x.startsWith('TST30')) });
  ok(await pt.inputValue('#st-minutes') === '30', 'choosing the approved code TST30 sets the duration to 30 minutes');
  await pt.click('.modal button:has-text("Confirm")'); await pt.waitForSelector(`tr:has-text("${N}") .timer`);
  const row = (p) => p.locator(`tr:has-text("${N}")`);
  ok(await row(pt).locator('.sched-yellow').count() >= 1 && /0\/4/.test(await row(pt).locator('.sess .sched').first().textContent()), 'new treatment is YELLOW — documentation incomplete (0/4)');

  // 3 of 4 saved → still yellow
  const openDoc = async () => { await row(pt).locator('button:has-text("Documentation")').first().click(); await pt.waitForSelector('#doc-cc'); };
  await openDoc();
  await pt.fill('#doc-cc', 'Right knee pain'); await pt.fill('#doc-dx', 'Patellofemoral pain syndrome'); await pt.selectOption('#doc-cpt', { label: (await pt.locator('#doc-cpt option').allTextContents()).find((x) => x.startsWith('TST30')) });
  await pt.fill('#doc-pn', '   ');
  await pt.click('.modal button:has-text("Save documentation")'); await pt.waitForSelector('.modal .ok');
  ok(/3 of 4/.test(await pt.locator('.modal').textContent()) && await pt.locator('.modal .sched-yellow').count() === 1, 'three saved fields (whitespace note ignored) → still YELLOW');
  await pt.screenshot({ path: `${out}/doc1-three-fields.png` });
  // 4th typed but NOT saved
  await pt.fill('#doc-pn', 'Pain 6/10, exercise program given');
  ok(await pt.locator('.modal:has-text("unsaved changes")').count() === 1 && await pt.locator('.modal .sched-yellow').count() === 1, 'four fields typed but unsaved → warning shown and status still YELLOW');
  await closeModal(pt);
  await pt.waitForTimeout(500);
  await rec.click('.nav a:has-text("Schedule")'); await rec.waitForSelector('.sched-row');
  ok(await rec.locator(`.sched-row:has-text("${N}") .sched-yellow`).count() === 1, 'schedule (reception) still shows YELLOW while the 4th field is unsaved');
  // save → orange
  await openDoc(); await pt.fill('#doc-pn', 'Pain 6/10, exercise program given'); await pt.click('.modal button:has-text("Save documentation")'); await pt.waitForSelector('.modal .sched-orange');
  ok(true, 'saving the 4th valid field → ORANGE in the dialog');
  await closeModal(pt);
  await rec.waitForSelector(`.sched-row:has-text("${N}") .sched-orange`, { timeout: 9000 }); ok(true, 'reception schedule turns ORANGE automatically (no manual change)');
  await rec.screenshot({ path: `${out}/doc2-schedule-orange.png` });
  ok(await rec.locator('.sched-row .btn:has-text("Documentation")').first().isVisible(), 'reception can open documentation status (not edit)');
  await rec.locator(`.sched-row:has-text("${N}") button:has-text("Documentation")`).click(); await rec.waitForSelector('.modal');
  ok(await rec.locator('.modal textarea').count() === 0 && /Only the treating clinician/.test(await rec.locator('.modal').textContent()), 'reception sees completeness only, no clinical text, no edit fields');
  await closeModal(rec);

  // edit makes it incomplete again → yellow
  await openDoc(); await pt.fill('#doc-pn', ''); await pt.click('.modal button:has-text("Save documentation")'); await pt.waitForSelector('.modal .sched-yellow');
  ok(true, 'clearing a field and saving returns the status to YELLOW'); await closeModal(pt);
  await openDoc(); await pt.fill('#doc-pn', 'Pain 5/10 after treatment'); await pt.click('.modal button:has-text("Save documentation")'); await pt.waitForSelector('.modal .sched-orange'); await closeModal(pt);

  // timer expires (default automatic mode): stops and checks out at exactly the entered duration; documentation untouched
  await advance(adm, 31);
  await pt.waitForSelector(`tr:has-text("${N}") button:has-text("Exit room")`, { timeout: 14000 });
  ok(await row(pt).locator('.timer, .sess-elapsed').count() === 0 && !/overtime/i.test(await row(pt).textContent()), 'the treatment stopped at its scheduled end — no running timer and no overtime');
  ok(await row(pt).locator('button:has-text("Confirm completion")').count() === 0, 'nothing to click: the check-out already happened');
  await rec.click('.nav a:has-text("Schedule")');
  await rec.waitForSelector(`.sched-row:has-text("${N}"):has-text("Operational check-out")`, { timeout: 9000 });
  const sch = await rec.locator(`.sched-row:has-text("${N}")`).textContent();
  ok(/Completed/.test(sch) && /automatic/i.test(sch), 'schedule shows the automatic check-out, not clinician-verified');
  ok(await rec.locator(`.sched-row:has-text("${N}") .sched-orange`).count() === 1, 'documentation remains complete (ORANGE) after the automatic check-out');
  await rec.screenshot({ path: `${out}/doc3-operational-checkout.png` });
  // the patient is still physically in the room until the exit step
  ok(await row(pt).locator('button:has-text("Transfer")').count() === 1, 'the patient is still in the room until room exit is recorded');
  ok(errors.length === 0, `no browser console errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
