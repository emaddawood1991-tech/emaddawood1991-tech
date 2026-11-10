import { useMemo, useRef, useState } from 'react';
import { api, newKey, useNet } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Modal, useToast } from '../ui.jsx';

export function Field({ id, label, required, note, error, hint, children }) {
  const { t } = useI18n();
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required ? <><span className="req" aria-hidden="true"> *</span><span className="sr-only"> ({t('requiredWord')})</span></> : <span className="opt"> · {note || t('optionalWord')}</span>}</label>
      {children}
      {hint && !error && <small id={`${id}-hint`} className="hint">{hint}</small>}
      {error && <div id={`${id}-err`} className="field-err" role="alert">{error}</div>}
    </div>
  );
}
export const aria = (id, error, hint, required) => ({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-required': required ? 'true' : undefined, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined });

export default function PatientFormModal({ config, staff, onClose, onSaved, onUse, saveOnly }) {
  const { t, loc, lang } = useI18n(); const net = useNet(); const toast = useToast();
  const S = config.settings;
  const needAr = S.registration_require_name_ar === '1'; const needPhone = S.registration_require_phone === '1'; const needService = S.require_service_at_checkin === '1';
  const genders = useMemo(() => { try { return JSON.parse(S.gender_options) || []; } catch { return []; } }, [S.gender_options]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: S.timezone || 'Asia/Dubai' }).format(new Date());
  const [f, setF] = useState({ mrn_mode: 'auto', mrn: '', name: '', name_ar: '', dob: '', sex: '', phone: '', department_id: '', service_id: '', clinician_id: '' });
  const [errors, setErrors] = useState({}); const [formError, setFormError] = useState(''); const [dups, setDups] = useState(null); const [existing, setExisting] = useState(null); const [busy, setBusy] = useState(false);
  const key = useRef(newKey()); // one key per open form: a double click or a retry can never create a second patient
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value, ...(k === 'department_id' ? { service_id: '', clinician_id: '' } : {}) }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };
  const depts = config.departments.filter((d) => d.active);
  const services = config.services.filter((s) => s.active && String(s.department_id) === String(f.department_id));
  const clinicians = staff.filter((s) => s.role === 'clinician' && s.active && String(s.department_id) === String(f.department_id));
  const focusFirst = (errs) => { const order = ['mrn', 'name', 'name_ar', 'dob', 'sex', 'phone', 'department_id', 'service_id', 'clinician_id']; const k = order.find((x) => errs[x]); if (k) setTimeout(() => document.getElementById(`pf-${k}`)?.focus(), 30); };

  async function submit(checkIn, confirm = false) {
    if (busy) return;
    if (net.offline) { toast(t('offline'), true); return; }
    setErrors({}); setFormError(''); setDups(null); setExisting(null);
    if (checkIn && !f.department_id) { const e = { department_id: t('deptRequired') }; setErrors(e); focusFirst(e); return; }
    setBusy(true);
    const patient = { mrn_mode: f.mrn_mode, mrn: f.mrn_mode === 'manual' ? f.mrn : undefined, name: f.name, name_ar: f.name_ar, dob: f.dob, sex: f.sex, phone: f.phone, confirm_duplicate: confirm || undefined };
    try {
      if (checkIn) {
        const r = await api.post('/registrations', { idem_key: key.current, patient, department_id: Number(f.department_id), service_id: f.service_id ? Number(f.service_id) : undefined, clinician_id: f.clinician_id ? Number(f.clinician_id) : undefined });
        toast(`${t('patientSaved')}: ${r.patient.mrn} — ${t('checkedInAs')} ${r.queue.display}`); onSaved(r, true);
      } else {
        const r = await api.post('/patients', { ...patient, idem_key: key.current });
        toast(`${t('patientSaved')}: ${r.mrn}`); onSaved(r, false);
      }
      onClose();
    } catch (e) {
      if (e.code === 'NETWORK') toast(t('offline'), true);
      else if (e.code === 'VALIDATION') { const errs = e.details.fields || {}; setErrors(errs); setFormError(e.message); focusFirst(errs); }
      else if (e.code === 'MRN_DUPLICATE') { setErrors({ mrn: e.details.fields?.mrn || e.message }); setExisting(e.details.existing); focusFirst({ mrn: 1 }); }
      else if (e.code === 'POSSIBLE_DUPLICATE') setDups(e.details.candidates || []);
      else setFormError(e.message);
    } finally { setBusy(false); }
  }

  return (
    <Modal wide title={t('registerPatient')} onClose={onClose}>
      <div className="stack" role="group" aria-label={t('registerPatient')} onKeyDown={(e) => e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'radio' && submit(false)}>
        <p className="small muted"><span className="req" aria-hidden="true">*</span> {t('requiredWord')}</p>
        {formError && <div className="banner bad" role="alert">{formError}</div>}
        {dups && (
          <div className="banner warn" role="alert">
            <b>{t('possibleDup')}</b>
            <div className="stack" style={{ marginTop: 8 }}>
              {dups.map((d) => (
                <div key={d.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <span>{loc(d)} · {d.mrn}{d.dob ? ` · ${d.dob}` : ''}{d.phone ? ` · ${d.phone}` : ''}</span>
                  <button type="button" className="btn sm" onClick={() => { onUse(d); onClose(); }}>{t('useThisPatient')}</button>
                </div>
              ))}
              <button type="button" className="btn ghost sm" disabled={busy} onClick={() => submit(false, true)}>{t('registerAnyway')}</button>
            </div>
          </div>
        )}
        <h3>{t('patientDetails')}</h3>
        <fieldset className="mrn-box">
          <legend>{t('mrnLabel')} <span className="req" aria-hidden="true">*</span></legend>
          <div className="row">
            {['auto', 'manual'].map((m) => (
              <label key={m} className="chk"><input type="radio" name="pf-mrn-mode" checked={f.mrn_mode === m} onChange={() => { setF({ ...f, mrn_mode: m }); setErrors({ ...errors, mrn: undefined }); }} />{t(m === 'auto' ? 'mrnAuto' : 'mrnManual')}</label>
            ))}
          </div>
          {f.mrn_mode === 'manual'
            ? <Field id="pf-mrn" label={t('mrnLabel')} required error={errors.mrn} hint={t('mrnManualHint')}>
                <input {...aria('pf-mrn', errors.mrn, true, true)} dir="ltr" autoCapitalize="characters" maxLength={30} value={f.mrn} onChange={set('mrn')} />
                {existing && <div className="small">{t('mrnTaken')}: <b>{loc(existing)}</b> ({existing.mrn}) <button type="button" className="btn ghost sm" onClick={() => { onUse(existing); onClose(); }}>{t('useThisPatient')}</button></div>}
              </Field>
            : <small className="hint">{t('mrnAutoHint')}</small>}
        </fieldset>
        <div className="form-grid two">
          <Field id="pf-name" label={t('fullNameEn')} required error={errors.name}>
            <input {...aria('pf-name', errors.name, false, true)} autoComplete="off" maxLength={120} value={f.name} onChange={set('name')} />
          </Field>
          <Field id="pf-name_ar" label={t('fullNameAr')} required={needAr} error={errors.name_ar}>
            <input {...aria('pf-name_ar', errors.name_ar, false, needAr)} dir="rtl" lang="ar" autoComplete="off" maxLength={120} value={f.name_ar} onChange={set('name_ar')} />
          </Field>
          <Field id="pf-dob" label={t('dob')} error={errors.dob}>
            <input {...aria('pf-dob', errors.dob)} type="date" min="1900-01-01" max={today} value={f.dob} onChange={set('dob')} />
          </Field>
          <Field id="pf-sex" label={t('gender')} error={errors.sex}>
            <select {...aria('pf-sex', errors.sex)} value={f.sex} onChange={set('sex')}><option value="">—</option>{genders.map((g) => <option key={g.code} value={g.code}>{lang === 'ar' && g.ar ? g.ar : g.en}</option>)}</select>
          </Field>
          <Field id="pf-phone" label={t('contactNumber')} required={needPhone} error={errors.phone} hint={t('phoneHint')}>
            <input {...aria('pf-phone', errors.phone, true, needPhone)} type="tel" inputMode="tel" dir="ltr" autoComplete="off" placeholder="+971 50 123 4567" maxLength={24} value={f.phone} onChange={set('phone')} />
          </Field>
        </div>
        <div hidden={!!saveOnly}><h3>{t('visitDetails')}</h3>
        <div className="form-grid two">
          <Field id="pf-department_id" label={t('department')} note={t('requiredForCheckIn')} error={errors.department_id}>
            <select {...aria('pf-department_id', errors.department_id)} value={f.department_id} onChange={set('department_id')}><option value="">—</option>{depts.map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select>
          </Field>
          <Field id="pf-service_id" label={t('service')} required={needService && !!f.department_id} note={needService ? t('requiredForCheckIn') : undefined} error={errors.service_id} hint={f.department_id ? undefined : t('selectDeptFirst')}>
            <select {...aria('pf-service_id', errors.service_id, !f.department_id)} disabled={!f.department_id} value={f.service_id} onChange={set('service_id')}><option value="">—</option>{services.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select>
          </Field>
          <Field id="pf-clinician_id" label={t('clinician')} error={errors.clinician_id}>
            <select {...aria('pf-clinician_id', errors.clinician_id)} disabled={!f.department_id} value={f.clinician_id} onChange={set('clinician_id')}><option value="">—</option>{clinicians.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select>
          </Field>
        </div></div>
        <div className="row form-actions">
          <button type="button" className="btn" hidden={!!saveOnly} disabled={busy} onClick={() => submit(true)}>{busy ? t('saving') : t('saveCheckIn')}</button>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => submit(false)}>{t('savePatient')}</button>
          <button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
    </Modal>
  );
}

/** Corrects an existing patient's details. The EMR number is shown but never editable; previous values stay in the change history. */
export function PatientEditModal({ patient, config, onClose, onSaved }) {
  const { t, fmtDT } = useI18n(); const toast = useToast();
  const genders = useMemo(() => { try { return JSON.parse(config.settings.gender_options) || []; } catch { return []; } }, [config.settings.gender_options]);
  const [f, setF] = useState({ name: patient.name || '', name_ar: patient.name_ar || '', dob: patient.dob || '', sex: patient.sex || '', phone: patient.phone || '' });
  const [errs, setErrs] = useState({}); const [dups, setDups] = useState(null); const [busy, setBusy] = useState(false); const [hist, setHist] = useState(null);
  const save = async (confirm) => {
    setBusy(true); setErrs({});
    try { const r = await api.patch(`/patients/${patient.id}`, { ...f, ...(confirm ? { confirm_duplicate: true } : {}) }); toast(t('saSaved')); onSaved(r); onClose(); }
    catch (e) { if (e.code === 'POSSIBLE_DUPLICATE') setDups(e.details?.existing || []); else { setErrs(e.details?.fields || {}); toast(e.message, true); } }
    finally { setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={t('editPatient')} onClose={onClose}><div className="stack" data-testid="patient-edit">
      <p className="small muted">{t('emrFixed')}: <b>{patient.mrn}</b></p>
      <Field id="pe-name" label={t('name')} required error={errs.name}><input {...aria('pe-name', errs.name, null, true)} value={f.name} onChange={set('name')} /></Field>
      <Field id="pe-name-ar" label={t('nameAr')} error={errs.name_ar}><input {...aria('pe-name-ar', errs.name_ar)} dir="rtl" value={f.name_ar} onChange={set('name_ar')} /></Field>
      <div className="form-grid">
        <Field id="pe-dob" label={t('dob')} error={errs.dob}><input {...aria('pe-dob', errs.dob)} type="date" value={f.dob} onChange={set('dob')} /></Field>
        <Field id="pe-sex" label={t('sex')} error={errs.sex}><select {...aria('pe-sex', errs.sex)} value={f.sex} onChange={set('sex')}><option value="">—</option>{genders.map((g) => <option key={g.code} value={g.code}>{g.en}</option>)}</select></Field></div>
      <Field id="pe-phone" label={t('phone')} error={errs.phone}><input {...aria('pe-phone', errs.phone)} value={f.phone} onChange={set('phone')} /></Field>
      {dups && <div className="banner warn" role="alert">{t('dupWarn')} {dups.map((d) => `${d.name} (${d.mrn})`).join(', ')}<div className="row"><button className="btn sm" onClick={() => save(true)}>{t('dupConfirm')}</button></div></div>}
      <div className="row"><button className="btn" disabled={busy || !f.name.trim()} onClick={() => save(false)}>{t('save')}</button>
        <button className="btn ghost sm" onClick={async () => { try { setHist(await api.get(`/patients/${patient.id}/changes`)); } catch (e) { toast(e.message, true); } }}>{t('changeHistory')}</button></div>
      {hist && (hist.length === 0 ? <p className="muted small">{t('noChanges')}</p> : <div className="tbl"><table data-testid="patient-history"><tbody>{hist.map((h) => <tr key={h.id}><td className="small">{fmtDT(h.ts)} · {h.actor}</td><td className="small">{Object.entries(h.changes).map(([k, v]) => `${k}: ${v.from ?? '—'} → ${v.to ?? '—'}`).join('; ')}</td></tr>)}</tbody></table></div>)}
    </div></Modal>);
}
