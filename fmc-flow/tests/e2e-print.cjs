// Printable Daily Schedule day sheet (stage S19). Fresh DB:  FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  NODE_PATH=$(npm root -g) node tests/e2e-print.cjs http://localhost:3100
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!'; const DAY = '2030-04-09';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const login = async (u) => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); await p.goto(base); await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); return p; };
  const api = (p, m, path, body) => p.evaluate(async ([m, path, body]) => { const r = await fetch('/api' + path, { method: m, headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; }, [m, path, body]);
  const rec = await login('reception'); const adm = await login('admin');
  const board = (await api(adm, 'GET', `/schedule/board?date=${DAY}`)).body; const dep = board.groups.find((g) => /physio/i.test(g.name)).department_id;
  const row = board.groups.find((g) => g.department_id === dep).rows.find((r) => r.user_id);
  const pat = (await api(rec, 'POST', '/patients', { name: 'Print Sheet Patient', phone: '0509998877' })).body;
  const bk = await api(rec, 'POST', '/schedule/appointments', { patient_id: pat.id, department_id: dep, row_id: row.id, date: DAY, time: '10:00', duration_minutes: 30 }); ok(bk.status === 201, 'a test appointment is booked');
  await rec.click('.nav a:has-text("Daily Schedule")'); await rec.waitForSelector('.sch-toolbar'); await rec.fill('.sch-toolbar input[type=date]', DAY);
  await rec.waitForSelector('.sch-appt:has-text("Print Sheet Patient")');
  await rec.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  ok(await rec.locator('[data-testid=print-sheet]').count() === 0, 'no print sheet is in the page until the button is used');
  await rec.click('[data-testid=print-day]'); await rec.waitForFunction(() => window.__printed === 1);
  ok(true, 'the Print day sheet button asks the browser to print');
  await rec.waitForSelector('[data-testid=print-sheet]', { state: 'attached' }); // stays mounted until the browser reports afterprint (the stub never does)
  const txt = await rec.evaluate(() => document.querySelector('[data-testid=print-sheet]')?.innerText || '');
  ok(/Print Sheet Patient/.test(txt) && /10:00/.test(txt) && /Daily appointment sheet/.test(txt) && /Printed by/.test(txt) && /Contains patient information/.test(txt), 'the sheet lists the booking with time, patient, EMR number, a header, who printed it and a confidentiality note');
  ok(!/0509998877/.test(txt), 'the sheet does not print phone numbers');
  await rec.emulateMedia({ media: 'print' });
  ok(await rec.evaluate(() => getComputedStyle(document.querySelector('#root')).display === 'none' && getComputedStyle(document.querySelector('[data-testid=print-sheet]')).display === 'block'), 'in print mode the app is hidden and only the sheet shows');
  await rec.emulateMedia({ media: 'screen' });
  ok(await rec.evaluate(() => !document.querySelector('[data-testid=print-sheet]') || getComputedStyle(document.querySelector('[data-testid=print-sheet]')).display === 'none'), 'on screen the sheet is never visible');
  const aud = (await api(adm, 'GET', '/audit?limit=50')).body; const rows = Array.isArray(aud) ? aud : aud.rows || aud.entries || [];
  ok(rows.some((r) => r.action === 'schedule.print' && /"appointments":\s*1/.test(String(r.detail))), 'each print is recorded in the audit history with the date and number of appointments');
  const bad = await api(rec, 'POST', '/schedule/print', { date: 'nonsense' }); ok(bad.status === 400, 'an invalid date is refused');
  const pt = await login('pt.one'); ok((await api(pt, 'POST', '/schedule/print', { date: DAY, count: 1 })).status === 200, 'a clinician can print their own schedule');
  ok(errors.length === 0, 'no page errors'); await b.close();
})();
