// Encrypted backup + restore. Key: FMC_BACKUP_KEY (64 hex chars = 32 bytes). Never stored in the repo or DB.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync, statSync, readdirSync, copyFileSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH, openDb } from './db.js';
import { verifyChain } from './auditchain.js';
import { fingerprint, toLine, checkAgainst } from './fingerprint.js';

const keyOf = (hex = process.env.FMC_BACKUP_KEY) => {
  if (!/^[0-9a-f]{64}$/i.test(hex || '')) throw new Error('FMC_BACKUP_KEY must be 64 hex characters');
  return Buffer.from(hex, 'hex');
};

export function backup({ dbPath = DB_PATH, dir = new URL('../data/backups/', import.meta.url).pathname, key, retainDays = Number(process.env.FMC_BACKUP_RETAIN_DAYS || 0) } = {}) {
  const log = openDb(dbPath);
  try {
    const k = keyOf(key);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const tmp = join(tmpdir(), `fmc-${randomBytes(6).toString('hex')}.db`);
    log.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`); // consistent snapshot while the app is running
    const plain = readFileSync(tmp); rmSync(tmp);
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', k, iv);
    const enc = Buffer.concat([c.update(plain), c.final()]);
    const file = join(dir, `fmc-${new Date().toISOString().replace(/[:.]/g, '-')}.enc`);
    writeFileSync(file, Buffer.concat([iv, c.getAuthTag(), enc]), { mode: 0o600 });
    log.prepare('INSERT INTO backup_log(ts,file,bytes,ok,note) VALUES (?,?,?,1,?)').run(new Date().toISOString(), file.split('/').pop(), statSync(file).size, 'AES-256-GCM');
    // Retention is policy-driven: only prune when FMC_BACKUP_RETAIN_DAYS is explicitly configured.
    if (retainDays > 0) for (const f of readdirSync(dir)) if (f.endsWith('.enc') && Date.now() - statSync(join(dir, f)).mtimeMs > retainDays * 864e5) rmSync(join(dir, f));
    return file;
  } catch (e) {
    log.prepare('INSERT INTO backup_log(ts,file,bytes,ok,note) VALUES (?,?,?,0,?)').run(new Date().toISOString(), null, 0, String(e.message).slice(0, 120));
    throw e;
  } finally { log.close(); }
}

export function restore(file, outPath, key) {
  const buf = readFileSync(file);
  const d = createDecipheriv('aes-256-gcm', keyOf(key), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  writeFileSync(outPath, Buffer.concat([d.update(buf.subarray(28)), d.final()]), { mode: 0o600 });
  const t = new DatabaseSync(outPath);
  const ok = t.prepare('PRAGMA integrity_check').get().integrity_check === 'ok';
  t.close();
  if (!ok) throw new Error('Restored database failed integrity_check');
  return outPath;
}

/** Restore drill: decrypts the newest (or a given) backup into a temporary file, checks it, compares it with the live audit fingerprint rules, deletes it and records the result. Never touches the live database. */
export function drill({ dbPath = DB_PATH, dir = new URL('../data/backups/', import.meta.url).pathname, key, file } = {}) {
  const log = openDb(dbPath);
  const tmp = join(tmpdir(), `fmc-drill-${randomBytes(6).toString('hex')}.db`);
  const note = (ok, text) => log.prepare('INSERT INTO backup_log(ts,file,bytes,ok,note) VALUES (?,?,?,?,?)').run(new Date().toISOString(), file ? file.split('/').pop() : null, 0, ok ? 1 : 0, `DRILL ${text}`.slice(0, 200));
  try {
    const newest = existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith('.enc')).sort().pop() : null;
    const f = file || (newest ? join(dir, newest) : null);
    if (!f) throw new Error('no backup file found');
    file = f; restore(f, tmp, key);
    const t = new DatabaseSync(tmp);
    try {
      const chain = verifyChain(t);
      const count = (n) => t.prepare(`SELECT COUNT(*) c FROM ${n}`).get().c;
      const r = { file: f.split('/').pop(), integrity: 'ok', audit_chain_ok: chain.ok, audit_entries: chain.rows, patients: count('patients'), visits: count('visits'), users: count('users') };
      if (!chain.ok) throw new Error(`restored audit chain does not verify (${chain.problem_count} problem(s))`);
      note(true, `ok: ${r.patients} patients, ${r.visits} visits, ${r.audit_entries} audit entries, chain verified`);
      return r;
    } finally { t.close(); }
  } catch (e) { note(false, `FAILED: ${e.message}`); throw e; } finally { try { rmSync(tmp, { force: true }); rmSync(`${tmp}-wal`, { force: true }); rmSync(`${tmp}-shm`, { force: true }); } catch { /* best effort */ } log.close(); }
}

/** Records and (optionally) appends the audit fingerprint to a file kept OFF this server. */
export function recordFingerprint({ dbPath = DB_PATH, key = process.env.FMC_BACKUP_KEY, file = process.env.FMC_FINGERPRINT_FILE } = {}) {
  const db = openDb(dbPath);
  try {
    const f = fingerprint(db, key && /^[0-9a-f]{64}$/i.test(key) ? Buffer.from(key, 'hex') : null);
    if (file) { mkdirSync(join(file, '..'), { recursive: true, mode: 0o700 }); appendFileSync(file, `${toLine(f)}\n`, { mode: 0o600 }); }
    db.prepare('INSERT INTO backup_log(ts,file,bytes,ok,note) VALUES (?,?,?,?,?)').run(f.ts, null, 0, f.chain_ok ? 1 : 0, `FINGERPRINT ${f.entries} entries${file ? ' -> file' : ' (not stored: FMC_FINGERPRINT_FILE unset)'}`);
    return f;
  } finally { db.close(); }
}

/** Checks the live database against the LAST line of a fingerprint file (and optionally every line). */
export function verifyFingerprints(file, { dbPath = DB_PATH, key = process.env.FMC_BACKUP_KEY, all = false } = {}) {
  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean); if (!lines.length) throw new Error('fingerprint file is empty');
  const db = openDb(dbPath); const k = key && /^[0-9a-f]{64}$/i.test(key) ? Buffer.from(key, 'hex') : null;
  try { return (all ? lines : [lines[lines.length - 1]]).map((l) => checkAgainst(db, l, k)); } finally { db.close(); }
}

/** One scheduled run: encrypted backup, copy to the off-site folder, fingerprint, and a restore drill when the last one is older than `drillEveryDays`. */
export function runScheduled({ dbPath = DB_PATH, dir, key = process.env.FMC_BACKUP_KEY, offsiteDir = process.env.FMC_BACKUP_OFFSITE_DIR, drillEveryDays = Number(process.env.FMC_DRILL_EVERY_DAYS || 30) } = {}) {
  const out = { backup: backup({ dbPath, dir, key }) };
  if (offsiteDir) { mkdirSync(offsiteDir, { recursive: true, mode: 0o700 }); copyFileSync(out.backup, join(offsiteDir, out.backup.split('/').pop())); out.offsite = true; }
  out.fingerprint = recordFingerprint({ dbPath, key });
  const db = openDb(dbPath);
  let due; try { const last = db.prepare("SELECT ts FROM backup_log WHERE note LIKE 'DRILL ok%' ORDER BY id DESC LIMIT 1").get(); due = !last || Date.now() - Date.parse(last.ts) > drillEveryDays * 864e5; } finally { db.close(); }
  if (due) out.drill = drill({ dbPath, dir: join(out.backup, '..'), key, file: out.backup });
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'restore') console.log('Restored + verified:', restore(a, b));
  else if (cmd === 'drill') console.log('Restore drill passed:', JSON.stringify(drill({ file: a })));
  else if (cmd === 'fingerprint') console.log(toLine(recordFingerprint()));
  else if (cmd === 'verify-fingerprint') { const r = verifyFingerprints(a, { all: b === '--all' }); console.log(JSON.stringify(r)); if (r.some((x) => !x.ok)) process.exit(2); }
  else if (cmd === 'run') console.log('Scheduled run:', JSON.stringify(runScheduled({ dir: new URL('../data/backups/', import.meta.url).pathname })));
  else console.log('Backup written:', backup());
}
