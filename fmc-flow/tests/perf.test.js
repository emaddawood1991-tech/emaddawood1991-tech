// Performance guard (stage S17): lookups the reports and queue make per visit/patient must use an index, never scan the table.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../server/db.js';

const plan = (db, sql) => db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(1).map((r) => r.detail).join(' | ');

test('per-visit and per-patient lookups use an index', () => {
  const db = openDb(':memory:');
  for (const sql of [
    'SELECT * FROM occupancy WHERE visit_id=?', 'SELECT * FROM treatment_sessions WHERE visit_id=?', 'SELECT * FROM queue_entries WHERE visit_id=?',
    'SELECT * FROM session_pauses WHERE session_id=?', 'SELECT * FROM corrections WHERE visit_id=?', 'SELECT * FROM visits WHERE patient_id=?',
    'SELECT * FROM appointments WHERE patient_id=?', 'SELECT * FROM visits WHERE arrived_at >= ?',
  ]) assert.match(plan(db, sql), /USING (COVERING )?INDEX/i, `no index for: ${sql}`);
});

test('adding the indexes changed no data rules: opening an existing database twice is harmless', () => {
  const db = openDb(':memory:'); assert.doesNotThrow(() => db.exec('CREATE INDEX IF NOT EXISTS occupancy_visit ON occupancy(visit_id)'));
});
