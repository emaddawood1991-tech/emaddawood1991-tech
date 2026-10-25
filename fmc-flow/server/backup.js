// Encrypted backup + restore. Key: FMC_BACKUP_KEY (64 hex chars = 32 bytes). Never stored in the repo or DB.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH, openDb } from './db.js';

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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === 'restore') console.log('Restored + verified:', restore(process.argv[3], process.argv[4]));
  else console.log('Backup written:', backup());
}
