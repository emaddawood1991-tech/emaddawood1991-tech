// Off-host fingerprint of the audit log (stage S6). A short line (entry count, newest hash, time, optional HMAC) that is copied OFF the server.
// Someone who can edit the database file can recompute the whole hash chain; they cannot change a line that is already stored elsewhere.
import { createHmac } from 'node:crypto';
import { verifyChain } from './auditchain.js';

const mac = (key, f) => (key ? createHmac('sha256', key).update(`${f.ts}|${f.entries}|${f.head}`).digest('hex') : null);

/** Builds the fingerprint of the current audit log. `key` (optional, Buffer or string) adds an HMAC so a forged line is detectable. */
export function fingerprint(db, key = null, ts = new Date().toISOString()) {
  const v = verifyChain(db);
  const f = { v: 1, ts, entries: v.rows, head: v.head, chain_ok: v.ok };
  return { ...f, mac: mac(key, f) };
}
export const toLine = (f) => JSON.stringify(f);

/** Checks the database against a stored fingerprint line: the chain must verify, the recorded newest entry must still exist at the same position. */
export function checkAgainst(db, line, key = null) {
  let f; try { f = JSON.parse(line); } catch { return { ok: false, reason: 'UNREADABLE_LINE' }; }
  if (!f || f.v !== 1 || typeof f.entries !== 'number') return { ok: false, reason: 'UNREADABLE_LINE' };
  if (key && f.mac !== mac(key, f)) return { ok: false, reason: 'FINGERPRINT_FORGED_OR_WRONG_KEY' };
  const v = verifyChain(db);
  if (!v.ok) return { ok: false, reason: 'CHAIN_BROKEN', detail: v.problems.slice(0, 3) };
  if (f.head == null) return { ok: v.rows >= 0, reason: 'EMPTY_AT_THE_TIME' };
  const row = db.prepare('SELECT id FROM audit_log WHERE row_hash=?').get(f.head);
  if (!row) return { ok: false, reason: 'ENTRY_MISSING_OR_REWRITTEN', recorded_entries: f.entries, current_entries: v.rows };
  const pos = db.prepare('SELECT COUNT(*) c FROM audit_log WHERE row_hash IS NOT NULL AND id<=?').get(row.id).c;
  if (pos !== f.entries) return { ok: false, reason: 'POSITION_CHANGED', recorded_entries: f.entries, found_at: pos };
  return { ok: true, reason: 'MATCHES', recorded_entries: f.entries, current_entries: v.rows, newer_entries: v.rows - f.entries };
}
