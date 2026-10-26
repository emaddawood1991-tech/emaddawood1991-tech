// Baseline UI test for Settings (departments, rooms, services, policy) and Reports. node tests/e2e-settings-reports.cjs http://localhost:3100  (fresh synthetic DB)
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(base); await p.fill('input[autocomplete=username]', 'admin'); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell');
  const api = (path) => p.evaluate(async (x) => (await (await fetch('/api' + x)).json()), path);
  await p.click('.nav a:has-text("Settings")'); await p.waitForSelector('.tabs');
  // departments
  await p.click('.tabs button:has-text("Departments")'); await p.click('button:has-text("Add")');
  const inputs = p.locator('.modal input[type=text], .modal input:not([type])'); await inputs.nth(0).fill('Synthetic Test Department'); await inputs.nth(2).fill('Z');
  await p.click('.modal button:has-text("Save")'); await p.waitForSelector('tr:has-text("Synthetic Test Department")');
  ok((await api('/config')).departments.some((d) => d.name === 'Synthetic Test Department' && d.queue_prefix === 'Z'), 'Settings → Departments: create department persists');
  await p.click('tr:has-text("Synthetic Test Department") button:has-text("Edit")'); await p.locator('.modal label.chk:has-text("Active") input').uncheck(); await p.click('.modal button:has-text("Save")'); await p.waitForTimeout(500);
  ok((await api('/config')).departments.find((d) => d.name === 'Synthetic Test Department').active === 0, 'Settings → Departments: deactivate keeps the record (no delete)');
  // rooms
  await p.click('.tabs button:has-text("Rooms")'); await p.waitForSelector('text=Stations');
  ok(await p.locator('tr:has-text("PT-HALL-01")').count() > 0 && await p.locator('tr:has-text("BED-06")').count() > 0, 'Settings → Rooms: rooms and treatment stations listed');
  await p.locator('.card:has(h2:has-text("Rooms")) >> button:has-text("Add")').first().click();
  await p.locator('.modal select').first().selectOption({ label: 'Physiotherapy' }); const ri = p.locator('.modal input[type=text], .modal input:not([type])'); await ri.nth(0).fill('PT-TEST-9'); await ri.nth(1).fill('Synthetic Test Room');
  await p.click('.modal button:has-text("Save")'); await p.waitForSelector('tr:has-text("PT-TEST-9")');
  ok((await api('/config')).rooms.some((r) => r.code === 'PT-TEST-9'), 'Settings → Rooms: create room persists');
  // services + authorization view
  await p.click('.tabs button:has-text("Services")'); await p.waitForSelector('text=Authorized clinicians');
  ok(await p.locator('tr:has-text("PT Treatment")').textContent().then((t) => t.includes('PT One')), 'Settings → Services: shows authorized clinicians');
  // policy
  await p.click('.tabs button:has-text("Policy")'); await p.locator('label.chk:has-text("Service required at check-in") input').click(); await p.waitForFunction(() => [...document.querySelectorAll('label.chk')].find((l) => l.textContent.includes('Service required at check-in'))?.querySelector('input').checked, null, { timeout: 4000 });
  ok((await api('/config')).settings.require_service_at_checkin === '1', 'Settings → Policy: toggle saved');
  await p.locator('label.chk:has-text("Service required at check-in") input').click(); await p.waitForTimeout(500);
  // reports
  await p.click('.nav a:has-text("Reports")'); await p.waitForSelector('.kpis');
  const kpis = await p.locator('.kpi').allTextContents(); ok(kpis.length >= 6 && await p.locator('button:has-text("Export CSV")').count() === 1, `Reports: KPIs and CSV export render (${kpis.length} tiles)`);
  const rep = await api('/reports'); ok(typeof rep.visits === 'number' && Array.isArray(rep.by_room), 'Reports: API returns real aggregates');
  ok(errs.length === 0, 'no browser console errors'); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
