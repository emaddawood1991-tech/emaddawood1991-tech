// Browser test of role templates and the permission matrix (stage S5). Fresh synthetic DB:
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-roles.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const newPage = async () => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); await p.goto(base); return p; };
  const signIn = async (p, u, pw) => { await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', pw); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell'); };
  const adm = await newPage(); await signIn(adm, 'admin', PW);
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Security & Access")'); await adm.click('.tabs button:has-text("Roles & Permissions")');
  await adm.waitForSelector('[data-testid=tpl-physiotherapist]');
  ok(await adm.locator('[data-testid^=tpl-]').count() === 7, 'the seven role templates are listed');
  ok(/Super Administrator/.test(await adm.locator('[data-testid=tpl-super_admin]').textContent()) && /Other authorized clinical staff/.test(await adm.locator('[data-testid=tpl-other_clinical]').textContent()), 'template names match the requested roles');
  ok(await adm.locator('tr:has-text("GET /api/visits/:id/timeline")').count() === 1, 'the endpoint table is read from the running server');
  await adm.fill('input[placeholder="Search"]', 'documentation'); ok(await adm.locator('tr:has-text("session.run")').count() >= 1, 'the endpoint list can be filtered');
  await adm.screenshot({ path: `${out}/r1-templates.png`, fullPage: true });
  // create a physiotherapist through a template
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Staff")');
  await adm.click('button:has-text("＋ Add")');
  await adm.locator('.modal input').nth(0).fill('new.physio'); await adm.locator('.modal input').nth(1).fill('New Physio (Demo)');
  await adm.selectOption('[data-testid=staff-template]', { label: 'Physiotherapist' });
  ok((await adm.locator('.modal select >> nth=1').inputValue()) === 'clinician', 'choosing a template sets the enforced role');
  await adm.fill('.modal input[type=password]', 'Str0ng-Pass-Phrase-77');
  await adm.click('.modal button:has-text("Save")'); await adm.waitForTimeout(600);
  ok(await adm.locator('.modal').count() > 0, 'a physiotherapist without a department is refused');
  await adm.selectOption('.modal label:has-text("Department") select', { label: 'Orthopedics' }); await adm.click('.modal button:has-text("Save")'); await adm.waitForTimeout(600);
  ok(await adm.locator('.modal').count() > 0, 'a physiotherapist in the wrong department is refused');
  await adm.selectOption('.modal label:has-text("Department") select', { label: 'Physiotherapy' }); await adm.click('.modal button:has-text("Save")'); await adm.waitForSelector('.modal', { state: 'detached' });
  await adm.waitForSelector('tr:has-text("new.physio")'); ok(/Physiotherapist/.test(await adm.locator('tr:has-text("new.physio")').textContent()), 'the new account shows its template');
  await adm.screenshot({ path: `${out}/r2-staff.png` });
  // other roles cannot see the matrix, and the URL cannot be forced
  const rec = await newPage(); await signIn(rec, 'reception', PW);
  const st = await rec.evaluate(async () => (await fetch('/api/security/permissions')).status); ok(st === 403, 'reception cannot read the permission matrix by calling the URL');
  const pt = await newPage(); await signIn(pt, 'pt.one', PW);
  const codes = await pt.evaluate(async () => { const g = async (u) => (await fetch(u)).status; return [await g('/api/reports'), await g('/api/audit'), await g('/api/health'), await g('/api/security/accounts'), await g('/api/visits/1/timeline')]; });
  ok(codes.slice(0, 4).every((c) => c === 403), `physiotherapist is refused reports, audit, health and accounts (${codes.slice(0, 4)})`);
  ok(errors.filter((e) => !/40[13]|Forbidden|Unauthorized/.test(e)).length === 0, `no browser console errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})();
