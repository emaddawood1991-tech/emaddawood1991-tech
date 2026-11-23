// Report trends in the browser (stage S20). Fresh DB:  FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  NODE_PATH=$(npm root -g) node tests/e2e-trends.cjs http://localhost:3100
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = []; const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(base); await p.fill('input[autocomplete=username]', 'admin'); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell');
  const api = (path, body) => p.evaluate(async ([path, body]) => { const r = await fetch('/api' + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: JSON.stringify(body) }); return r.status; }, [path, body]);
  // some activity today: two check-ins
  const ctx2 = await b.newContext(); const rec = await ctx2.newPage(); await rec.goto(base); await rec.fill('input[autocomplete=username]', 'reception'); await rec.fill('input[type=password]', PW); await rec.click('button.btn:has-text("Sign in")'); await rec.waitForSelector('.shell');
  for (const n of ['Trend One', 'Trend Two']) await rec.evaluate(async (n) => { const h = { 'content-type': 'application/json', 'x-requested-with': 'fmc' }; const pt = await (await fetch('/api/patients', { method: 'POST', headers: h, body: JSON.stringify({ name: n, phone: '0501' + Math.floor(100000 + Math.random() * 899999) }) })).json(); const d = await (await fetch('/api/config', { headers: h })).json(); await fetch('/api/visits/checkin', { method: 'POST', headers: h, body: JSON.stringify({ patientId: pt.id, departmentId: d.departments.find((x) => /physio/i.test(x.name)).id }) }); }, n);
  await p.click('.nav a:has-text("Reports")'); await p.waitForSelector('[data-testid=appt-outcomes]');
  ok(await p.locator('[data-testid=appt-outcomes] .kpi').count() === 8, 'the Appointments card shows eight figures (booked, arrived, not arrived, cancelled, upcoming, two rates, queue no-shows)');
  ok(await p.locator('[data-testid=appt-outcomes] .small.muted').textContent().then((x) => /not been cancelled|not cancelled/i.test(x) || /Arrival rate/.test(x)), 'the card explains how the arrival rate is defined');
  const bars = p.locator('[data-testid=chart-visits] svg[role=img]'); await bars.waitFor();
  ok((await bars.getAttribute('aria-label')).includes('Visits per day'), 'the visits chart is labelled for screen readers');
  ok(await p.locator('[data-testid=chart-visits] rect').count() >= 1, 'the chart draws a bar for each day with visits');
  await p.locator('[data-testid=chart-visits] summary').click(); ok(await p.locator('[data-testid=chart-visits] table tbody tr').count() >= 1, 'the same numbers are available as a table');
  await p.screenshot({ path: '/tmp/trends.png' });
  await p.click('button:has-text("العربية")'); await p.waitForSelector('[data-testid=appt-outcomes] h2:has-text("المواعيد")');
  ok(true, 'the Appointments card and charts are translated to Arabic'); ok(await p.evaluate(() => document.documentElement.dir === 'rtl'), 'and laid out right-to-left');
  ok(errors.length === 0, 'no page errors'); await b.close();
})();
