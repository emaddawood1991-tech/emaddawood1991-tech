// Tamper-evident audit log: every entry carries the hash of the previous entry (a hash chain).
// Changing, removing or inserting an entry breaks the chain from that point; removal of the newest entries is caught by periodic anchors.
import { createHash } from 'node:crypto';

const h = (s) => createHash('sha256').update(s).digest('hex');
export const rowHash = (prev, r) => h(`${prev}|${r.ts}|${r.actor_id ?? ''}|${r.action}|${r.entity ?? ''}|${r.entity_id ?? ''}|${r.detail}`);

/** Appends one audit entry linked to the previous one. Runs inside the caller's transaction, so the chain stays consistent. */
export function appendAudit(db, { ts, actorId = null, action, entity = null, entityId = null, detail = {} }) {
  const prev = db.prepare('SELECT row_hash h FROM audit_log WHERE row_hash IS NOT NULL ORDER BY id DESC LIMIT 1').get()?.h ?? 'GENESIS';
  const row = { ts, actor_id: actorId ?? null, action, entity: entity ?? null, entity_id: entityId == null ? null : String(entityId), detail: JSON.stringify(detail ?? {}) };
  db.prepare('INSERT INTO audit_log(ts,actor_id,action,entity,entity_id,detail,prev_hash,row_hash) VALUES (?,?,?,?,?,?,?,?)').run(row.ts, row.actor_id, row.action, row.entity, row.entity_id, row.detail, prev, rowHash(prev, row));
}

/** Re-computes the whole chain. Entries written before the chain existed (no hash) are reported as `legacy_rows`, never as problems. */
export function verifyChain(db) {
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY id').all();
  let prev = 'GENESIS'; let started = false; let count = 0; let head = null; const problems = [];
  for (const r of rows) {
    if (r.row_hash == null) { if (started) problems.push({ id: r.id, kind: 'UNHASHED_ROW' }); continue; }
    started = true;
    if (r.prev_hash !== prev) problems.push({ id: r.id, kind: 'CHAIN_BREAK' });
    if (rowHash(r.prev_hash ?? '', r) !== r.row_hash) problems.push({ id: r.id, kind: 'ROW_ALTERED' });
    prev = r.row_hash; head = r.row_hash; count++;
  }
  const anchor = db.prepare('SELECT * FROM audit_anchors ORDER BY id DESC LIMIT 1').get();
  if (anchor) {
    const present = db.prepare('SELECT 1 x FROM audit_log WHERE row_hash=?').get(anchor.head);
    if (!present || count < anchor.row_count) problems.push({ id: null, kind: 'TAIL_REMOVED', anchored_rows: anchor.row_count, anchored_at: anchor.ts });
  }
  return { ok: problems.length === 0, rows: count, legacy_rows: rows.length - count, head, problems: problems.slice(0, 20), problem_count: problems.length };
}
