// Patient registration: validation, MRN handling, duplicate protection, register + check-in.
import { tx } from './db.js';
import { HttpError, now } from './ops.js';

const ARABIC_LETTER = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const MRN_RE = /^[A-Z0-9][A-Z0-9\-/]{2,29}$/;
const ARABIC_INDIC = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };

export const GENDER_FALLBACK = [{ code: 'M', en: 'Male', ar: 'ذكر' }, { code: 'F', en: 'Female', ar: 'أنثى' }];

/** Normalise a phone number to E.164. UAE local formats are accepted; other countries need their dialing code. */
export function normalizePhone(raw) {
  let s = String(raw ?? '').replace(/[٠-٩۰-۹]/g, (c) => ARABIC_INDIC[c]).trim().replace(/[\s().\-–]/g, '');
  if (!s) return { value: null };
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (!s.startsWith('+')) {
    if (/^05\d{8}$/.test(s)) s = `+971${s.slice(1)}`;
    else if (/^5\d{8}$/.test(s)) s = `+971${s}`;
    else if (/^0[234679]\d{7}$/.test(s)) s = `+971${s.slice(1)}`;
    else return { error: 'Include the country code (for example +44 7700 900123), or enter a UAE number such as 050 123 4567.' };
  }
  if (!/^\+[1-9]\d{6,14}$/.test(s)) return { error: 'Phone number format is not valid. Use digits only after the country code (7–15 digits in total).' };
  if (s.startsWith('+971') && !/^(5\d{8}|[234679]\d{7})$/.test(s.slice(4))) return { error: 'UAE numbers are +971 5X XXX XXXX (mobile) or +971 X XXX XXXX (landline).' };
  return { value: s };
}

export function makeRegistration(db, ops) {
  const { q, one, run, setting, audit, need } = ops;
  const genders = () => { try { const g = JSON.parse(setting('gender_options')); return Array.isArray(g) && g.length ? g : GENDER_FALLBACK; } catch { return GENDER_FALLBACK; } };
  const todayInClinic = () => new Intl.DateTimeFormat('en-CA', { timeZone: setting('timezone') }).format(new Date());
  const bad = (fields, message = 'Please correct the highlighted fields.') => { throw new HttpError(400, 'VALIDATION', message, { fields }); };

  function validate(input) {
    const f = {}; const out = {};
    const name = String(input.name ?? '').trim().replace(/\s+/g, ' ');
    if (!name) f.name = 'Full name (English) is required.';
    else if (name.length < 2 || name.length > 120 || !/\p{L}/u.test(name)) f.name = 'Enter the patient’s full name (2–120 characters).';
    out.name = name;

    const nameAr = String(input.name_ar ?? '').trim().replace(/\s+/g, ' ');
    if (!nameAr) { if (setting('registration_require_name_ar') === '1') f.name_ar = 'Full name (Arabic) is required.'; }
    else if (nameAr.length > 120 || !ARABIC_LETTER.test(nameAr)) f.name_ar = 'Enter the name using Arabic letters.';
    out.name_ar = nameAr;

    const dob = String(input.dob ?? '').trim();
    if (dob) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
      const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      if (!m || d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3] || +m[1] < 1900) f.dob = 'Enter a valid date of birth.';
      else if (dob > todayInClinic()) f.dob = 'Date of birth cannot be in the future.';
    }
    out.dob = dob || null; // stored exactly as entered (a calendar date, never converted through a timezone)

    const sex = String(input.sex ?? '').trim();
    if (sex && !genders().some((g) => g.code === sex)) f.sex = 'Choose one of the configured options.';
    out.sex = sex || null;

    const ph = normalizePhone(input.phone);
    if (ph.error) f.phone = ph.error;
    else if (!ph.value && setting('registration_require_phone') === '1') f.phone = 'Contact number is required.';
    out.phone = ph.value || null;

    if (Object.keys(f).length) bad(f);
    return out;
  }

  function mrnFor(input) {
    const mode = input.mrn_mode === 'manual' || (input.mrn_mode == null && String(input.mrn ?? '').trim()) ? 'manual' : 'auto';
    if (mode === 'manual') {
      const mrn = String(input.mrn ?? '').trim().toUpperCase();
      if (!MRN_RE.test(mrn)) bad({ mrn: 'EMR number must be 3–30 characters: letters, numbers, “-” or “/”.' });
      const ex = one('SELECT id,mrn,name,name_ar,dob,phone FROM patients WHERE upper(mrn)=?', mrn);
      if (ex) throw new HttpError(409, 'MRN_DUPLICATE', `EMR number ${mrn} already belongs to another patient. Nothing was changed.`, { fields: { mrn: 'This EMR number is already in use.' }, existing: ex });
      return mrn;
    }
    let n = one('SELECT COUNT(*) c FROM patients').c + 1;
    for (;;) { const mrn = `MRN-${String(n).padStart(6, '0')}`; if (!one('SELECT 1 x FROM patients WHERE upper(mrn)=?', mrn)) return mrn; n++; }
  }

  function candidates(v) {
    return q(`SELECT id,mrn,name,name_ar,dob,phone FROM patients WHERE
      (? IS NOT NULL AND phone=?) OR (? IS NOT NULL AND dob=? AND (lower(name)=lower(?) OR (?<>'' AND name_ar=?))) LIMIT 5`,
      v.phone, v.phone, v.dob, v.dob, v.name, v.name_ar, v.name_ar);
  }

  const replay = (key, scope) => {
    if (!key) return null;
    const r = one('SELECT response, scope FROM idempotency_keys WHERE key=?', String(key));
    if (!r) return null;
    if (r.scope !== scope) throw new HttpError(409, 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for a different action.');
    return { ...JSON.parse(r.response), replayed: true };
  };
  const remember = (key, scope, response) => {
    if (!key) return;
    run('INSERT INTO idempotency_keys(key,scope,response,created_at) VALUES (?,?,?,?)', String(key), scope, JSON.stringify(response), now());
    run("DELETE FROM idempotency_keys WHERE created_at < ?", new Date(Date.now() - 2 * 864e5).toISOString());
  };

  function insertPatient(user, input) {
    const v = validate(input);
    const mrn = mrnFor(input);
    const dups = candidates(v);
    if (dups.length && !input.confirm_duplicate)
      throw new HttpError(409, 'POSSIBLE_DUPLICATE', 'A patient with the same phone number or the same name and date of birth already exists. Select that patient, or confirm that this is a different person.', { candidates: dups });
    const r = run('INSERT INTO patients(mrn,name,name_ar,dob,sex,phone,synthetic,created_at) VALUES (?,?,?,?,?,?,?,?)', mrn, v.name, v.name_ar, v.dob, v.sex, v.phone, 1, now());
    const id = Number(r.lastInsertRowid);
    audit(user, 'patient.create', 'patient', id, { mrn_mode: input.mrn_mode === 'manual' ? 'manual' : 'auto', duplicate_override: !!(dups.length && input.confirm_duplicate), fields: ['name', v.name_ar && 'name_ar', v.dob && 'dob', v.sex && 'sex', v.phone && 'phone'].filter(Boolean) });
    return one('SELECT * FROM patients WHERE id=?', id);
  }

  function createPatient(user, input = {}) {
    need(user, 'patients.write');
    return tx(db, () => {
      const prior = replay(input.idem_key, 'patient'); if (prior) return prior;
      const patient = insertPatient(user, input);
      const res = { patient };
      remember(input.idem_key, 'patient', res);
      return res;
    });
  }

  /** Register (or select) a patient, check them in and put them in the department queue — all or nothing. */
  function register(user, input = {}) {
    need(user, 'patients.write'); need(user, 'visit.manage');
    if (!input.department_id) bad({ department_id: 'Department is required to check the patient in.' });
    return tx(db, () => {
      const prior = replay(input.idem_key, 'register'); if (prior) return prior;
      let patient;
      if (input.patient_id) { patient = one('SELECT * FROM patients WHERE id=?', input.patient_id); if (!patient) throw new HttpError(404, 'PATIENT_NOT_FOUND', 'Patient not found.'); }
      else patient = insertPatient(user, input.patient || {});
      const { visit, queue } = ops.checkIn(user, { patientId: patient.id, appointmentId: input.appointment_id || undefined, departmentId: Number(input.department_id), serviceId: input.service_id ? Number(input.service_id) : undefined, clinicianId: input.clinician_id ? Number(input.clinician_id) : undefined });
      const res = { patient, visit, queue, created: !input.patient_id };
      remember(input.idem_key, 'register', res);
      return res;
    });
  }

  function search(user, term) {
    need(user, 'patients.read');
    const raw = String(term ?? '').trim();
    const like = `%${raw}%`;
    const digits = raw.replace(/[٠-٩]/g, (c) => ARABIC_INDIC[c]).replace(/\D/g, '').replace(/^0+/, ''); // national numbers start with 0; stored numbers are +CC…
    audit(user, 'patients.search', 'patient', null, { q_len: raw.length });
    return q(`SELECT p.*, (SELECT id FROM visits v WHERE v.patient_id=p.id AND v.status='OPEN') open_visit_id FROM patients p
      WHERE p.name LIKE ? OR p.name_ar LIKE ? OR p.mrn LIKE ? OR CAST(p.id AS TEXT)=?
        OR (? <> '' AND length(?) >= 4 AND REPLACE(COALESCE(p.phone,''),'+','') LIKE ?)
      ORDER BY p.name LIMIT 30`, like, like, like, raw, digits, digits, `%${digits}%`);
  }

  return { createPatient, register, search, validate, genders };
}
