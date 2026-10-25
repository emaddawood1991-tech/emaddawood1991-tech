// Browser test for reception registration: node tests/e2e-registration.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp';
const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const mk = async (w = 1440, h = 900) => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && !/Failed to load/.test(m.text()) && errors.push(m.text())); return { ctx, page, errors }; };
  const login = async (page, u) => { await page.goto(base); await page.fill('input[autocomplete=username]', u); await page.fill('input[type=password]', PW); await page.click('button.btn:has-text("Sign in")'); await page.waitForSelector('.shell'); };
  const api = (page, path) => page.evaluate(async (p) => (await fetch('/api' + p, { credentials: 'same-origin' })).json(), path);

  const R = await mk(); const page = R.page;
  await login(page, 'reception'); await page.click('.nav a:has-text("Visits")');
  await page.click('button:has-text("New patient")'); await page.waitForSelector('.modal');
  ok(await page.locator('.modal [id=pf-name]').isVisible() && await page.locator('.modal [id=pf-name_ar]').isVisible() && await page.locator('.modal [id=pf-dob]').isVisible() && await page.locator('.modal [id=pf-sex]').isVisible() && await page.locator('.modal [id=pf-phone]').isVisible() && await page.locator('.modal [id=pf-department_id]').isVisible() && await page.locator('.modal [id=pf-service_id]').isVisible(), 'form shows name EN/AR, DOB, gender, phone, department, service');
  ok(await page.locator('.modal input[type=radio]').count() === 2, 'MRN: automatic vs manual choice');
  ok(await page.locator('#pf-dob').getAttribute('max') === new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date()), 'date picker blocks future dates');
  ok(await page.locator('#pf-name_ar').getAttribute('dir') === 'rtl', 'Arabic name input is right-to-left');
  const depts = await page.locator('#pf-department_id option').allTextContents();
  ok(depts.includes('Neurological Rehabilitation') && !depts.some((d) => /Occupational|Speech/.test(d)), 'departments come from active configuration; OT/Speech absent');
  ok(await page.locator('#pf-service_id').isDisabled(), 'service disabled until a department is chosen');
  await page.screenshot({ path: `${out}/r1-form.png` });

  // 1) manual MRN + register & check in
  await page.check('input[type=radio] >> nth=1'); await page.fill('#pf-mrn', 'fmc-90001');
  await page.fill('#pf-name', 'Synthetic Reg One'); await page.fill('#pf-name_ar', 'مريض تسجيل أول'); await page.fill('#pf-dob', '1988-04-09');
  await page.selectOption('#pf-sex', 'F'); await page.fill('#pf-phone', '050 123 9001');
  await page.selectOption('#pf-department_id', { label: 'Neurological Rehabilitation' });
  const svcs = await page.locator('#pf-service_id option').allTextContents();
  ok(svcs.some((s) => /Neurological/.test(s)) && !svcs.some((s) => /PT|Physio/.test(s)), 'services filtered by department');
  await page.selectOption('#pf-service_id', { label: 'Neurological Assessment' });
  await page.click('button:has-text("Save & check in")');
  await page.waitForSelector('.toast:has-text("FMC-90001")'); await page.waitForSelector('tr:has-text("Synthetic Reg One")');
  ok((await page.locator('.toast').last().textContent()).includes('N001'), 'success message shows MRN and queue number');
  let found = await api(page, '/patients?q=FMC-90001');
  ok(found.length === 1 && found[0].name_ar === 'مريض تسجيل أول' && found[0].dob === '1988-04-09' && found[0].phone === '+971501239001' && found[0].sex === 'F', 'saved EN/AR name, DOB, gender and normalised phone');

  // 2) duplicate MRN
  await page.click('button:has-text("New patient")'); await page.check('input[type=radio] >> nth=1'); await page.fill('#pf-mrn', 'FMC-90001'); await page.fill('#pf-name', 'Someone Else');
  await page.click('button:has-text("Save patient")'); await page.waitForSelector('#pf-mrn-err');
  ok(await page.locator('#pf-mrn').getAttribute('aria-invalid') === 'true' && /already/i.test(await page.locator('#pf-mrn-err').textContent()), 'duplicate MRN shows an accessible inline error');
  ok((await api(page, '/patients?q=Someone')).length === 0, 'duplicate MRN created nothing');
  await page.screenshot({ path: `${out}/r2-duplicate-mrn.png` });
  // client-side/field validation messages
  await page.check('input[type=radio] >> nth=0'); await page.fill('#pf-name', ''); await page.fill('#pf-phone', '12345'); await page.click('button:has-text("Save patient")');
  await page.waitForSelector('#pf-name-err'); await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'pf-name', null, { timeout: 3000 }).catch(() => {});
  ok(await page.locator('#pf-phone-err').isVisible() && await page.locator('#pf-name').evaluate((e) => document.activeElement === e), 'field errors shown, focus moves to first invalid field');
  await page.screenshot({ path: `${out}/r3-errors.png` });

  // 3) auto MRN, save only, then check in as a selected patient
  await page.fill('#pf-name', 'Synthetic Reg Two'); await page.fill('#pf-phone', '+44 7700 900555'); await page.fill('#pf-name_ar', 'مريض تسجيل ثاني');
  await page.click('button:has-text("Save patient")'); await page.waitForSelector('.toast:has-text("MRN-")');
  await page.waitForSelector('text=Selected patient');
  await page.selectOption('#ci-dept', { label: 'Sports Injury Treatment' }); await page.click('button.btn:has-text("Check in")');
  await page.waitForSelector('tr:has-text("Synthetic Reg Two")'); ok((await page.locator('.toast').last().textContent()).includes('S001'), 'saved patient then checked in to chosen department queue');
  found = await api(page, '/patients?q=900555'); ok(found.length === 1 && found[0].phone === '+447700900555' && /^MRN-\d{6}$/.test(found[0].mrn), 'international number preserved; automatic MRN generated');

  // 4) find existing by Arabic name, phone, MRN; check in without duplicating
  const total = (await api(page, '/patients?q=Synthetic')).length;
  for (const q of ['تسجيل أول', '0501239001', 'FMC-90001']) { await page.fill('input[placeholder^="Search by"]', q).catch(async () => { await page.click('button:has-text("Change")'); await page.fill('input[placeholder^="Search by"]', q); }); await page.waitForSelector('.patient-row:has-text("Synthetic Reg One")'); }
  ok(true, 'existing patient found by Arabic name, phone and MRN');
  await page.click('.patient-row:has-text("Synthetic Reg One")');
  await page.selectOption('#ci-dept', { label: 'Rehabilitation' }); await page.selectOption('#ci-svc', { label: 'Postoperative Rehabilitation' }); await page.click('button.btn:has-text("Check in")');
  await page.waitForSelector('.toast:has-text("R001")');
  ok((await api(page, '/patients?q=Synthetic')).length === total, 'existing patient checked in to a second department without a duplicate record');

  // 5) double click
  await page.click('button:has-text("New patient")'); await page.fill('#pf-name', 'Synthetic Double'); await page.selectOption('#pf-department_id', { label: 'General Medicine' });
  await page.locator('button:has-text("Save & check in")').dblclick(); await page.waitForSelector('tr:has-text("Synthetic Double")'); await page.waitForTimeout(500);
  ok((await api(page, '/patients?q=Synthetic Double')).length === 1, 'double-clicking Save creates one patient');

  // 6) persists after refresh
  await page.reload(); await page.waitForSelector('.shell'); await page.click('.nav a:has-text("Visits")'); await page.waitForSelector('tr:has-text("Synthetic Reg One")');
  ok(await page.locator('tr:has-text("Synthetic Reg Two")').count() > 0, 'records and open visits persist after refresh');

  // 7) Arabic + mobile layout
  await page.click('button:has-text("العربية")'); await page.click('button:has-text("مريض جديد")'); await page.waitForSelector('.modal'); await page.screenshot({ path: `${out}/r4-arabic-form.png` });
  ok(await page.evaluate(() => document.documentElement.dir) === 'rtl' && /الاسم الكامل \(بالعربية\)/.test(await page.locator('.modal').textContent()), 'Arabic labels and RTL layout');
  const M = await mk(390, 800); await login(M.page, 'reception'); await M.page.click('.nav a:has-text("Visits")'); await M.page.click('button:has-text("New patient")'); await M.page.waitForSelector('.modal');
  const overflow = await M.page.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth, modal: (() => { const m = document.querySelector('.modal'); return m.scrollWidth - m.clientWidth; })() }));
  ok(overflow.doc <= 1 && overflow.modal <= 1, `mobile 390px: no horizontal overflow (${JSON.stringify(overflow)})`); await M.page.screenshot({ path: `${out}/r5-mobile.png` });

  // 8) permissions
  const C = await mk(); await login(C.page, 'pt.one'); await C.page.click('.nav a:has-text("Visits")'); await C.page.waitForTimeout(600);
  ok(await C.page.locator('button:has-text("New patient")').count() === 0 && await C.page.locator('h2:has-text("Check in")').count() === 0, 'clinician does not see patient registration');
  const status = await C.page.evaluate(async () => (await fetch('/api/patients', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: '{"name":"x"}' })).status);
  ok(status === 403, 'clinician API registration blocked (403)');
  // settings page
  const A = await mk(); await login(A.page, 'admin'); await A.page.click('.nav a:has-text("Settings")'); await A.page.click('.tabs button:has-text("Policy")');
  ok(await A.page.locator('text=Arabic name required at registration').count() === 1 && await A.page.locator('text=Gender options').count() === 1, 'Settings → Policy has registration options');
  await A.page.screenshot({ path: `${out}/r6-policy.png` });
  for (const s of [R, M, C, A]) ok(s.errors.length === 0, `no console errors ${s.errors.slice(0, 2).join(' | ')}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
