// Browser test of account security (stage S2). Fresh synthetic DB:
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  node tests/e2e-account.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const newPage = async () => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/Failed to load|status of 4\d\d/.test(m.text()) && errors.push(m.text())); await p.goto(base); return p; };
  const signIn = async (p, u, pw) => { await p.fill('input[autocomplete=username]', u); await p.fill('input[type=password]', pw); await p.click('button.btn:has-text("Sign in")'); };
  const adm = await newPage(); await signIn(adm, 'admin', PW); await adm.waitForSelector('.shell');
  const TEMP = 'Temporary-Pass-77!', MINE = 'Violet-Harbor-42!', MINE2 = 'Maple-Canyon-88?';
  // administrator creates an account (Settings → Staff form)
  await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Staff")'); await adm.click('.card button:has-text("Add")');
  await adm.locator('.modal input').nth(0).fill('e2e.user'); await adm.locator('.modal input').nth(1).fill('E2E Account User');
  await adm.selectOption('.modal select >> nth=1', 'reception'); await adm.fill('.modal input[type=password]', 'aaaaaaaaaa'); await adm.click('.modal button:has-text("Save")');
  await adm.waitForSelector('.toast', { timeout: 5000 }).catch(() => {});
  ok(await adm.locator('.modal').count() === 1, 'a weak password is refused when an account is created');
  await adm.fill('.modal input[type=password]', TEMP); await adm.click('.modal button:has-text("Save")'); await adm.waitForSelector('.modal', { state: 'detached' });
  // first sign-in: forced password change
  const u1 = await newPage(); await signIn(u1, 'e2e.user', TEMP); await u1.waitForSelector('#pw-new');
  ok(await u1.locator('.shell').count() === 0 && /Choose your own password/.test(await u1.locator('.box').textContent()), 'first sign-in shows only the change-password screen (no application behind it)');
  await u1.screenshot({ path: `${out}/sa1-forced.png` });
  await u1.fill('#pw-current', TEMP); await u1.fill('#pw-new', 'aaaaaaaaaa'); await u1.fill('#pw-confirm', 'aaaaaaaaaa'); await u1.click('button:has-text("Save password")');
  await u1.waitForSelector('#pw-new ~ .field-err, .field-err'); ok(/simple|least|Mix/i.test(await u1.locator('.field-err').first().textContent()), 'a weak new password is refused with the reason');
  await u1.fill('#pw-new', MINE); await u1.fill('#pw-confirm', 'something-else-123'); ok(await u1.locator('button:has-text("Save password")').isDisabled(), 'mismatching confirmation blocks saving');
  await u1.fill('#pw-confirm', MINE); await u1.click('button:has-text("Save password")'); await u1.waitForSelector('.shell');
  ok(true, 'choosing a valid password opens the application');
  // My Account
  await u1.click('.nav a:has-text("My Account")'); await u1.waitForSelector('h2:has-text("Account details")');
  ok((await u1.locator('.card').first().textContent()).includes('e2e.user') && await u1.locator('.chip:has-text("This device")').count() === 1, 'My Account shows the details and marks this device');
  await u1.fill('#pw-current', 'not-my-password-1'); await u1.fill('#pw-new', MINE2); await u1.fill('#pw-confirm', MINE2); await u1.click('button:has-text("Save password")');
  await u1.waitForSelector('.field-err'); ok(/not correct/.test(await u1.locator('.field-err').first().textContent()), 'a wrong current password is refused');
  // second device
  const u2 = await newPage(); await signIn(u2, 'e2e.user', MINE); await u2.waitForSelector('.shell'); await u2.click('.nav a:has-text("My Account")'); await u2.waitForSelector('h2:has-text("Where you are signed in")');
  await u1.reload(); await u1.waitForSelector('.shell'); await u1.click('.nav a:has-text("My Account")'); await u1.waitForSelector('h2:has-text("Where you are signed in")'); await u1.waitForTimeout(500);
  ok(await u1.locator('.card:has(h2:has-text("Where you are signed in")) tbody tr').count() === 2, 'two devices are listed');
  await u1.screenshot({ path: `${out}/sa2-account.png` });
  await u1.click('button:has-text("Sign out all other devices")'); await u1.waitForTimeout(600);
  await u2.reload(); await u2.waitForSelector('input[autocomplete=username]'); ok(true, 'signing out other devices ends the second device’s session');
  // change password from My Account ends other sessions and rotates the token
  const u3 = await newPage(); await signIn(u3, 'e2e.user', MINE); await u3.waitForSelector('.shell');
  await u1.fill('#pw-current', MINE); await u1.fill('#pw-new', MINE2); await u1.fill('#pw-confirm', MINE2); await u1.click('button:has-text("Save password")'); await u1.waitForSelector('.toast:has-text("Password changed")');
  await u3.reload(); await u3.waitForSelector('input[autocomplete=username]'); ok(true, 'a password change signs out every other device');
  ok(await u1.locator('.shell').count() === 1, '…while the device that changed it stays signed in');
  // logout then Back must not restore the application
  await u1.click('button:has-text("Sign out")'); await u1.waitForSelector('input[autocomplete=username]'); await u1.goBack().catch(() => {}); await u1.waitForTimeout(500);
  ok(await u1.locator('.shell').count() === 0 && !/Sample Patient/.test(await u1.locator('body').textContent()), 'after sign-out, the Back button does not bring the application or patient data back');
  // administrator: Security & Access
  await adm.reload(); await adm.waitForSelector('.shell'); await adm.click('.nav a:has-text("Settings")'); await adm.click('.tabs button:has-text("Security & Access")'); await adm.waitForSelector('h2:has-text("Employee accounts")');
  await adm.waitForSelector('tr:has-text("e2e.user")'); await adm.waitForTimeout(300);
  ok(await adm.locator('tr:has-text("e2e.user")').count() === 1 && /ago|\d/.test(await adm.locator('tr:has-text("e2e.user")').textContent()), 'Employee accounts lists accounts with last sign-in and password age');
  await adm.screenshot({ path: `${out}/sa3-accounts.png` });
  await adm.locator('tr:has-text("e2e.user") button:has-text("Reset password")').click(); await adm.fill('#sa-temp', 'password123'); await adm.click('.modal button:has-text("Reset password")');
  await adm.waitForSelector('.modal .field-err'); ok(/common|least|Mix/i.test(await adm.locator('.modal .field-err').textContent()), 'administrator reset is policy-checked');
  await adm.fill('#sa-temp', 'Reset-Orchid-Lamp-5!'); await adm.click('.modal button:has-text("Reset password")'); await adm.waitForSelector('.modal', { state: 'detached' });
  const u4 = await newPage(); await signIn(u4, 'e2e.user', 'Reset-Orchid-Lamp-5!'); await u4.waitForSelector('#pw-new'); ok(true, 'after an administrator reset the person must choose a new password again');
  await adm.locator('tr:has-text("e2e.user") button:has-text("Change username")').click(); await adm.fill('#sa-user', 'e2e renamed'); await adm.click('.modal button:has-text("Save")'); await adm.waitForSelector('.modal .field-err');
  await adm.fill('#sa-user', 'e2e.renamed'); await adm.click('.modal button:has-text("Save")'); await adm.waitForSelector('.modal', { state: 'detached' }); await adm.waitForSelector('tr:has-text("e2e.renamed")'); ok(true, 'username change is validated and saved');
  await adm.click('.tabs button:has-text("Login Activity")'); await adm.waitForSelector('td:has-text("Signed in")');
  const act = await adm.locator('.card:has(h2:has-text("Login Activity"))').textContent(); ok(/Password changed/.test(act) && /Failed sign-in|Password reset/.test(act), 'Login Activity lists sign-ins, failures and password events');
  await adm.screenshot({ path: `${out}/sa4-activity.png` });
  await adm.click('.tabs button:has-text("Roles & Permissions")'); await adm.waitForSelector('code:has-text("config.manage")'); ok(await adm.locator('th:has-text("clinician")').count() === 1, 'Roles & Permissions shows the matrix');
  await adm.click('.tabs button:has-text("Audit History")'); await adm.waitForSelector('code:has-text("account.password")'); await adm.fill('input[type=search]', 'username'); await adm.waitForTimeout(300); ok(await adm.locator('code:has-text("account.username.change")').count() >= 1, 'Audit History lists and filters entries');
  await adm.click('.tabs button:has-text("Security Settings")'); await adm.fill('#ss-session_absolute_hours', '10'); await adm.click('.card button:has-text("Save")'); await adm.waitForSelector('.toast:has-text("Saved")'); await adm.fill('#ss-password_min_length', '5'); await adm.click('.card button:has-text("Save")'); await adm.waitForSelector('.field-err');
  ok(true, 'Security Settings save valid values and refuse out-of-range ones');
  // normal user cannot see the tab
  const rec = await newPage(); await signIn(rec, 'reception', PW); await rec.waitForSelector('.shell'); ok(await rec.locator('.nav a:has-text("Settings")').count() === 0, 'reception has no Settings or Security & Access');
  const res = await rec.evaluate(async () => (await fetch('/api/security/accounts')).status); ok(res === 403, 'the administrator API refuses other roles');
  ok(errors.length === 0, `no browser console errors${errors.length ? ': ' + errors[0] : ''}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
