// Creates the FIRST real administrator on a server that has no demo accounts (stage S9).
//   NODE_ENV=production FMC_DB=/path/to/fmc.db npm run admin:create
// The username and full name are asked for; the password is typed hidden (or taken from FMC_ADMIN_PASSWORD for scripted installs).
// The password follows the normal policy and must be changed at the first sign-in. Needs access to the server's files, so it is as trusted as the database itself.
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { openDb } from './db.js';
import { hashPassword } from './app.js';
import { passwordProblem } from './accounts.js';
import { now } from './ops.js';
import { appendAudit } from './auditchain.js';
import { seedCatalogOnly } from './seed.js';

const USERNAME_RE = /^[A-Za-z0-9._-]{3,40}$/;

export function createAdmin(db, { username, name, name_ar = '', password }) {
  const f = {};
  if (!USERNAME_RE.test(String(username || ''))) f.username = 'Use 3–40 letters, digits, dots, dashes or underscores.';
  if (!String(name || '').trim()) f.name = 'Full name is required.';
  const minLen = Math.max(10, Number(db.prepare("SELECT value FROM settings WHERE key='password_min_length'").get()?.value) || 10);
  const prob = passwordProblem(password, { username, name }, minLen); if (prob) f.password = prob;
  if (Object.keys(f).length) throw Object.assign(new Error(Object.values(f).join(' ')), { fields: f });
  if (db.prepare('SELECT 1 x FROM users WHERE username=?').get(username)) throw Object.assign(new Error(`The username "${username}" already exists.`), { fields: { username: 'Already exists.' } });
  const ts = now();
  db.exec('BEGIN');
  try {
    const id = Number(db.prepare("INSERT INTO users(username,name,name_ar,role,role_template,department_id,pass_hash,must_change_password,password_changed_at) VALUES (?,?,?,'admin','super_admin',NULL,?,1,?)")
      .run(username, String(name).trim(), name_ar, hashPassword(password), ts).lastInsertRowid);
    db.prepare("INSERT INTO staff_availability(user_id,status,updated_at,updated_by) VALUES (?, 'OFF_DUTY', ?, ?)").run(id, ts, id);
    // Privileged roles must use two-step verification. Only filled in when nobody has chosen a value yet; an existing choice is never overwritten.
    const cur = db.prepare("SELECT value FROM settings WHERE key='mfa_required_roles'").get();
    let mfaSet = false;
    if (!cur || !String(cur.value || '').trim()) { db.prepare("INSERT INTO settings(key,value) VALUES ('mfa_required_roles','admin,supervisor') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(); mfaSet = true; }
    appendAudit(db, { ts, actorId: null, action: 'admin.create', entity: 'user', entityId: id, detail: { by: 'server-console', username, mfa_required_roles_set: mfaSet } });
    db.exec('COMMIT');
    return { id, username, mfaSet };
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

function ask(q, hidden = false) {
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) { rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); else if (/[\r\n]/.test(s)) rl.output.write('\n'); }; }
    rl.question(q, (a) => { rl.close(); res(a); });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const db = openDb(); seedCatalogOnly(db);
    const username = process.env.FMC_ADMIN_USERNAME || await ask('Administrator username: ');
    const name = process.env.FMC_ADMIN_NAME || await ask('Full name: ');
    let password = process.env.FMC_ADMIN_PASSWORD;
    if (!password) { password = await ask('Temporary password (hidden): ', true); if (password !== await ask('Repeat password: ', true)) throw new Error('The two passwords do not match.'); }
    const r = createAdmin(db, { username: username.trim(), name, password });
    console.log(`Administrator "${r.username}" created. They must choose a new password at the first sign-in.${r.mfaSet ? ' Two-step verification is now required for administrators and clinic managers.' : ''}`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
