// Synthetic development data only. Everything here lands in the database and is then
// managed through Settings — the application code never references these names.
import { openDb, tx } from './db.js';
import { hashPassword } from './app.js';
import { now } from './ops.js';
import { pathToFileURL } from 'node:url';

export const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';

// Current FMC services. OT and Speech Therapy are discontinued and are not part of the demo catalog.
const CATALOG = [
  { name: 'Orthopedics', ar: 'العظام', prefix: 'O', services: [['Orthopedic Consultation', 'استشارة عظام', 20]],
    rooms: [['ORT-01', 'Orthopedic Room 01', 'غرفة عظام 01', 1], ['ORT-02', 'Orthopedic Room 02', 'غرفة عظام 02', 1]] },
  { name: 'Physiotherapy', ar: 'العلاج الطبيعي', prefix: 'P',
    services: [['PT Evaluation', 'تقييم علاج طبيعي', 45], ['PT Treatment', 'جلسة علاج طبيعي', 45], ['Electrical Stimulation', 'تحفيز كهربائي', 20]],
    rooms: [['PT-01', 'PT Room 01', 'غرفة علاج 01', 1, 1], ['PT-02', 'PT Room 02', 'غرفة علاج 02', 1, 1], ['PT-03', 'PT Room 03', 'غرفة علاج 03', 1, 1], ['PT-HALL-01', 'Physiotherapy Hall 01', 'صالة العلاج الطبيعي 01', 6, 0, ['BED-01', 'BED-02', 'BED-03', 'BED-04', 'BED-05', 'BED-06']]] },
  { name: 'General Medicine', ar: 'الطب العام', prefix: 'G', services: [['General Medicine Consultation', 'استشارة طب عام', 15]],
    rooms: [['GM-01', 'General Medicine Room 01', 'عيادة الطب العام 01', 1], ['GM-02', 'General Medicine Room 02', 'عيادة الطب العام 02', 1]] },
  { name: 'Neurological Rehabilitation', ar: 'التأهيل العصبي', prefix: 'N',
    services: [['Neurological Assessment', 'تقييم عصبي', 45], ['Neurological Rehabilitation Session', 'جلسة تأهيل عصبي', 45]], rooms: [['NR-01', 'Neuro Rehab Room 01', 'غرفة تأهيل عصبي 01', 1]] },
  { name: 'Sports Injury Treatment', ar: 'علاج الإصابات الرياضية', prefix: 'S',
    services: [['Sports Injury Assessment', 'تقييم إصابة رياضية', 30], ['Sports Injury Treatment Session', 'جلسة علاج إصابة رياضية', 45]], rooms: [['SI-01', 'Sports Injury Room 01', 'غرفة إصابات رياضية 01', 1]] },
  { name: 'Rehabilitation', ar: 'التأهيل (بما في ذلك التأهيل بعد العمليات)', prefix: 'R',
    services: [['Rehabilitation Session', 'جلسة تأهيل', 45], ['Postoperative Rehabilitation', 'تأهيل ما بعد العمليات', 45]],
    rooms: [['RH-01', 'Rehabilitation Room 01', 'غرفة تأهيل 01', 1, 1], ['RH-02', 'Rehabilitation Room 02', 'غرفة تأهيل 02', 1, 1]] },
];
const DISCONTINUED = ['Occupational Therapy', 'Speech Therapy'];
const STAFF = [ // [username, name, ar, role, department, services]
  ['admin', 'System Admin (Demo)', 'مدير النظام', 'admin', null, []], ['super', 'Supervisor (Demo)', 'المشرف', 'supervisor', null, []], ['reception', 'Reception (Demo)', 'الاستقبال', 'reception', null, []],
  ['dr.ort', 'Dr. Orthopedic (Demo)', 'د. عظام', 'clinician', 'Orthopedics', ['Orthopedic Consultation']],
  ['pt.one', 'PT One (Demo)', 'أخصائي علاج 1', 'clinician', 'Physiotherapy', ['PT Evaluation', 'PT Treatment', 'Electrical Stimulation']],
  ['pt.two', 'PT Two (Demo)', 'أخصائي علاج 2', 'clinician', 'Physiotherapy', ['PT Treatment']],
  ['gm.one', 'Dr. General Medicine (Demo)', 'د. طب عام', 'clinician', 'General Medicine', ['General Medicine Consultation']],
  ['nr.one', 'Neuro Rehab One (Demo)', 'أخصائي تأهيل عصبي 1', 'clinician', 'Neurological Rehabilitation', ['Neurological Assessment', 'Neurological Rehabilitation Session']],
  ['si.one', 'Sports Injury One (Demo)', 'أخصائي إصابات رياضية 1', 'clinician', 'Sports Injury Treatment', ['Sports Injury Assessment', 'Sports Injury Treatment Session']],
  ['rh.one', 'Rehab One (Demo)', 'أخصائي تأهيل 1', 'clinician', 'Rehabilitation', ['Rehabilitation Session', 'Postoperative Rehabilitation']],
];

/** Insert whatever the current catalog is missing (matched by name/code). Never deletes or overwrites. */
function ensureCatalog(db) {
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const ins = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
  for (const d of CATALOG) {
    const dep = one('SELECT id FROM departments WHERE name=?', d.name)?.id ?? ins('INSERT INTO departments(name,name_ar,queue_prefix) VALUES (?,?,?)', d.name, d.ar, d.prefix);
    for (const [name, ar, min] of d.services) if (!one('SELECT 1 x FROM services WHERE department_id=? AND name=?', dep, name)) ins('INSERT INTO services(department_id,name,name_ar,default_minutes) VALUES (?,?,?,?)', dep, name, ar, min);
    for (const [code, name, ar, cap, clean = 0, beds = []] of d.rooms) {
      const room = one('SELECT id FROM rooms WHERE code=?', code)?.id ?? ins('INSERT INTO rooms(department_id,code,name,name_ar,capacity,cleaning_after_use) VALUES (?,?,?,?,?,?)', dep, code, name, ar, cap, clean);
      for (const b of beds) if (!one('SELECT 1 x FROM stations WHERE room_id=? AND code=?', room, b)) ins('INSERT INTO stations(room_id,code) VALUES (?,?)', room, b);
    }
  }
}
function ensureUsers(db) {
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const ins = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
  const pw = hashPassword(DEMO_PASSWORD);
  for (const [username, name, ar, role, dept, services] of STAFF) {
    if (one('SELECT 1 x FROM users WHERE username=?', username)) continue;
    const depId = dept ? one('SELECT id FROM departments WHERE name=?', dept)?.id ?? null : null;
    const id = ins('INSERT INTO users(username,name,name_ar,role,department_id,pass_hash) VALUES (?,?,?,?,?,?)', username, name, ar, role, depId, pw);
    for (const sv of services) { const sid = one('SELECT id FROM services WHERE department_id=? AND name=?', depId, sv)?.id; if (sid) ins('INSERT INTO staff_services VALUES (?,?)', id, sid); }
    ins('INSERT INTO staff_availability(user_id,status,updated_at) VALUES (?,?,?)', id, role === 'clinician' ? 'AVAILABLE' : 'OFF_DUTY', now());
  }
}

/** One-time upgrade of an older demo database. Deactivates (never deletes) discontinued departments, so history stays intact. */
function migrateCatalog(db) {
  const run = (sql, ...a) => db.prepare(sql).run(...a);
  const get = (sql, ...a) => db.prepare(sql).get(...a);
  for (const name of DISCONTINUED) {
    const d = get('SELECT id FROM departments WHERE name=?', name); if (!d) continue;
    run('UPDATE departments SET active=0 WHERE id=?', d.id);
    run('UPDATE services SET active=0 WHERE department_id=?', d.id);
    run("UPDATE rooms SET active=0 WHERE department_id=? AND id NOT IN (SELECT room_id FROM occupancy WHERE exited_at IS NULL)", d.id);
    run('UPDATE users SET active=0 WHERE department_id=? AND role=\'clinician\'', d.id);
    run("UPDATE staff_availability SET status='OFF_DUTY' WHERE user_id IN (SELECT id FROM users WHERE department_id=?)", d.id);
  }
  const gp = get("SELECT id FROM departments WHERE name='General Practice'");
  if (gp && !get("SELECT 1 x FROM departments WHERE name='General Medicine'")) {
    run("UPDATE departments SET name='General Medicine', name_ar='الطب العام' WHERE id=?", gp.id);
    run("UPDATE services SET name='General Medicine Consultation' WHERE department_id=? AND name='GP Consultation'", gp.id);
    run("UPDATE rooms SET name=REPLACE(name,'GP Clinic','General Medicine Room') WHERE department_id=?", gp.id);
    run("UPDATE users SET name=REPLACE(name,'Dr. GP','Dr. General Medicine') WHERE department_id=?", gp.id);
  }
  ensureCatalog(db); ensureUsers(db);
}

export function seed(db) {
  const hasData = db.prepare('SELECT COUNT(*) c FROM departments').get().c > 0;
  const migrated = db.prepare("SELECT 1 x FROM settings WHERE key='catalog_v2'").get();
  if (hasData && migrated) return false;
  tx(db, () => {
    if (!hasData) {
      ensureCatalog(db); ensureUsers(db);
      const dep = (n) => db.prepare('SELECT id FROM departments WHERE name=?').get(n).id;
      const svc = (n) => db.prepare('SELECT id FROM services WHERE name=?').get(n).id;
      const usr = (n) => db.prepare('SELECT id FROM users WHERE username=?').get(n).id;
      const names = [['Sample Patient A', 'مريض تجريبي أ'], ['Sample Patient B', 'مريض تجريبي ب'], ['Sample Patient C', 'مريض تجريبي ج'], ['Sample Patient D', 'مريض تجريبي د'], ['Sample Patient E', 'مريض تجريبي هـ'], ['Sample Patient F', 'مريض تجريبي و'], ['Sample Patient G', 'مريض تجريبي ز'], ['Sample Patient H', 'مريض تجريبي ح']];
      const pats = names.map(([n, ar], i) => Number(db.prepare('INSERT INTO patients(mrn,name,name_ar,dob,sex,phone,created_at) VALUES (?,?,?,?,?,?,?)')
        .run(`MRN-${String(i + 1).padStart(6, '0')}`, n, ar, `19${70 + i}-0${1 + i}-1${i}`, i % 2 ? 'F' : 'M', `+97150000000${i + 1}`, now()).lastInsertRowid));
      const base = new Date(); base.setMinutes(0, 0, 0);
      pats.forEach((pid, i) => {
        const pt = i % 2;
        db.prepare('INSERT INTO appointments(ref,patient_id,department_id,service_id,clinician_id,scheduled_at,created_at) VALUES (?,?,?,?,?,?,?)')
          .run(`APT-${String(i + 1).padStart(6, '0')}`, pid, dep(pt ? 'Physiotherapy' : 'Orthopedics'), svc(pt ? 'PT Treatment' : 'Orthopedic Consultation'), usr(pt ? 'pt.one' : 'dr.ort'), new Date(base.getTime() + (i + 1) * 30 * 60000).toISOString(), now());
      });
    } else migrateCatalog(db);
    db.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES ('catalog_v2','1')").run();
  });
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDb();
  console.log(seed(db) ? `Seeded/updated synthetic data. Demo password for all users: ${DEMO_PASSWORD}` : 'Database already up to date; nothing changed.');
}
