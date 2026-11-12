// Sign-in attempt counters kept in the database, so a restart does not clear a lock-out and the counters survive a replaced process.
// The key (address + typed username) is stored only as a SHA-256 hash: a password typed into the username box is never kept.
import { createHash } from 'node:crypto';

export function makeLockout(db) {
  const hash = (k) => createHash('sha256').update(k).digest('hex');
  const get = db.prepare('SELECT n,t,blocked FROM login_attempts WHERE key=?');
  const put = db.prepare('INSERT INTO login_attempts(key,n,t,blocked) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET n=excluded.n, t=excluded.t, blocked=excluded.blocked');
  const forget = db.prepare('DELETE FROM login_attempts WHERE key=?');
  let writes = 0;
  return {
    read: (k) => get.get(hash(k)) || null,
    write(k, a) {
      put.run(hash(k), a.n, a.t, a.blocked ? 1 : 0);
      if (++writes % 100 === 0) db.prepare('DELETE FROM login_attempts WHERE t < ?').run(Date.now() - 3600e3); // entries older than the one-minute window are useless
    },
    clear: (k) => { forget.run(hash(k)); },
  };
}
