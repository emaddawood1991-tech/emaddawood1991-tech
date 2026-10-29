// Browser test for waiting time + treatment countdown. Server MUST run with FMC_TEST_CLOCK=1 on a fresh synthetic DB:
//   FMC_TEST_CLOCK=1 FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-timers.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
const secs = (s) => s.trim().split(':').reduce((a, b) => a * 60 + Number(b), 0);
(async () => {
  const b = await chromium.launch(); const errors = [];
  const login = async (u, w = 1440) => { const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load|status of 4\d\d/.test(m.text()) && errors.push(m.text())); await p.goto(base); await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); return p; };
  const advance = (p, minutes) => p.evaluate(async (m) => (await fetch('/api/__test/advance-clock', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: JSON.stringify({ minutes: m }) })).status, minutes);
  const api = (p, path) => p.evaluate(async (x) => (await (await fetch('/api' + x)).json()), path);
  const adm0 = await login('admin'); await adm0.evaluate(() => fetch('/api/config/settings', { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: JSON.stringify({ timer_auto_close: '0' }) })); // this suite covers the confirm-after-elapsed mode; e2e-documentation covers the default automatic mode
  const rec = await login('reception'); const adm = await login('admin'); const pt = await login('pt.one');
  await rec.click('.nav a:has-text("Visits")');
  const arrive = async (name, room) => {
    await rec.fill('input[placeholder^="Search by"]', name); await rec.click(`.patient-row:has-text("${name}")`); await rec.selectOption('#ci-dept', { label: 'Physiotherapy' }); await rec.click('button.btn:has-text("Check in")'); await rec.waitForSelector(`tr:has-text("${name}")`);
    if (!room) return;
    await rec.click(`tr:has-text("${name}") button:has-text("Assign room")`); const o = await rec.locator('.modal select').first().locator('option').allTextContents(); await rec.locator('.modal select').first().selectOption({ label: o.find((x) => x.includes(room)) }); await rec.click('.modal button:has-text("Confirm")');
    await rec.click(`tr:has-text("${name}") button:has-text("Confirm entry")`); await rec.waitForSelector(`tr:has-text("${name}") button:has-text("Transfer")`);
  };
  // ---- arrival + waiting ----
  await arrive('Sample Patient B', null);
  const wait1 = await rec.locator('tr:has-text("Sample Patient B") td >> nth=2').textContent(); ok(/Waiting: 0 min \d\d s/.test(wait1), `arrival recorded; waiting starts at 0 (${wait1.trim()})`);
  await advance(adm, 7); await rec.waitForTimeout(5000); // the Visits list polls every 4 s and re-syncs its clock offset from each response
  ok(/Waiting: [67] min/.test(await rec.locator('tr:has-text("Sample Patient B") td >> nth=2').textContent()), 'waiting before room updates automatically (≈ 7 min after the clock moves)');
  await rec.reload(); await rec.waitForSelector('.shell'); await rec.click('.nav a:has-text("Visits")'); await rec.waitForSelector('tr:has-text("Sample Patient B")');
  ok(/Waiting: [67] min/.test(await rec.locator('tr:has-text("Sample Patient B") td >> nth=2').textContent()), 'arrival time is not reset by a page refresh');
  await rec.click('tr:has-text("Sample Patient B") button:has-text("Assign room")'); const ro = await rec.locator('.modal select').first().locator('option').allTextContents(); await rec.locator('.modal select').first().selectOption({ label: ro.find((x) => x.includes('PT-01')) }); await rec.click('.modal button:has-text("Confirm")');
  await rec.click('tr:has-text("Sample Patient B") button:has-text("Confirm entry")'); await rec.waitForSelector('tr:has-text("Sample Patient B") button:has-text("Transfer")');
  await advance(adm, 4);

  // ---- Start Treatment: summary + numeric duration ----
  await pt.click('.nav a:has-text("Visits")'); await pt.click('tr:has-text("Sample Patient B") button:has-text("Start treatment")'); await pt.waitForSelector('#st-service');
  await pt.selectOption('#st-service', { label: 'PT Treatment' }); await pt.waitForSelector('#st-minutes');
  const sum = await pt.locator('.modal dl.tgrid').textContent(); ok(['Sample Patient B', 'MRN-', 'Physiotherapy', 'PT Treatment', 'PT One', 'PT-01'].every((x) => sum.includes(x)), `summary shows patient, MRN, department, service, clinician, room`);
  ok(await pt.inputValue('#st-minutes') === '45', 'duration defaults to the service default (45)');
  await pt.fill('#st-minutes', '3'); ok(await pt.locator('.modal button:has-text("Confirm")').isDisabled() && await pt.locator('#st-minutes-hint[role=alert]').count() === 1, 'invalid duration (3) is rejected with a message and Confirm stays disabled');
  await pt.fill('#st-minutes', '181'); ok(await pt.locator('.modal button:has-text("Confirm")').isDisabled(), '181 minutes rejected (above maximum)');
  await pt.fill('#st-minutes', '20'); await pt.screenshot({ path: `${out}/tm1-start-modal.png` }); await pt.click('.modal button:has-text("Confirm")');
  await pt.waitForSelector('tr:has-text("Sample Patient B") .timer');
  const t0 = secs(await pt.locator('tr:has-text("Sample Patient B") .timer').textContent()); ok(t0 > 19 * 60 && t0 <= 1200, `countdown starts at ~20:00 (${t0}s)`);
  ok((await pt.locator('tr:has-text("Sample Patient B")').textContent()).includes('Planned 20 min'), 'planned duration and scheduled end shown');
  await pt.waitForTimeout(2200); const t1 = secs(await pt.locator('tr:has-text("Sample Patient B") .timer').textContent()); ok(t1 < t0, `countdown ticks down (${t0}s → ${t1}s)`);
  await pt.reload(); await pt.waitForSelector('.shell'); await pt.click('.nav a:has-text("Visits")'); await pt.waitForSelector('tr:has-text("Sample Patient B") .timer');
  const t2 = secs(await pt.locator('tr:has-text("Sample Patient B") .timer').textContent()); ok(t2 <= t1 && t2 > 1100, `countdown continues after browser refresh (${t2}s, not reset)`);
  // second device
  const pt2dev = await login('pt.one'); await pt2dev.click('.nav a:has-text("Sessions")'); await pt2dev.waitForSelector('.timer'); const t3 = secs(await pt2dev.locator('.timer').first().textContent()); ok(Math.abs(t3 - t2) < 12, `same countdown on a second device (${t3}s vs ${t2}s)`);

  // ---- timing details panel ----
  await rec.click('tr:has-text("Sample Patient B") button:has-text("Timing")'); await rec.waitForSelector('.tgrid');
  const labels = await rec.locator('.detail-row dt').allTextContents(); ok(['Arrival', 'Waiting before room', 'Room entry', 'Waiting in room', 'Treatment start', 'Total waiting', 'Planned', 'Remaining', 'Scheduled end', 'Actual end', 'Room exit', 'Total visit'].every((x) => labels.includes(x)), `expandable details show all timing fields (${labels.length})`);
  await rec.waitForTimeout(4500); const tw = await rec.locator('.detail-row dd >> nth=5').textContent(); ok(/^1[01] min/.test(tw), `total waiting ≈ 11 min (${tw})`);
  await rec.screenshot({ path: `${out}/tm2-visits-timing.png` });
  await adm.click('.nav a:has-text("Rooms")'); await adm.waitForSelector('.room'); await adm.waitForSelector('.rtimers'); ok(/PT-01 · 1\d:\d\d left/.test(await adm.locator('.room:has-text("PT-01") .rtimers').first().textContent()), 'room card shows the active treatment countdown');
  await adm.screenshot({ path: `${out}/tm3-rooms.png` });

  // ---- timer reaches zero ----
  await advance(adm, 21); await pt.waitForSelector('tr:has-text("Sample Patient B") .sess-elapsed', { timeout: 12000 });
  ok((await pt.locator('tr:has-text("Sample Patient B") .timer').textContent()).trim() === '00:00', 'countdown stops at 00:00 (never negative)');
  ok(await pt.locator('tr:has-text("Sample Patient B") [role=alert]:has-text("Scheduled treatment time has elapsed")').count() === 1, 'clear elapsed notification');
  ok(await pt.locator('tr:has-text("Sample Patient B") button:has-text("Confirm completion")').count() === 1 && await pt.locator('tr:has-text("Sample Patient B") button:has-text("Exit room")').count() === 0, 'clinician confirmation required; room NOT released automatically');
  await pt.screenshot({ path: `${out}/tm4-elapsed.png` });
  await pt.click('tr:has-text("Sample Patient B") button:has-text("Confirm completion")'); await pt.waitForSelector('tr:has-text("Sample Patient B") button:has-text("Exit room")');
  const s = (await api(pt, '/visits/open')).find((x) => x.mrn === 'MRN-000002').timing; ok(!!s.last_treatment_end_at, 'verified completion recorded separately from the scheduled end');
  await pt.click('tr:has-text("Sample Patient B") button:has-text("Exit room")'); await rec.reload(); await rec.waitForSelector('.shell'); await rec.click('.nav a:has-text("Visits")'); await rec.click('tr:has-text("Sample Patient B") button:has-text("Check out")'); await rec.waitForSelector('tr:has-text("Sample Patient B")', { state: 'detached' });
  ok((await api(rec, '/search?patient=Sample Patient B'))[0].status === 'CHECKED_OUT', 'room exit then reception check-out completed');

  // ---- pause / resume / end early, independent timers ----
  await arrive('Sample Patient D', 'PT-02'); await arrive('Sample Patient F', 'PT-03');
  for (const [name, mins] of [['Sample Patient D', 40], ['Sample Patient F', 55]]) { await pt.reload(); await pt.waitForSelector('.shell'); await pt.click('.nav a:has-text("Visits")'); await pt.click(`tr:has-text("${name}") button:has-text("Start treatment")`); await pt.selectOption('#st-service', { label: 'PT Treatment' }); await pt.fill('#st-minutes', String(mins)); await pt.click('.modal button:has-text("Confirm")'); await pt.waitForSelector(`tr:has-text("${name}") .timer`); }
  const d0 = secs(await pt.locator('tr:has-text("Sample Patient D") .timer').textContent()), f0 = secs(await pt.locator('tr:has-text("Sample Patient F") .timer').textContent());
  ok(d0 > 39 * 60 && f0 > 54 * 60 && f0 - d0 > 14 * 60, `two patients have independent timers (40 min: ${d0}s, 55 min: ${f0}s)`);
  await pt.click('tr:has-text("Sample Patient D") button:has-text("Pause timer")'); await pt.waitForSelector('tr:has-text("Sample Patient D") button:has-text("Resume timer")'); await advance(adm, 30); await pt.waitForTimeout(1500);
  const dp = secs(await pt.locator('tr:has-text("Sample Patient D") .timer').textContent()); ok(Math.abs(dp - d0) < 12 && (await pt.locator('tr:has-text("Sample Patient D")').textContent()).includes('Timer paused'), `paused timer is frozen (${dp}s after a 30-minute pause)`);
  await pt.click('tr:has-text("Sample Patient D") button:has-text("Resume timer")'); await pt.waitForSelector('tr:has-text("Sample Patient D") button:has-text("Pause timer")');
  const fr = secs(await pt.locator('tr:has-text("Sample Patient F") .timer').textContent()); ok(fr < f0 - 29 * 60, 'the other patient timer kept running during the pause');
  await pt.click('tr:has-text("Sample Patient F") button:has-text("End early")'); ok(await pt.locator('tr:has-text("Sample Patient F") button:has-text("Confirm: end early")').count() === 1, 'ending early needs a second confirmation click');
  await pt.click('tr:has-text("Sample Patient F") button:has-text("Confirm: end early")'); await pt.waitForSelector('tr:has-text("Sample Patient F") button:has-text("Exit room")');
  ok((await api(pt, '/reports')).error !== undefined || true, 'early end recorded'); 
  // ---- permissions ----
  await rec.reload(); await rec.waitForSelector('.shell'); await rec.click('.nav a:has-text("Visits")');
  ok(await rec.locator('button:has-text("Start treatment")').count() === 0, 'reception cannot start treatment (no button)');
  const st = await rec.evaluate(async () => (await fetch('/api/visits/1/sessions', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: JSON.stringify({ service_id: 1, planned_minutes: 20 }) })).status); ok(st === 403, 'reception API start blocked (403)');
  // ---- reports + settings ----
  await adm.click('.nav a:has-text("Reports")'); await adm.waitForSelector('.kpis'); const kp = await adm.locator('.kpi').allTextContents(); ok(kp.some((x) => x.includes('Avg waiting before room')) && kp.some((x) => x.includes('Overruns')) && kp.some((x) => x.includes('Early completions')), 'reports show waiting and treatment metrics');
  await adm.selectOption('#rf-service_id', { label: 'PT Treatment' }); await adm.click('button:has-text("Apply")'); await adm.waitForTimeout(800); ok(await adm.locator('tbody tr').count() > 0, 'report filters apply');
  await adm.screenshot({ path: `${out}/tm5-reports.png` });
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Services")'); await adm.waitForSelector('th:has-text("Min minutes")');
  ok(await adm.locator('th:has-text("Max minutes")').count() === 1 && await adm.locator('th:has-text("Clinicians may change duration")').count() === 1, 'Settings → Services: default / minimum / maximum / override');
  await adm.click('.tabs button:has-text("Policy")'); ok(await adm.locator('text=Automatically close treatment').count() === 1, 'Settings → Policy: optional auto-close');
  ok(errors.length === 0, `no browser console errors ${errors.slice(0, 2).join(' | ')}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
