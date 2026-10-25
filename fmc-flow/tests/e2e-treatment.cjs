// Browser test for Start Treatment: node tests/e2e-treatment.cjs http://localhost:3100 [outDir]   (fresh synthetic database)
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp';
const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const login = async (u) => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load|status of 4\d\d/.test(m.text()) && errors.push(m.text())); await p.goto(base); await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); return p; };
  const api = (p, path, opts) => p.evaluate(async ([path, opts]) => { const r = await fetch('/api' + path, { credentials: 'same-origin', ...(opts || {}), headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: opts?.body ? JSON.stringify(opts.body) : undefined }); return { status: r.status, body: await r.json() }; }, [path, opts]);
  const rec = await login('reception'); await rec.click('.nav a:has-text("Visits")');
  const prep = async (name, deptLabel, roomCode) => {
    await rec.fill('input[placeholder^="Search by"]', name); await rec.click(`.patient-row:has-text("${name}")`);
    await rec.selectOption('#ci-dept', { label: deptLabel }); await rec.click('button.btn:has-text("Check in")'); await rec.waitForSelector(`tr:has-text("${name}")`);
    await rec.click(`tr:has-text("${name}") button:has-text("Assign room")`); const o = await rec.locator('.modal select').first().locator('option').allTextContents();
    await rec.locator('.modal select').first().selectOption({ label: o.find((x) => x.includes(roomCode)) }); await rec.click('.modal button:has-text("Confirm")');
    await rec.click(`tr:has-text("${name}") button:has-text("Confirm entry")`); await rec.waitForSelector(`tr:has-text("${name}") button:has-text("Transfer")`);
  };
  await prep('Sample Patient D', 'Physiotherapy', 'PT-01'); await prep('Sample Patient F', 'Physiotherapy', 'PT-02'); await prep('Sample Patient A', 'Orthopedics', 'ORT-01');

  // ---- Administrator (the reported case) ----
  const ad = await login('admin'); await ad.click('.nav a:has-text("Visits")'); await ad.click('tr:has-text("Sample Patient D") button:has-text("Start treatment")'); await ad.waitForSelector('#st-service');
  const opts = await ad.locator('#st-service option').allTextContents();
  ok(opts.some((o) => o.startsWith('PT Treatment')) && opts.some((o) => o.startsWith('PT Evaluation')) && !opts.some((o) => /Orthopedic|Neurolog|Rehab/.test(o)), `service list = the patient's department only (${opts.join(' | ')})`);
  ok(await ad.locator('text=Availability never grants').count() === 0, 'old confusing warning is gone');
  await ad.selectOption('#st-service', { label: 'PT Treatment' }); await ad.waitForSelector('#st-clin');
  ok(await ad.locator('.modal button:has-text("Confirm")').isDisabled(), 'Confirm waits for an authorized clinician to be chosen');
  const clins = await ad.locator('#st-clin option').allTextContents(); ok(clins.some((c) => c.includes('PT One')) && clins.some((c) => c.includes('PT Two')) && !clins.some((c) => /Admin|Supervisor|Reception|Ortho/.test(c)), `only authorized clinicians offered (${clins.join(' | ')})`);
  await ad.screenshot({ path: `${out}/t1-admin-modal.png` });
  await ad.selectOption('#st-clin', { label: clins.find((c) => c.includes('PT One')) }); await ad.click('.modal button:has-text("Confirm")');
  await ad.waitForSelector('tr:has-text("Sample Patient D") button:has-text("Pause")'); ok(true, 'administrator started treatment on behalf of an authorized clinician');
  ok((await ad.locator('.toast').last().textContent()).includes('PT One'), 'success message names service and clinician');

  // ---- authorized physiotherapist; unauthorized service shown with a reason ----
  const p1 = await login('pt.one'); await p1.click('.nav a:has-text("Sessions")'); await p1.waitForSelector('.timer');
  ok(await p1.locator('text=Sample Patient D').count() === 1 || (await p1.locator('.card').first().textContent()).includes('PT Treatment'), 'treatment appears on the clinician’s Sessions page');
  await p1.click('.nav a:has-text("Visits")'); await p1.click('tr:has-text("Sample Patient F") button:has-text("Start treatment")'); await p1.waitForSelector('#st-service');
  await p1.selectOption('#st-service', { label: 'PT Treatment' });
  ok(await p1.locator('p:has-text("Clinician")').textContent().then((x) => x.includes('PT One')) && await p1.locator('#st-clin').count() === 0, 'clinician starts as themselves (no dropdown)'); await p1.click('.modal button:has-text("Confirm")'); await p1.waitForSelector('tr:has-text("Sample Patient F") button:has-text("Pause")'); ok(true, 'authorized physiotherapist starts physiotherapy');
  const sess = await api(p1, '/sessions/active'); ok(sess.body.sessions.length === 2 && sess.body.sessions.every((s) => s.status === 'ACTIVE' && Date.parse(s.started_at) <= Date.now()), 'both sessions active with server timestamps');

  // ---- unauthorized physiotherapist ----
  const p2 = await login('pt.two'); await p2.click('.nav a:has-text("Visits")');
  await p2.waitForSelector('tr:has-text("Sample Patient D")');
  const rowF = p2.locator('tr:has-text("Sample Patient F")'); ok(await rowF.locator('button:has-text("Pause")').count() === 1, 'sessions of other clinicians are visible to colleagues in the department');
  const rec2 = await login('reception'); await rec2.click('.nav a:has-text("Visits")');
  await rec2.fill('input[placeholder^="Search by"]', 'Patient H'); await rec2.click('.patient-row:has-text("Sample Patient H")'); await rec2.selectOption('#ci-dept', { label: 'Physiotherapy' }); await rec2.click('button.btn:has-text("Check in")'); await rec2.waitForSelector('tr:has-text("Sample Patient H")');
  await rec2.click('tr:has-text("Sample Patient H") button:has-text("Assign room")'); const o2 = await rec2.locator('.modal select').first().locator('option').allTextContents(); await rec2.locator('.modal select').first().selectOption({ label: o2.find((x) => x.includes('PT-03')) }); await rec2.click('.modal button:has-text("Confirm")'); await rec2.click('tr:has-text("Sample Patient H") button:has-text("Confirm entry")');
  await p2.reload(); await p2.waitForSelector('.shell'); await p2.click('.nav a:has-text("Visits")'); await p2.click('tr:has-text("Sample Patient H") button:has-text("Start treatment")'); await p2.waitForSelector('#st-service');
  const o3 = await p2.locator('#st-service option').allTextContents(); ok(o3.some((o) => /Electrical Stimulation.*not authorized/.test(o)) && o3.some((o) => o === 'PT Treatment'), `unauthorized services are labelled (${o3.join(' | ')})`);
  await p2.selectOption('#st-service', { label: o3.find((o) => o.startsWith('Electrical')) }); await p2.waitForSelector('.banner.warn');
  ok(/not authorized to provide “Electrical Stimulation”/.test(await p2.locator('.banner.warn').textContent()) && await p2.locator('.modal button:has-text("Confirm")').isDisabled(), 'unauthorized clinician blocked with a clear message');
  await p2.screenshot({ path: `${out}/t2-unauthorized.png` });
  await p2.click('.modal button:has-text("Cancel")');

  // ---- admin grants the authorization in Settings; clinician can now start ----
  await ad.click('.nav a:has-text("Settings")'); await ad.click('.tabs button:has-text("Services")'); await ad.waitForSelector('text=Authorized clinicians');
  ok(await ad.locator('tr:has-text("Electrical Stimulation")').textContent().then((x) => x.includes('PT One') && !x.includes('PT Two')), 'Services tab shows who is authorized per service');
  await ad.screenshot({ path: `${out}/t3-settings-services.png` });
  await ad.click('.tabs button:has-text("Staff")'); await ad.click('tr:has-text("pt.two") button:has-text("Edit")'); await ad.waitForSelector('.modal');
  await ad.locator('.modal label.chk:has-text("Electrical Stimulation") input').check(); await ad.click('.modal button:has-text("Save")'); await ad.waitForSelector('.modal', { state: 'detached' });
  await p2.click('tr:has-text("Sample Patient H") button:has-text("Start treatment")'); await p2.waitForSelector('#st-service');
  const o4 = await p2.locator('#st-service option').allTextContents(); ok(o4.some((o) => o === 'Electrical Stimulation'), 'newly granted authorization takes effect immediately');
  await p2.selectOption('#st-service', { label: 'Electrical Stimulation' }); await p2.click('.modal button:has-text("Confirm")'); await p2.waitForSelector('tr:has-text("Sample Patient H") button:has-text("Pause")'); ok(true, 'clinician starts the service after the administrator authorized it');

  // ---- orthopedic doctor ----
  const dr = await login('dr.ort'); await dr.click('.nav a:has-text("Visits")'); await dr.click('tr:has-text("Sample Patient A") button:has-text("Start treatment")'); await dr.waitForSelector('#st-service');
  ok((await dr.locator('#st-service option').allTextContents()).join('|') === 'Choose a service|Orthopedic Consultation', 'orthopedic doctor sees only orthopedic services');
  await dr.selectOption('#st-service', { label: 'Orthopedic Consultation' }); await dr.click('.modal button:has-text("Confirm")'); await dr.waitForSelector('tr:has-text("Sample Patient A") button:has-text("Complete")'); ok(true, 'authorized orthopedic doctor starts orthopedic treatment');

  // ---- complete → room exit → check-out ----
  await dr.click('tr:has-text("Sample Patient A") button:has-text("Complete")'); await dr.waitForSelector('tr:has-text("Sample Patient A") button:has-text("Exit room")');
  await dr.click('tr:has-text("Sample Patient A") button:has-text("Exit room")'); await rec.reload(); await rec.waitForSelector('.shell'); await rec.click('.nav a:has-text("Visits")');
  await rec.click('tr:has-text("Sample Patient A") button:has-text("Check out")'); await rec.waitForSelector('tr:has-text("Sample Patient A")', { state: 'detached' });
  const v = await api(rec, '/search?patient=Sample Patient A'); ok(v.body[0].status === 'CHECKED_OUT', 'completion → room exit → check-out leaves the visit CHECKED_OUT');
  const tl = await api(rec, `/visits/${v.body[0].visit_id}/timeline`); ok(tl.body.events.map((e) => e.type).join() .includes('TREATMENT_STARTED,TREATMENT_COMPLETED,ROOM_EXITED,CLINIC_DEPARTED'), 'timeline records start, completion, exit and departure in order');
  ok(errors.length === 0, `no browser console errors ${errors.slice(0, 2).join(' | ')}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
