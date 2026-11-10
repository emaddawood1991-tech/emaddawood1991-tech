// Browser test of two-step verification (stage S3). Server MUST run with FMC_TEST_CLOCK=1 on a fresh synthetic DB:
//   FMC_TEST_CLOCK=1 FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-mfa.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright'); const OTPAuth = require('otpauth');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const newPage = async () => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load|status of 4\d\d/.test(m.text()) && errors.push(m.text())); await p.goto(base); return p; };
  const signIn = async (p, u, pw) => { await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', pw); await p.click('button.btn:has-text("Sign in")'); };
  const adm = await newPage(); await signIn(adm, 'admin', PW); await adm.waitForSelector('.shell');
  const advance = (m) => adm.evaluate(async (x) => (await fetch('/api/__test/advance-clock', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: JSON.stringify({ minutes: x }) })).status, m);
  const code = async (secret) => { const ts = await adm.evaluate(async () => Date.parse((await (await fetch('/api/time')).json()).server_time)); return new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) }).generate({ timestamp: ts }); };
  const step = () => advance(31 / 60); // a new 30-second time step (the one-time code cannot be reused)

  // administrator requires two-step for supervisors (Security Settings)
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Security & Access")'); await adm.click('.tabs button:has-text("Security Settings")');
  await adm.locator('label.chk:has-text("supervisor") input').check(); await adm.click('.card button:has-text("Save")'); await adm.waitForSelector('.toast:has-text("Saved")');
  ok(true, 'administrator can require two-step verification for a role');

  // supervisor: forced set-up on first sign-in
  const s1 = await newPage(); await signIn(s1, 'super', PW); await s1.waitForSelector('#mfa-confirm-code');
  ok(await s1.locator('.shell').count() === 0 && await s1.locator('svg').count() >= 1 && /requires two-step/.test(await s1.locator('.box').textContent()), 'a required role sees only the set-up screen, with a QR code');
  await s1.locator('details summary').click(); const secret = (await s1.locator('#mfa-secret').textContent()).replace(/\s/g, ''); ok(/^[A-Z2-7]{32}$/.test(secret), 'the manual-entry key is shown');
  await s1.screenshot({ path: `${out}/mfa1-setup.png` });
  await s1.fill('#mfa-confirm-code', '000000'); await s1.click('button:has-text("Turn on")'); await s1.waitForSelector('.field-err'); ok(true, 'a wrong code is refused');
  await s1.fill('#mfa-confirm-code', await code(secret)); await s1.click('button:has-text("Turn on")'); await s1.waitForSelector('ul li');
  const rc = await s1.locator('ul li').allTextContents(); ok(rc.length === 10 && rc.every((c) => /^[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(c)), 'ten recovery codes are shown once');
  ok(await s1.locator('button:has-text("Finish")').isDisabled(), 'Finish stays disabled until the codes are acknowledged'); await s1.screenshot({ path: `${out}/mfa2-codes.png` });
  await s1.check('label.chk input'); await s1.click('button:has-text("Finish")'); await s1.waitForSelector('.shell'); ok(true, 'after set-up the application opens');

  // two-step sign-in
  await step(); await s1.click('button:has-text("Sign out")'); await s1.waitForSelector('input[autocomplete=username]');
  await signIn(s1, 'super', PW); await s1.waitForSelector('#mfa-code'); ok(await s1.locator('.shell').count() === 0, 'after the password, the code is requested before any access');
  await s1.screenshot({ path: `${out}/mfa3-challenge.png` });
  await s1.fill('#mfa-code', '123456'); await s1.click('button:has-text("Verify")'); await s1.waitForSelector('.field-err'); ok(true, 'a wrong code does not sign in');
  const c1 = await code(secret); await s1.fill('#mfa-code', c1); await s1.click('button:has-text("Verify")'); await s1.waitForSelector('.shell'); ok(true, 'the correct code signs in');
  await s1.click('button:has-text("Sign out")'); await s1.waitForSelector('input[autocomplete=username]'); await signIn(s1, 'super', PW); await s1.waitForSelector('#mfa-code');
  await s1.fill('#mfa-code', c1); await s1.click('button:has-text("Verify")'); await s1.waitForSelector('.field-err'); ok(true, 'the same code cannot be used twice');
  // recovery code
  await s1.click('button:has-text("Use a recovery code instead")'); await s1.fill('#mfa-code', rc[0].toLowerCase()); await s1.click('button:has-text("Verify")'); await s1.waitForSelector('.shell'); ok(true, 'a recovery code signs in');
  await s1.click('.nav a:has-text("My Account")'); await s1.waitForSelector('h2:has-text("Two-step verification")');
  ok(/On/.test(await s1.locator('.card:has(h2:has-text("Two-step verification"))').textContent()) && /9/.test(await s1.locator('.card:has(h2:has-text("Two-step verification"))').textContent()) && await s1.locator('button:has-text("Turn off")').count() === 0, 'My Account shows it on, 9 recovery codes left, and no way to turn it off for a required role');
  await s1.screenshot({ path: `${out}/mfa4-account.png` });

  // administrator view and reset
  await adm.reload(); await adm.waitForSelector('.shell'); await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Security & Access")'); await adm.waitForSelector('tr:has-text("Supervisor")');
  ok(/On/.test(await adm.locator('tr:has-text("Supervisor (Demo)")').textContent()), 'Employee accounts shows who has two-step on');
  await adm.locator('tr:has-text("Supervisor (Demo)") button:has-text("Reset two-step")').click(); await adm.click('.modal button:has-text("Reset two-step")'); await adm.waitForSelector('.modal', { state: 'detached' });
  await s1.reload(); await s1.waitForSelector('input[autocomplete=username]'); await signIn(s1, 'super', PW); await s1.waitForSelector('#mfa-confirm-code'); ok(true, 'after an administrator reset the person must set it up again and old sessions ended');

  // voluntary enrolment for a role that does not require it, and turning it off
  const r1 = await newPage(); await signIn(r1, 'reception', PW); await r1.waitForSelector('.shell'); await r1.click('.nav a:has-text("My Account")'); await r1.click('button:has-text("Turn on two-step verification")');
  await r1.waitForSelector('#mfa-confirm-code'); await r1.locator('details summary').click(); const sec2 = (await r1.locator('#mfa-secret').textContent()).replace(/\s/g, '');
  await r1.fill('#mfa-confirm-code', await code(sec2)); await r1.click('.modal button:has-text("Turn on")'); await r1.waitForSelector('.modal ul li'); await r1.check('.modal label.chk input'); await r1.click('.modal button:has-text("Finish")'); await r1.waitForSelector('.modal', { state: 'detached' });
  await r1.waitForSelector('.chip:has-text("On")'); ok(true, 'anyone can turn two-step on voluntarily');
  await step(); await r1.click('button:has-text("Turn off")'); await r1.fill('#mfa-pw', PW); await r1.fill('#mfa-dis-code', await code(sec2)); await r1.click('.modal button:has-text("Turn off")'); await r1.waitForSelector('.modal', { state: 'detached' });
  await r1.waitForSelector('.chip:has-text("Off")'); ok(true, 'turning it off needs the password and a current code');
  ok(errors.length === 0, `no browser console errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
