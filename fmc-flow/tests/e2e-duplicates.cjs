// Browser test of duplicate-patient linking (stage S11). Fresh synthetic DB:
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-duplicates.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const newPage = async () => { const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/40[01234]|409|Forbidden|Unauthorized|Bad Request|Not Found|Conflict/.test(m.text())) errors.push(m.text()); }); await p.goto(base); return p; };
  const signIn = async (p, u) => { await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); };
  const typeSlow = async (p, sel, text) => { await p.click(sel); for (const ch of text) await p.keyboard.type(ch, { delay: 10 }); return (await p.locator(sel).inputValue()) === text; };
  const go = async (p, label) => { await p.click(`.nav a:has-text("${label}")`); await p.waitForTimeout(400); };

  const rec = await newPage(); await signIn(rec, 'reception');
  const mk = await rec.evaluate(async () => {
    const H = { 'content-type': 'application/json', 'x-requested-with': 'fmc' };
    const cfg = await (await fetch('/api/config')).json(); const dep = cfg.departments.find((d) => d.name === 'Physiotherapy').id;
    const post = async (u, body) => (await fetch(u, { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
    const A = await post('/api/patients', { name: 'Browser Duplicate One', phone: '0506660101', dob: '1991-02-03', sex: 'F' });
    const B = await post('/api/patients', { name: 'Browser Duplicat One', phone: '0506660101', dob: '1991-02-03', sex: 'F', confirm_duplicate: true });
    const r = await post('/api/registrations', { patient_id: B.id, department_id: dep });
    const q = (await (await fetch('/api/queue')).json()).entries.find((e) => e.visit_id === (r.visit?.id ?? r.visit_id));
    await post(`/api/queue/${q.id}/cancel`, { kind: 'CANCELLED', reason: 'Registered twice by mistake' });
    return { a: A.mrn, b: B.mrn, aId: A.id, bId: B.id };
  });
  // 1. reception reports a suspected duplicate; it has no way to link
  await go(rec, 'Duplicates'); await rec.waitForSelector('[data-testid=dup-report]');
  ok(await rec.locator('[data-testid=dup-candidates]').count() === 0 && await rec.locator('button:has-text("Link as duplicates")').count() === 0, 'reception sees only the report form, no linking');
  await rec.fill('#dr-a', mk.a); await rec.fill('#dr-b', mk.b); ok(await typeSlow(rec, '#dr-r', 'Same phone and almost the same name'), 'the reason box keeps focus while typing');
  await rec.click('button:has-text("Send for review")'); await rec.waitForSelector('.toast:has-text("Reported")'); ok(true, 'reception reports the pair for review');
  // 2. a clinic manager reviews the report and proposes the link
  const sup = await newPage(); await signIn(sup, 'super'); await go(sup, 'Duplicates'); await sup.waitForSelector('[data-testid=dup-candidates] tr:has-text("' + mk.b + '")');
  ok(true, 'the pair is listed as a possible duplicate (same phone and same name/date of birth)'); ok(await sup.locator('text=Reported by staff').count() === 1, 'the staff report is shown');
  await sup.screenshot({ path: `${out}/d1-candidates.png`, fullPage: true });
  await sup.click('[data-testid=dup-candidates] tr:has-text("' + mk.b + '") button:has-text("Link as duplicates")'); await sup.waitForSelector('[data-testid=dup-propose]');
  ok(await sup.locator('[data-testid=dup-propose] button:has-text("Propose link")').isDisabled(), 'a link cannot be proposed without a reason');
  await sup.locator('[data-testid=dup-propose] input[type=radio]').first().check(); // keep record A
  ok(await typeSlow(sup, '#dp-reason', 'Same person registered twice at the front desk'), 'the reason box keeps focus while typing');
  await sup.click('[data-testid=dup-propose] button:has-text("Propose link")'); await sup.waitForSelector('.toast:has-text("Link proposed")');
  await sup.waitForSelector('[data-testid=dup-pending] tr'); ok(true, 'the proposal waits for approval');
  ok(await sup.locator('[data-testid^=approve-]').isDisabled() && /different person/i.test(await sup.locator('[data-testid=dup-pending]').textContent()), 'the proposer cannot approve their own link');
  // 3. an administrator approves
  const adm = await newPage(); await signIn(adm, 'admin'); await go(adm, 'Duplicates'); await adm.waitForSelector('[data-testid=dup-pending] tr');
  ok(await adm.locator('[data-testid^=approve-]').isEnabled(), 'a different person can approve');
  await adm.click('[data-testid^=approve-]'); await adm.click('.modal button:has-text("Approve")'); await adm.waitForSelector('.toast:has-text("approved")');
  await adm.waitForSelector('[data-testid=dup-active] tr:has-text("' + mk.b + '")'); ok(true, 'the approved link appears under linked records');
  await adm.screenshot({ path: `${out}/d2-linked.png`, fullPage: true });
  // 4. search and history resolve to the surviving record
  await go(rec, 'Visits'); await rec.fill('input[placeholder^="Search by"]', mk.b); await rec.waitForSelector('.patient-row');
  const row = await rec.locator('.patient-row').first().textContent();
  ok(row.includes(mk.a) && /also known as/.test(row) && row.includes(mk.b), 'searching the duplicate’s EMR number offers the surviving record, "also known as" the old number');
  await rec.click('.patient-row'); await rec.click('[data-testid=visits-history]'); await rec.waitForSelector('[data-testid=aka-banner]');
  ok((await rec.locator('[data-testid=aka-banner]').textContent()).includes(mk.b) && (await rec.locator('[data-testid=patient-history-modal]').textContent()).includes('linked record'), 'the history shows the old EMR number and labels visits from the linked record');
  await rec.screenshot({ path: `${out}/d3-history.png` });
  const blocked = await rec.evaluate(async (id) => { const r = await fetch('/api/visits/checkin', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: JSON.stringify({ patientId: id, departmentId: 1 }) }); return (await r.json()).error?.code; }, mk.bId);
  ok(blocked === 'PATIENT_LINKED', 'the duplicate record cannot take new check-ins');
  // 5. undo (administrator only)
  ok(await sup.locator('button:has-text("Undo link")').count() === 0, 'a clinic manager has no undo');
  await adm.click('[data-testid=dup-active] button:has-text("Undo link")'); ok(await typeSlow(adm, '#du-reason', 'Two different people with the same phone'), 'the undo reason box keeps focus while typing');
  await adm.click('.modal button:has-text("Undo link")'); await adm.waitForSelector('.toast:has-text("Done")');
  await adm.waitForSelector('[data-testid=dup-active] tr', { state: 'detached' }); ok(true, 'the link is undone and the records are independent again');
  // 6. booked appointments on the duplicate block the link; one click moves them; the Reports page counts people
  const mk2 = await rec.evaluate(async () => {
    const H = { 'content-type': 'application/json', 'x-requested-with': 'fmc' };
    const cfg = await (await fetch('/api/config')).json(); const dep = cfg.departments.find((d) => d.name === 'Physiotherapy').id;
    const post = async (u, body) => (await fetch(u, { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
    const C = await post('/api/patients', { name: 'Booked Person Two', phone: '0506660202', dob: '1988-08-08', sex: 'M' });
    const D = await post('/api/patients', { name: 'Booked Persn Two', phone: '0506660202', dob: '1988-08-08', sex: 'M', confirm_duplicate: true });
    await post('/api/appointments', { patient_id: D.id, department_id: dep, scheduled_at: new Date(Date.now() + 5 * 864e5).toISOString() });
    return { c: C.mrn, d: D.mrn };
  });
  await sup.reload(); await go(sup, 'Duplicates'); await sup.waitForSelector('[data-testid=dup-candidates] tr:has-text("' + mk2.d + '")');
  await sup.click('[data-testid=dup-candidates] tr:has-text("' + mk2.d + '") button:has-text("Link as duplicates")'); await sup.waitForSelector('[data-testid=dup-propose]');
  await sup.locator('[data-testid=dup-propose] input[type=radio]').first().check(); await typeSlow(sup, '#dp-reason', 'Same person, same phone and same date of birth');
  await sup.click('[data-testid=dup-propose] button:has-text("Propose link")'); await sup.waitForSelector('[data-testid=dup-blocked]');
  ok(/booked appointment/.test(await sup.locator('[data-testid=dup-blocked]').textContent()), 'booked appointments on the duplicate block the link and are listed');
  await sup.screenshot({ path: `${out}/d4-blocked.png` });
  await sup.click('[data-testid=dup-move]'); await sup.waitForSelector('[data-testid=dup-moved]'); ok(/Moved appointments: 1/.test(await sup.locator('[data-testid=dup-moved]').textContent()), 'one click moves the bookings to the record that is kept');
  ok(await sup.locator('[data-testid=dup-blocked]').count() === 0, 'the block disappears once the work is moved');
  await sup.click('[data-testid=dup-propose] button:has-text("Propose link")'); await sup.waitForSelector('.toast:has-text("Link proposed")'); ok(true, 'the link can then be proposed');
  await adm.reload(); await go(adm, 'Duplicates'); await adm.waitForSelector('[data-testid=dup-pending] tr'); await adm.click('[data-testid^=approve-]'); await adm.click('.modal button:has-text("Approve")'); await adm.waitForSelector('.toast:has-text("approved")');
  await go(adm, 'Reports'); await adm.waitForSelector('.kpis'); const kp = await adm.locator('.kpis').first().textContent(); ok(/People/.test(kp) && /Visits/.test(kp), 'Reports shows a People count next to Visits');
  ok(errors.length === 0, `no browser errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})();
