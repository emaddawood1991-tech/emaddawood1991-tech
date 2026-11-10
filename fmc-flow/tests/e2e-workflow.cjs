// Browser test of the workflow fixes (stage S8). Fresh synthetic DB:
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-workflow.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const newPage = async () => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/40[01234]|409|Forbidden|Unauthorized|Bad Request|Not Found|Conflict/.test(m.text())) errors.push(m.text()); }); await p.goto(base); return p; };
  const signIn = async (p, u, pw) => { await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', pw); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); };
  const rec = await newPage(); await signIn(rec, 'reception', PW);
  const mk = (name, dep) => rec.evaluate(async ([name, dep]) => { const H = { 'content-type': 'application/json', 'x-requested-with': 'fmc' };
    const cfg = await (await fetch('/api/config')).json(); const d = cfg.departments.find((x) => x.name === dep).id;
    const p = await (await fetch('/api/patients', { method: 'POST', headers: H, body: JSON.stringify({ name }) })).json();
    await fetch('/api/registrations', { method: 'POST', headers: H, body: JSON.stringify({ patient_id: p.id, department_id: d }) }); return p.mrn; }, [name, dep]);
  // 1. cancel and no-show from the queue
  await mk('Walkaway Browser Patient', 'Physiotherapy'); await mk('Absent Browser Patient', 'Physiotherapy');
  await rec.click('.nav a:has-text("Queue")'); await rec.waitForSelector('tr:has-text("Walkaway Browser Patient")');
  await rec.click('tr:has-text("Walkaway Browser Patient") button:has-text("Cancel")'); await rec.waitForSelector('[data-testid=cancel-reason]');
  ok(await rec.locator('.modal button:has-text("Confirm")').isDisabled(), 'a cancellation cannot be confirmed without a reason');
  await rec.fill('[data-testid=cancel-reason]', 'Patient left before being called'); await rec.click('.modal button:has-text("Confirm")');
  await rec.waitForSelector('tr:has-text("Walkaway Browser Patient")', { state: 'detached' }); ok(true, 'a cancelled patient leaves the queue');
  await rec.click('tr:has-text("Absent Browser Patient") button:has-text("No-show")'); await rec.click('.modal button:has-text("Confirm")');
  await rec.waitForSelector('tr:has-text("Absent Browser Patient")', { state: 'detached' }); ok(true, 'a no-show leaves the queue without needing a reason');
  await rec.screenshot({ path: `${out}/w1-queue.png` });
  // 2. correct a patient
  const mrn = await mk('Typo Browser Pateint', 'Physiotherapy');
  await rec.click('.nav a:has-text("Visits")'); await rec.fill('input[placeholder^="Search by"]', 'Typo Browser'); await rec.click('.patient-row:has-text("Typo Browser")');
  await rec.click('[data-testid=edit-patient]'); await rec.waitForSelector('[data-testid=patient-edit]');
  ok(/cannot be changed/.test(await rec.locator('[data-testid=patient-edit]').textContent()) && await rec.locator('[data-testid=patient-edit] input[value="' + mrn + '"]').count() === 0, 'the EMR number is shown but not editable');
  await rec.fill('#pe-name', 'Typo Browser Patient'); await rec.click('[data-testid=patient-edit] button:has-text("Save")'); await rec.waitForSelector('[data-testid=patient-edit]', { state: 'detached' });
  ok(await rec.locator('text=Typo Browser Patient').count() >= 1, 'the corrected name is shown');
  await rec.click('[data-testid=edit-patient]'); await rec.click('button:has-text("Change history")'); await rec.waitForSelector('[data-testid=patient-history] tr');
  ok(/Typo Browser Pateint → Typo Browser Patient/.test(await rec.locator('[data-testid=patient-history]').textContent()), 'the change history keeps the old value');
  await rec.screenshot({ path: `${out}/w2-edit.png` });
  // 3. staff in more than one department
  const adm = await newPage(); await signIn(adm, 'admin', PW);
  await mk('Ortho Browser Patient', 'Orthopedics');
  const pt = await newPage(); await signIn(pt, 'pt.two', PW);
  const seen = (page) => page.evaluate(async () => (await (await fetch('/api/patients?q=' + encodeURIComponent('Ortho Browser'))).json()).length);
  ok(await seen(pt) === 0, 'before: a physiotherapist cannot find an orthopedic patient');
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Staff")');
  await adm.click('tr:has-text("pt.two") button:has-text("Edit")'); await adm.waitForSelector('[data-testid=extra-depts]');
  await adm.click('[data-testid=extra-depts] label:has-text("Orthopedics") input'); await adm.click('.modal button:has-text("Save")'); await adm.waitForSelector('.modal', { state: 'detached' });
  await adm.waitForSelector('tr:has-text("pt.two"):has-text("Orthopedics")'); ok(true, 'the staff list shows the extra department');
  ok(await seen(pt) === 1, 'after: the same physiotherapist finds the patient of the extra department');
  await adm.screenshot({ path: `${out}/w3-staff.png` });
  // 4. department with a live queue
  await mk('Queued Neuro Browser', 'Neurological Rehabilitation');
  await adm.click('.tabs button:has-text("Departments")'); await adm.click('tr:has-text("Neurological Rehabilitation") button:has-text("Edit")');
  let dlg = null; adm.once('dialog', async (d) => { dlg = d.message(); await d.dismiss(); });
  await adm.click('.modal label:has-text("Active") input'); await adm.click('.modal button:has-text("Save")'); await adm.waitForTimeout(800);
  ok(/still queued/.test(dlg || ''), 'deactivating a department with queued patients asks first'); ok(await adm.locator('.modal').count() > 0, 'declining keeps the department active');
  adm.once('dialog', (d) => d.accept()); await adm.click('.modal button:has-text("Save")'); await adm.waitForSelector('.modal', { state: 'detached' });
  const neuroActive = await adm.evaluate(async () => (await (await fetch('/api/config')).json()).departments.find((d) => d.name === 'Neurological Rehabilitation').active); ok(neuroActive === 0, 'confirming deactivates it');
  // 5. shared room status
  const hall = await adm.evaluate(async () => { const cfg = await (await fetch('/api/config')).json(); return cfg.rooms.find((r) => r.code === 'PT-HALL-01').display_status; });
  ok(hall === 'AVAILABLE', 'an empty hall is available');
  ok(errors.length === 0, `no browser console errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})();
