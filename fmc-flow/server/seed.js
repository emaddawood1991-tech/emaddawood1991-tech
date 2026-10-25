// Synthetic development data only. Everything here lands in the database and is then
// managed through Settings — the application code never references these names.
import { openDb, tx } from './db.js';
import { hashPassword } from './app.js';
import { now } from './ops.js';
import { pathToFileURL } from 'node:url';

export const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';

export function seed(db) {
  if (db.prepare('SELECT COUNT(*) c FROM departments').get().c > 0) return false;
  const ins = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
  tx(db, () => {
    const dep = {};
    for (const [k, name, ar, pre] of [['ORT', 'Orthopedics', 'العظام', 'O'], ['PT', 'Physiotherapy', 'العلاج الطبيعي', 'P'], ['OT', 'Occupational Therapy', 'العلاج الوظيفي', 'T'], ['ST', 'Speech Therapy', 'علاج النطق', 'S'], ['GP', 'General Practice', 'الطب العام', 'G']])
      dep[k] = ins('INSERT INTO departments(name,name_ar,queue_prefix) VALUES (?,?,?)', name, ar, pre);

    const svc = {};
    for (const [k, d, name, ar, min] of [
      ['ORT_C', 'ORT', 'Orthopedic Consultation', 'استشارة عظام', 20], ['PT_EVAL', 'PT', 'PT Evaluation', 'تقييم علاج طبيعي', 45],
      ['PT_TX', 'PT', 'PT Treatment', 'جلسة علاج طبيعي', 45], ['PT_ES', 'PT', 'Electrical Stimulation', 'تحفيز كهربائي', 20],
      ['OT_TX', 'OT', 'OT Session', 'جلسة علاج وظيفي', 45], ['ST_TX', 'ST', 'Speech Session', 'جلسة نطق', 30], ['GP_C', 'GP', 'GP Consultation', 'استشارة طب عام', 15],
    ]) svc[k] = ins('INSERT INTO services(department_id,name,name_ar,default_minutes) VALUES (?,?,?,?)', dep[d], name, ar, min);

    const room = (d, code, name, ar, cap, clean = 0) => ins('INSERT INTO rooms(department_id,code,name,name_ar,capacity,cleaning_after_use) VALUES (?,?,?,?,?,?)', dep[d], code, name, ar, cap, clean);
    for (const c of ['ORT-01', 'ORT-02']) room('ORT', c, `Orthopedic ${c.slice(-2)}`, `عظام ${c.slice(-2)}`, 1);
    for (const c of ['PT-01', 'PT-02', 'PT-03']) room('PT', c, `PT Room ${c.slice(-2)}`, `غرفة علاج ${c.slice(-2)}`, 1, 1);
    const hall = room('PT', 'PT-HALL-01', 'Physiotherapy Hall 01', 'صالة العلاج الطبيعي 01', 6);
    for (let i = 1; i <= 6; i++) ins('INSERT INTO stations(room_id,code) VALUES (?,?)', hall, `BED-0${i}`);
    room('OT', 'OT-01', 'OT Room 01', 'غرفة وظيفي 01', 1); room('ST', 'ST-01', 'Speech Room 01', 'غرفة نطق 01', 1);
    room('GP', 'GP-01', 'GP Clinic 01', 'عيادة 01', 1); room('GP', 'GP-02', 'GP Clinic 02', 'عيادة 02', 1);

    const pw = hashPassword(DEMO_PASSWORD);
    const user = (username, name, ar, role, d, services = []) => {
      const id = ins('INSERT INTO users(username,name,name_ar,role,department_id,pass_hash) VALUES (?,?,?,?,?,?)', username, name, ar, role, d ? dep[d] : null, pw);
      for (const s of services) ins('INSERT INTO staff_services VALUES (?,?)', id, svc[s]);
      ins("INSERT INTO staff_availability(user_id,status,updated_at) VALUES (?,?,?)", id, role === 'clinician' ? 'AVAILABLE' : 'OFF_DUTY', now());
      return id;
    };
    user('admin', 'System Admin (Demo)', 'مدير النظام', 'admin', null);
    user('super', 'Supervisor (Demo)', 'المشرف', 'supervisor', null);
    user('reception', 'Reception (Demo)', 'الاستقبال', 'reception', null);
    const c1 = user('dr.ort', 'Dr. Orthopedic (Demo)', 'د. عظام', 'clinician', 'ORT', ['ORT_C']);
    const c2 = user('pt.one', 'PT One (Demo)', 'أخصائي علاج 1', 'clinician', 'PT', ['PT_EVAL', 'PT_TX', 'PT_ES']);
    user('pt.two', 'PT Two (Demo)', 'أخصائي علاج 2', 'clinician', 'PT', ['PT_TX']);
    user('ot.one', 'OT One (Demo)', 'أخصائي وظيفي 1', 'clinician', 'OT', ['OT_TX']);
    user('st.one', 'ST One (Demo)', 'أخصائي نطق 1', 'clinician', 'ST', ['ST_TX']);
    user('gp.one', 'Dr. GP (Demo)', 'د. طب عام', 'clinician', 'GP', ['GP_C']);

    const names = [['Sample Patient A', 'مريض تجريبي أ'], ['Sample Patient B', 'مريض تجريبي ب'], ['Sample Patient C', 'مريض تجريبي ج'], ['Sample Patient D', 'مريض تجريبي د'], ['Sample Patient E', 'مريض تجريبي هـ'], ['Sample Patient F', 'مريض تجريبي و'], ['Sample Patient G', 'مريض تجريبي ز'], ['Sample Patient H', 'مريض تجريبي ح']];
    const pats = names.map(([n, ar], i) => ins('INSERT INTO patients(mrn,name,name_ar,sex,created_at) VALUES (?,?,?,?,?)', `MRN-${String(i + 1).padStart(6, '0')}`, n, ar, i % 2 ? 'F' : 'M', now()));
    const base = new Date(); base.setMinutes(0, 0, 0);
    pats.forEach((pid, i) => {
      const d = i % 2 ? 'PT' : 'ORT';
      ins('INSERT INTO appointments(ref,patient_id,department_id,service_id,clinician_id,scheduled_at,created_at) VALUES (?,?,?,?,?,?,?)',
        `APT-${String(i + 1).padStart(6, '0')}`, pid, dep[d], d === 'PT' ? svc.PT_TX : svc.ORT_C, d === 'PT' ? c2 : c1, new Date(base.getTime() + (i + 1) * 30 * 60000).toISOString(), now());
    });
  });
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDb();
  console.log(seed(db) ? `Seeded synthetic data. Demo password for all users: ${DEMO_PASSWORD}` : 'Database already has data; nothing seeded.');
}
