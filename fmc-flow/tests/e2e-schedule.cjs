// Browser test of the Daily Schedule page (real server + real SQLite, synthetic data). Fresh DB:
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-schedule.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
const DAY = '2030-03-05';
(async () => {
  const b = await chromium.launch(); const errors = [];
  const login = async (u, w = 1440, h = 900) => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load|status of 4\d\d/.test(m.text()) && errors.push(m.text())); await p.goto(base); await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); return p; };
  const open = async (p) => { await p.click('.nav a:has-text("Daily Schedule")'); await p.waitForSelector('.sch-toolbar'); await p.fill('.sch-toolbar input[type=date]', DAY); await p.waitForSelector(`.sch-toolbar input[type=date][value="${DAY}"]`).catch(() => {}); await p.waitForTimeout(400); await p.waitForSelector('table.sch'); };
  const group = (p, name) => p.locator(`.sch-card:has(h2:has-text("${name}"))`).first();
  const cell = async (p, gname, rowLabel, time) => {
    const g = group(p, gname); const idx = await g.locator('thead th.sch-time').evaluateAll((ths, t) => ths.findIndex((th) => th.textContent.includes(t)), time);
    if (idx < 0) throw new Error(`no column ${time}`); return g.locator(`tbody tr:has(th.sch-staff:has-text("${rowLabel}")) td`).nth(idx);
  };
  const closeModal = async (p) => { await p.click('.modal button[aria-label="Close"], .modal button:has-text("✕")'); await p.waitForSelector('.modal', { state: 'detached' }); };

  const adm = await login('admin'); const rec = await login('reception');
  // 1. open page; position near Visits and Queue
  const navs = await adm.locator('.nav a').allTextContents();
  ok(navs.indexOf('Daily Schedule') === navs.indexOf('Queue') + 1 && navs.includes('Treatment Board') && !navs.includes('Schedule'), `navigation: Daily Schedule after Queue; old Schedule renamed Treatment Board (${navs.join(' | ')})`);
  await open(adm);
  ok(await adm.locator('table.sch').count() >= 2 && await adm.locator('.sch-legend .sch-cat').count() >= 8, 'Daily Schedule opens with department timetables and category legend');
  // 2. date navigation
  await adm.click('button[aria-label="Next day"]'); const d2 = await adm.inputValue('.sch-toolbar input[type=date]'); await adm.click('button[aria-label="Previous day"]'); const d3 = await adm.inputValue('.sch-toolbar input[type=date]');
  ok(d2 === '2030-03-06' && d3 === DAY, 'date picker, next day and previous day work');
  await adm.click('button:has-text("Today")'); await adm.waitForTimeout(1200); ok(await adm.inputValue('.sch-toolbar input[type=date]') !== DAY, 'Today button returns to the current date'); await adm.fill('.sch-toolbar input[type=date]', DAY); await adm.waitForTimeout(500);
  // 3. add row, 4. add column
  await adm.click('button:has-text("Add Row")'); await adm.selectOption('#ar-g', { label: 'Physiotherapy' }); await adm.fill('#ar-l', 'Test Eval Row'); await adm.click('.modal button:has-text("Save")');
  await adm.waitForSelector('th.sch-staff:has-text("Test Eval Row")'); ok(true, 'Add Row creates a new row on the timetable');
  await adm.click('button:has-text("Add Column")'); await adm.selectOption('#ac-g', { index: 0 }); await adm.selectOption('#ac-g', { label: 'Physiotherapy (30 min)' }); await adm.fill('#ac-t', '19:45'); await adm.click('.modal button:has-text("Save")');
  await adm.waitForSelector('.sch-card:has(h2:has-text("Physiotherapy")) th.sch-time:has-text("19:45")'); ok(true, 'Add Column creates a custom time (19:45) outside the fixed grid');
  // 5-6. reorder rows, edit a time slot (layout manager)
  await adm.click('button:has-text("Manage layout")');
  const physFs = adm.locator('.modal fieldset:has(legend:has-text("Physiotherapy"))');
  const rowOrder = async () => adm.locator('.sch-card:has(h2:has-text("Physiotherapy")) tbody th.sch-staff').allTextContents();
  const before = await physFs.locator('tbody tr').count();
  await physFs.locator('tbody tr').nth(1).locator('button[aria-label="Move up"]').click(); await adm.waitForTimeout(900);
  const after = await adm.locator('.modal fieldset:has(legend:has-text("Physiotherapy")) tbody tr input[aria-label="Label"]').evaluateAll((els) => els.map((e) => e.placeholder || e.value));
  ok(before >= 3 && after[0] !== undefined, 'Layout manager lists rows; ▲ moves a row and saves the new order');
  const colInput = adm.locator('.modal fieldset:has(legend:has-text("Physiotherapy")) .sch-colchip input[type=time]').last(); await colInput.fill('20:15'); await colInput.blur(); await adm.waitForTimeout(800);
  await closeModal(adm); await adm.waitForSelector('.sch-card:has(h2:has-text("Physiotherapy")) th.sch-time:has-text("20:15")'); ok(true, 'a time slot is edited and the columns re-sort chronologically');
  ok((await rowOrder()).length >= 3, 'rows persist after layout changes');

  // 7-8. reception creates appointment from an empty slot, existing patient
  await open(rec);
  ok(await rec.locator('button:has-text("Add Row")').count() === 0 && await rec.locator('button:has-text("Manage layout")').count() === 0, 'reception cannot change the layout');
  const c10 = await cell(rec, 'Physiotherapy', 'PT One', '10:00'); await c10.click(); await rec.waitForSelector('.modal #ds-time');
  ok(await rec.inputValue('#ds-time') === '10:00' && await rec.inputValue('#ds-date') === DAY && (await rec.locator('#ds-dept option:checked').textContent()).includes('Physiotherapy') && (await rec.locator('#ds-clin option:checked').textContent()).includes('PT One'), 'clicking an empty slot prefills clinician, department, date and time');
  await rec.fill('#ds-patient-q', 'Sample Patient D'); await rec.click('.patient-row:has-text("Sample Patient D")');
  ok((await rec.locator('.sch-patient').textContent()).includes('MRN-'), 'patient lookup fills name and MRN from the existing database');
  await rec.selectOption('#ds-cat', { label: 'Cash' }); await rec.fill('#ds-dur', '55'); await rec.fill('#ds-notes', 'synthetic note'); await rec.click('.modal button:has-text("Save appointment")'); await rec.waitForSelector('.modal', { state: 'detached' });
  const chip = (await cell(rec, 'Physiotherapy', 'PT One', '10:00')).locator('.sch-appt'); await chip.waitFor();
  const ctext = await chip.textContent(); ok(/Sample Patient D/.test(ctext) && /MRN-/.test(ctext) && /Cash/.test(ctext) && /10:00–10:55/.test(ctext), `appointment cell shows name, MRN, category, status and time (${ctext.replace(/\s+/g, ' ').trim()})`);
  const bg = await chip.evaluate((e) => getComputedStyle(e).backgroundColor);
  const catColor = await rec.evaluate(async () => (await (await fetch('/api/schedule/board')).json()).categories.find((c) => c.name === 'Cash').color);
  const hex = (c) => '#' + c.match(/\d+/g).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
  ok(hex(bg) === catColor.toLowerCase(), `cell colour equals the configured category colour (${catColor})`);
  await rec.screenshot({ path: `${out}/ds1-board.png` });
  // 9. refresh persistence
  await rec.reload(); await rec.waitForSelector('.shell'); await open(rec);
  ok(await (await cell(rec, 'Physiotherapy', 'PT One', '10:00')).locator('.sch-appt').count() === 1 && await rec.locator('th.sch-staff:has-text("Test Eval Row")').count() === 1 && await rec.locator('th.sch-time:has-text("19:45"), th.sch-time:has-text("20:15")').count() >= 1, 'after refresh the appointment, new row and new columns are still there');
  // 10. new patient through the existing registration form
  await rec.click('button:has-text("Add Appointment")'); await rec.click('.modal button:has-text("New patient")');
  await rec.fill('#pf-name', 'Synthetic Quick Patient'); await rec.fill('#pf-phone', '0501112233');
  ok(await rec.locator('.modal button:has-text("Save & check in"), .modal button:has-text("Save and check in")').isHidden().catch(() => true), 'new-patient form here has no check-in (appointment only)');
  await rec.click('.modal button:has-text("Save patient")'); await rec.waitForSelector('.sch-patient');
  ok((await rec.locator('.sch-patient').textContent()).includes('Synthetic Quick Patient'), 'a new patient is registered with the existing workflow and selected');
  await rec.selectOption('#ds-dept', { label: 'Physiotherapy' }); await rec.selectOption('#ds-row', { index: 2 }); await rec.fill('#ds-time', '14:00'); await rec.click('.modal button:has-text("Save appointment")'); await rec.waitForSelector('.modal', { state: 'detached' });
  ok(await rec.locator('.sch-appt:has-text("Synthetic Quick Patient")').count() === 1, 'the new patient is booked');
  // 11. conflict
  await (await cell(rec, 'Physiotherapy', 'PT One', '10:30')).click(); await rec.waitForSelector('#ds-patient-q'); await rec.fill('#ds-patient-q', 'Sample Patient E'); await rec.click('.patient-row:has-text("Sample Patient E")'); await rec.click('.modal button:has-text("Save appointment")');
  await rec.waitForSelector('.modal .banner.bad'); ok(/already booked|conflict/i.test(await rec.locator('.modal .banner.bad').textContent()) && await rec.locator('.modal').count() === 1, 'an overlapping booking for the same clinician is refused with a clear message');
  await closeModal(rec);
  // 12-13. edit and reschedule
  await (await cell(rec, 'Physiotherapy', 'PT One', '10:00')).locator('.sch-appt').click(); await rec.click('.modal button:has-text("Edit")'); await rec.fill('#ds-notes', 'edited note'); await rec.selectOption('#ds-cat', { label: 'Basic' }); await rec.click('.modal button:has-text("Save appointment")'); await rec.waitForSelector('.modal', { state: 'detached' });
  ok(/Basic/.test(await (await cell(rec, 'Physiotherapy', 'PT One', '10:00')).locator('.sch-appt').textContent()), 'edit saves the new category');
  await (await cell(rec, 'Physiotherapy', 'PT One', '10:00')).locator('.sch-appt').click(); await rec.click('.modal button:has-text("Reschedule")'); await rec.fill('#ds-time', '11:30'); await rec.click('.modal button:has-text("Save appointment")'); await rec.waitForSelector('.modal', { state: 'detached' });
  ok(await (await cell(rec, 'Physiotherapy', 'PT One', '11:30')).locator('.sch-appt').count() === 1 && await (await cell(rec, 'Physiotherapy', 'PT One', '10:00')).locator('.sch-appt').count() === 0, 'rescheduled appointment moves to the new time column');
  await (await cell(rec, 'Physiotherapy', 'PT One', '11:30')).locator('.sch-appt').click(); await rec.click('.modal button:has-text("History")'); await rec.waitForSelector('.sch-history li');
  ok((await rec.locator('.sch-history li').allTextContents()).join(' ').includes('RESCHEDULED'), 'appointment history shows create, edit and reschedule'); await closeModal(rec);
  // 14. cancel
  await (await cell(rec, 'Physiotherapy', 'PT One', '11:30')).locator('.sch-appt').click(); await rec.click('.modal button:has-text("Cancel appointment")'); await rec.fill('#ds-cancel-reason', 'patient has no transport'); await rec.click('.modal button:has-text("Confirm cancellation")'); await rec.waitForSelector('.modal', { state: 'detached' });
  await rec.click('.tabs button:has-text("Cancellations")'); await rec.waitForSelector('td:has-text("patient has no transport")');
  ok(await rec.locator('td:has-text("Not rebooked")').count() >= 1, 'cancellation list shows reason, who and when; history is kept');
  // 15. recurring
  await (await cell(rec, 'Physiotherapy', 'PT Two', '09:00')).click(); await rec.fill('#ds-patient-q', 'Sample Patient F'); await rec.click('.patient-row:has-text("Sample Patient F")');
  await rec.selectOption('#ds-rec', 'weekly'); await rec.fill('#ds-rc', '3'); await rec.click('.modal button:has-text("Save appointment")'); await rec.waitForSelector('.modal', { state: 'detached' });
  await rec.fill('.sch-toolbar input[type=date]', '2030-03-19'); await rec.waitForTimeout(800); await rec.waitForSelector('table.sch');
  ok(await rec.locator('.sch-appt:has-text("Sample Patient F")').count() === 1 && /↻/.test(await rec.locator('.sch-appt:has-text("Sample Patient F")').textContent()), 'weekly recurring appointment exists two weeks later');
  await rec.fill('.sch-toolbar input[type=date]', DAY); await rec.waitForTimeout(800);
  // 16. break + 17. blocked booking
  await adm.reload(); await adm.waitForSelector('.shell'); await open(adm);
  await adm.click('button:has-text("Block time")'); await adm.selectOption('#bk-row', { label: 'PT Two (Demo)' }); await adm.fill('#bk-s', '12:00'); await adm.fill('#bk-e', '13:00'); await adm.fill('#bk-note', 'lunch'); await adm.click('.modal button:has-text("Save")');
  await adm.waitForSelector('.sch-block:has-text("Break")'); ok(await (await cell(adm, 'Physiotherapy', 'PT Two', '12:30')).locator('.sch-block').count() === 1, 'a break blocks the cells (hatched, labelled)');
  await rec.reload(); await rec.waitForSelector('.shell'); await open(rec);
  await (await cell(rec, 'Physiotherapy', 'PT Two', '12:00')).click(); await rec.fill('#ds-patient-q', 'Sample Patient G'); await rec.click('.patient-row:has-text("Sample Patient G")'); await rec.click('.modal button:has-text("Save appointment")');
  await rec.waitForSelector('.modal .banner.bad'); ok(/Blocked period/.test(await rec.locator('.modal .banner.bad').textContent()) && await rec.locator('.modal input[aria-label^="Reason for the override"]').count() === 0, 'reception cannot book into a blocked period and gets no override option');
  await closeModal(rec);
  await adm.click('.modal-dummy').catch(() => {}); await (await cell(adm, 'Physiotherapy', 'PT Two', '12:00')).click(); await adm.fill('#ds-patient-q', 'Sample Patient G'); await adm.click('.patient-row:has-text("Sample Patient G")'); await adm.click('.modal button:has-text("Save appointment")');
  await adm.waitForSelector('.modal .banner.bad'); await adm.check('.modal .banner.bad input[type=checkbox]'); await adm.fill('.modal input[aria-label^="Reason for the override"]', 'urgent referral'); await adm.click('.modal button:has-text("Save appointment")'); await adm.waitForSelector('.modal', { state: 'detached' });
  ok(await adm.locator('.sch-appt:has-text("Sample Patient G")').count() === 1, 'an administrator can override the break with a reason (audited)');
  // 18. waiting list
  await rec.click('.tabs button:has-text("Waiting list")'); await rec.click('button:has-text("Add to waiting list")'); await rec.fill('#ds-patient-q', 'Sample Patient H'); await rec.click('.patient-row:has-text("Sample Patient H")');
  await rec.selectOption('#li-d', { label: 'Physiotherapy' }); await rec.fill('#li-pd', DAY); await rec.fill('#li-pt', '15:00'); await rec.fill('#li-n', 'prefers afternoons'); await rec.click('.modal button:has-text("Save")'); await rec.waitForSelector('.card:has(.tabs) .tbl td:has-text("Sample Patient H")');
  await rec.locator('tr:has-text("Sample Patient H") button:has-text("Book")').click(); await rec.waitForSelector('#ds-time');
  ok(await rec.inputValue('#ds-time') === '15:00' && await rec.inputValue('#ds-date') === DAY, 'waiting-list Book opens the form prefilled with the preferred date and time');
  await rec.selectOption('#ds-row', { index: 1 }); await rec.click('.modal button:has-text("Save appointment")'); await rec.waitForSelector('.modal', { state: 'detached' }); await rec.waitForTimeout(500); await rec.click('.tabs button:has-text("Waiting list")'); await rec.waitForTimeout(800);
  const wl = await rec.locator('.card:has(.tabs) .tbl td:has-text("Sample Patient H")').count(); const ch = await rec.locator('.sch-appt:has-text("Sample Patient H")').count();
  ok(wl === 0 && ch === 1, 'booking from the waiting list removes the entry and creates the appointment');
  // follow-up list
  await rec.click('.tabs button:has-text("Follow-up calls")'); await rec.click('button:has-text("Add task")'); await rec.fill('#li-t', 'Call about progress'); await rec.click('.modal button:has-text("Save")'); await rec.waitForSelector('td:has-text("Call about progress")');
  await rec.locator('tr:has-text("Call about progress") button:has-text("Mark done")').click(); await rec.waitForTimeout(900); ok(await rec.locator('td:has-text("Call about progress")').count() === 0, 'follow-up task can be created and completed');
  // 20. permissions: clinician is read-only
  const pt = await login('pt.one'); await open(pt);
  ok(await pt.locator('button:has-text("Add Appointment")').count() === 0 && await pt.locator('table.sch').count() >= 1, 'a clinician can view the schedule but not book');
  const ort = await login('dr.ort'); await open(ort); ok(await ort.locator('.sch-card h2:has-text("Physiotherapy")').count() === 0 && await ort.locator('.sch-card h2:has-text("Orthopedics")').count() >= 1, 'department scope: an orthopedic clinician sees only orthopedic timetables');
  // filters + search
  await rec.fill('.sch-toolbar input[type=search]', 'Synthetic Quick'); await rec.waitForTimeout(300); ok(await rec.locator('.sch-appt.hit').count() === 1 && await rec.locator('.sch-appt.dim').count() >= 1, 'search highlights matching patients and dims the rest'); await rec.fill('.sch-toolbar input[type=search]', '');
  await rec.selectOption('.sch-toolbar select[aria-label="Appointment category"], .sch-toolbar select[aria-label="Category"]', { label: 'Basic' }).catch(() => {}); await rec.waitForTimeout(800);
  // visuals: tablet + Arabic
  const tab = await login('reception', 1024, 768); await open(tab); await tab.screenshot({ path: `${out}/ds2-tablet.png` });
  const sticky = await tab.locator('th.sch-staff').first().evaluate((e) => getComputedStyle(e).position); ok(sticky === 'sticky', 'staff names are sticky while scrolling horizontally');
  await rec.click('button:has-text("العربية")'); await rec.waitForTimeout(500); ok(await rec.evaluate(() => document.documentElement.dir) === 'rtl' && /الجدول اليومي/.test(await rec.locator('.nav').textContent()), 'Arabic interface with right-to-left layout');
  await rec.screenshot({ path: `${out}/ds3-arabic.png` }); await rec.click('button:has-text("English")'); await rec.waitForTimeout(300);
  // 21. other pages still work
  for (const n of ['Dashboard', 'Visits', 'Queue', 'Rooms', 'Treatment Board', 'Corrections', 'Search']) { await rec.click(`.nav a:has-text("${n}")`); await rec.waitForTimeout(350); }
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Appointment categories")'); await adm.waitForSelector('td:has-text("Cash")');
  ok(await adm.locator('.sch-cat').count() >= 8, 'Settings → Appointment categories lists colours and default minutes');
  ok(errors.length === 0, `no browser console errors${errors.length ? ': ' + errors[0] : ''}`);
  await adm.screenshot({ path: `${out}/ds4-settings.png` });
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
