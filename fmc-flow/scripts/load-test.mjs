// Synthetic load check: fills a throw-away in-memory database with ~2 years of activity and times the endpoints people use all day.
//   node --disable-warning=ExperimentalWarning scripts/load-test.mjs [patients=10000] [visitsPerPatient=6]
// Synthetic data only. Prints a table and exits 1 if an endpoint is slower than its budget (milliseconds).
import { boot } from '../tests/helpers.js';

const N = Number(process.argv[2] || 10000), PER = Number(process.argv[3] || 6);
const BUDGET = { 'GET /api/patients?q=name': 250, 'GET /api/patients?q=phone': 250, 'GET /api/search?q=': 250, 'GET /api/queue': 150, 'GET /api/visits/open': 200, 'GET /api/reports (30 days)': 1500, 'GET /api/reports (all)': 3000, 'GET /api/audit': 500 };

const t0 = Date.now();
const env = await boot();
const { db } = env;
const dep = db.prepare("SELECT id FROM departments WHERE active=1 ORDER BY id LIMIT 1").get().id;
const svc = db.prepare('SELECT id FROM services WHERE department_id=? LIMIT 1').get(dep) || db.prepare('SELECT id FROM services LIMIT 1').get();
const clin = db.prepare("SELECT id FROM users WHERE active=1 AND role='clinician' LIMIT 1").get() || db.prepare('SELECT id FROM users LIMIT 1').get();
const room = db.prepare('SELECT id FROM rooms LIMIT 1').get();
const iso = (d) => new Date(d).toISOString();
const start = Date.now() - 730 * 86400e3;
db.exec('BEGIN');
const insP = db.prepare("INSERT INTO patients (mrn, name, phone, dob, synthetic, created_at) VALUES (?,?,?,?,1,?)");
const insV = db.prepare("INSERT INTO visits (patient_id, status, arrived_at, departed_at) VALUES (?, 'CHECKED_OUT', ?, ?)");
const insS = db.prepare("INSERT INTO treatment_sessions (visit_id, patient_id, service_id, clinician_id, room_id, status, started_at, ended_at) VALUES (?,?,?,?,?, 'COMPLETED', ?, ?)");
for (let i = 1; i <= N; i++) {
  const pid = Number(insP.run(`LT-${String(i).padStart(6, '0')}`, `Load Patient ${i}`, `05${String(10000000 + i).slice(0, 8)}`, `19${60 + (i % 40)}-0${1 + (i % 9)}-1${i % 9}`, iso(start)).lastInsertRowid);
  for (let k = 0; k < PER; k++) {
    const a = start + Math.floor(Math.random() * 729 * 86400e3);
    const vid = Number(insV.run(pid, iso(a), iso(a + 3600e3)).lastInsertRowid);
    insS.run(vid, pid, svc.id, clin.id, room.id, iso(a + 600e3), iso(a + 2400e3));
  }
}
db.exec('COMMIT');
const counts = { patients: db.prepare('SELECT count(*) c FROM patients').get().c, visits: db.prepare('SELECT count(*) c FROM visits').get().c, sessions: db.prepare('SELECT count(*) c FROM treatment_sessions').get().c };
console.log(`filled in ${Date.now() - t0} ms:`, counts);

const admin = await env.login('admin');
const time = async (label, path, repeat = 5) => {
  const times = [];
  for (let i = 0; i < repeat; i++) { const s = performance.now(); const r = await admin.get(path); times.push(performance.now() - s); if (r.status !== 200) { console.log('FAIL', label, r.status); process.exitCode = 1; } }
  times.sort((a, b) => a - b);
  const med = Math.round(times[Math.floor(times.length / 2)]);
  const bad = med > BUDGET[label];
  if (bad) process.exitCode = 1;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${label.padEnd(28)} median ${String(med).padStart(5)} ms   budget ${BUDGET[label]} ms`);
};
const from30 = iso(Date.now() - 30 * 86400e3).slice(0, 10), to = iso(Date.now()).slice(0, 10);
await time('GET /api/patients?q=name', '/api/patients?q=Load%20Patient%205000');
await time('GET /api/patients?q=phone', '/api/patients?q=0510');
await time('GET /api/search?q=', '/api/search?q=Load%20Patient%207');
await time('GET /api/queue', '/api/queue');
await time('GET /api/visits/open', '/api/visits/open');
await time('GET /api/reports (30 days)', `/api/reports?from=${from30}&to=${to}`);
await time('GET /api/reports (all)', `/api/reports?from=2000-01-01&to=${to}`, 3);
await time('GET /api/audit', '/api/audit');
env.close();
