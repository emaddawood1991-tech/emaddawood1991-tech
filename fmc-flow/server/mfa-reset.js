// Emergency reset of a person's authenticator when no administrator can sign in:
//   FMC_DB=/path/to/fmc.db npm run mfa:reset -- <username>
// Needs access to the server's files (so it is as trusted as the database itself). The action is recorded in the audit log and login activity.
import { openDb } from './db.js';
import { now } from './ops.js';
import { appendAudit } from './auditchain.js';
import { pathToFileURL } from 'node:url';

export function resetMfa(db, username) {
  const u = db.prepare('SELECT id,username FROM users WHERE username=?').get(String(username || ''));
  if (!u) throw new Error(`No account named "${username}".`);
  db.prepare('DELETE FROM user_mfa WHERE user_id=?').run(u.id); db.prepare('DELETE FROM mfa_recovery_codes WHERE user_id=?').run(u.id); db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(u.id);
  db.prepare('INSERT INTO login_events(ts,user_id,event,detail) VALUES (?,?,?,?)').run(now(), u.id, 'MFA_RESET', JSON.stringify({ by: 'server-console' }));
  appendAudit(db, { ts: now(), actorId: null, action: 'mfa.reset', entity: 'user', entityId: u.id, detail: { by: 'server-console' } });
  return u;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { const u = resetMfa(openDb(), process.argv[2]); console.log(`Authenticator removed for ${u.username}. They must set it up again at their next sign-in.`); }
  catch (e) { console.error(e.message); process.exit(1); }
}
