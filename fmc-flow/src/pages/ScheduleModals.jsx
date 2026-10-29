import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Modal, useToast } from '../ui.jsx';
import PatientFormModal from './PatientForm.jsx';

const QUICK = [20, 30, 40, 45, 50, 55, 60];
const fill = (txt, vars) => Object.entries(vars).reduce((a, [k, v]) => a.replace(`{${k}}`, v), txt);
const errOf = (e) => e?.details || {};

/** Existing patient database lookup (MRN, English name, Arabic name, phone). New patients use the existing registration form (save only, no check-in). */
export function PatientPicker({ value, onChange, config, staff, locked }) {
  const { t, loc } = useI18n();
  const [q, setQ] = useState(''); const [found, setFound] = useState(null); const [open, setOpen] = useState(false); const seq = useRef(0);
  const search = async (v) => {
    setQ(v); const n = ++seq.current;
    if (v.trim().length < 2) return setFound(null);
    try { const r = await api.get(`/patients?q=${encodeURIComponent(v.trim())}`); if (n === seq.current) setFound(r); } catch { /* the connection banner explains */ }
  };
  if (value) return (
    <div className="sch-patient" aria-live="polite">
      <div><span className="muted small">{t('dsSelected')}</span><div><b>{loc(value)}</b> · {value.mrn}{value.phone ? ` · ${value.phone}` : ''}</div></div>
      {!locked && <button type="button" className="btn ghost sm" onClick={() => onChange(null)}>{t('dsChange')}</button>}
    </div>);
  return (
    <div className="stack">
      <input id="ds-patient-q" autoFocus placeholder={t('dsFindPatient')} aria-label={t('dsFindPatient')} value={q} onChange={(e) => search(e.target.value)} autoComplete="off" />
      {found?.length === 0 && <p className="muted small">{t('noResults')}</p>}
      <div className="sch-results">{found?.slice(0, 8).map((x) => (
        <button key={x.id} type="button" className="btn ghost patient-row" onClick={() => { onChange(x); setFound(null); }}>
          <b>{loc(x)}</b><span className="muted small">{x.mrn}{x.phone ? ` · ${x.phone}` : ''}{x.dob ? ` · ${x.dob}` : ''}</span>
        </button>))}</div>
      <button type="button" className="btn ghost sm" onClick={() => setOpen(true)}>＋ {t('dsNewPatient')}</button>
      {open && <PatientFormModal saveOnly config={config} staff={staff} onClose={() => setOpen(false)} onUse={(x) => onChange(x)} onSaved={(r) => onChange(r.patient || r)} />}
    </div>);
}

/** Add / edit / reschedule / copy an appointment. Clicking an empty slot prefills row, clinician, department, date and time. */
export function AppointmentModal({ mode = 'add', appt, prefill = {}, board, config, staff, onClose, onDone }) {
  const { t, loc, lang } = useI18n(); const toast = useToast();
  const rows = useMemo(() => board.groups.flatMap((g) => g.rows.map((r) => ({ ...r, group: g }))), [board]);
  const rowOf = (id) => rows.find((r) => String(r.id) === String(id));
  const init = appt || {};
  const [patient, setPatient] = useState(appt ? { id: appt.patient_id, name: appt.patient_name, name_ar: appt.patient_name_ar, mrn: appt.mrn, phone: appt.phone } : (prefill.patient || null));
  const r0 = rowOf(prefill.row_id ?? init.row_id);
  const [f, setF] = useState({
    department_id: String(init.department_id ?? prefill.department_id ?? r0?.department_id ?? r0?.group.department_id ?? config.scope_department ?? ''),
    service_id: String(init.service_id ?? prefill.service_id ?? ''), clinician_id: String(init.clinician_id ?? prefill.clinician_id ?? r0?.user_id ?? ''),
    row_id: String(prefill.row_id ?? init.row_id ?? ''), date: prefill.date || init.date || board.date, time: prefill.time || init.start_local || '',
    category_id: String(init.category_id ?? prefill.category_id ?? ''), duration: String(init.duration_minutes ?? prefill.duration_minutes ?? ''), notes: init.notes ?? prefill.notes ?? '',
    rec: 'none', recCount: '4', recUntil: '', skip: false,
  });
  const [durTouched, setDurTouched] = useState(!!init.duration_minutes || !!prefill.duration_minutes);
  const [conf, setConf] = useState(null); const [reason, setReason] = useState(''); const [useOverride, setUseOverride] = useState(false);
  const [errs, setErrs] = useState({}); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const dept = config.departments.find((d) => String(d.id) === String(f.department_id));
  const services = config.services.filter((s) => s.active && String(s.department_id) === String(f.department_id));
  const clinicians = staff.filter((s) => s.active && s.role === 'clinician' && (!f.department_id || String(s.department_id) === String(f.department_id)));
  const cats = board.categories.filter((c) => c.active || String(c.id) === f.category_id);
  const cat = cats.find((c) => String(c.id) === f.category_id); const svc = services.find((s) => String(s.id) === f.service_id);
  const suggestion = cat?.default_minutes ? [cat.default_minutes, 'dsSrcCategory'] : svc?.default_minutes ? [svc.default_minutes, 'dsSrcService'] : [board.default_minutes, 'dsSrcDefault'];
  useEffect(() => { if (!durTouched) setF((s) => ({ ...s, duration: String(suggestion[0]) })); }, [f.category_id, f.service_id, durTouched]); // eslint-disable-line react-hooks/exhaustive-deps
  const title = { add: t('dsAddAppt'), edit: t('dsEdit'), move: t('dsReschedule'), copy: t('dsCopy') }[mode];
  const rowChoices = rows.filter((r) => !f.department_id || r.department_id == null || String(r.department_id) === String(f.department_id) || String(r.group.department_id) === String(f.department_id));

  const submit = async () => {
    setErrs({}); setBusy(true);
    const body = { patient_id: patient?.id, department_id: Number(f.department_id) || undefined, service_id: f.service_id ? Number(f.service_id) : null, clinician_id: f.clinician_id ? Number(f.clinician_id) : null,
      row_id: f.row_id ? Number(f.row_id) : null, date: f.date, time: f.time, category_id: f.category_id ? Number(f.category_id) : null, duration_minutes: f.duration ? Number(f.duration) : undefined, notes: f.notes };
    if (useOverride) body.override = { reason };
    try {
      let r;
      if (mode === 'edit' || mode === 'move') r = await api.patch(`/schedule/appointments/${appt.id}`, body);
      else {
        if (f.rec !== 'none') { body.recurrence = { freq: f.rec, ...(f.recCount ? { count: Number(f.recCount) } : {}), ...(f.recUntil ? { until: f.recUntil } : {}) }; if (f.skip) body.skip_conflicts = true; }
        if (prefill.waiting_id) body.waiting_id = prefill.waiting_id; if (prefill.rebooks_id) body.rebooks_id = prefill.rebooks_id; if (mode === 'copy') body.copy_of = appt.id;
        r = await api.post('/schedule/appointments', body);
      }
      const n = r.appointments?.length || 1;
      toast(`${t('dsSaved')}${n > 1 ? ` (${n})` : ''}${r.skipped?.length ? ` — ${r.skipped.length} skipped` : ''}`); onDone(); onClose();
    } catch (e) {
      if (e.code === 'CONFLICT') setConf({ message: e.message, list: e.details?.conflicts || [], overridable: !!e.details?.overridable });
      else if (e.code === 'VALIDATION') { setErrs(e.details?.fields || {}); toast(e.message, true); }
      else if (e.code === 'NETWORK') toast(t('offline'), true); else toast(e.message, true);
    } finally { setBusy(false); }
  };
  const ok = patient && f.department_id && f.date && f.time && (!useOverride || reason.trim());
  const F = ({ id, label, err, children }) => <div className="field"><label htmlFor={id}>{label}</label>{children}{err && <div className="field-err" role="alert">{err}</div>}</div>;
  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="stack">
        <PatientPicker value={patient} onChange={setPatient} config={config} staff={staff} locked={mode === 'edit' || mode === 'move'} />
        {errs.patient_id && <div className="field-err" role="alert">{errs.patient_id}</div>}
        <div className="form-grid">
          <F id="ds-dept" label={t('department')} err={errs.department_id}><select id="ds-dept" value={f.department_id} onChange={(e) => setF({ ...f, department_id: e.target.value, service_id: '', row_id: '', clinician_id: '' })}><option value="">—</option>{config.departments.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select></F>
          <F id="ds-svc" label={t('service')} err={errs.service_id}><select id="ds-svc" value={f.service_id} onChange={set('service_id')}><option value="">—</option>{services.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></F>
          <F id="ds-clin" label={t('clinician')} err={errs.clinician_id}><select id="ds-clin" value={f.clinician_id} onChange={set('clinician_id')}><option value="">—</option>{clinicians.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></F>
          <F id="ds-row" label={t('dsRow')} err={errs.row_id}><select id="ds-row" value={f.row_id} onChange={(e) => { const r = rowOf(e.target.value); setF({ ...f, row_id: e.target.value, ...(r?.user_id ? { clinician_id: String(r.user_id) } : {}) }); }}><option value="">{t('dsNoRow')}</option>{rowChoices.map((r) => <option key={r.id} value={r.id}>{(lang === 'ar' && r.label_ar) || r.label || (lang === 'ar' && r.staff_name_ar) || r.staff_name}</option>)}</select></F>
          <F id="ds-date" label={t('dsDate')} err={errs.date}><input id="ds-date" type="date" value={f.date} onChange={set('date')} /></F>
          <F id="ds-time" label={t('dsTime')} err={errs.time}><input id="ds-time" type="time" value={f.time} onChange={set('time')} /></F>
          <F id="ds-cat" label={t('dsCategory')} err={errs.category_id}>
            <select id="ds-cat" value={f.category_id} onChange={set('category_id')}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{loc(c)}</option>)}</select>
            {cat && <span className="sch-swatch" style={{ background: cat.color }} aria-hidden="true" />}</F>
          <F id="ds-dur" label={t('dsDuration')} err={errs.duration_minutes}>
            <input id="ds-dur" type="number" min="5" max="480" step="1" value={f.duration} onChange={(e) => { setDurTouched(true); setF({ ...f, duration: e.target.value }); }} />
            <div className="row" style={{ marginTop: 4 }}>{QUICK.map((m) => <button key={m} type="button" className={`btn sm ${String(m) === String(f.duration) ? '' : 'ghost'}`} onClick={() => { setDurTouched(true); setF({ ...f, duration: String(m) }); }}>{m}</button>)}</div>
            {!durTouched && <small className="hint">{fill(t('dsSuggested'), { src: t(suggestion[1]) })}: {suggestion[0]}</small>}</F>
        </div>
        <F id="ds-notes" label={t('dsNotes')}><textarea id="ds-notes" rows={2} maxLength={1000} value={f.notes} onChange={set('notes')} /></F>
        {(mode === 'add' || mode === 'copy') && (
          <div className="form-grid">
            <F id="ds-rec" label={t('dsRepeat')} err={errs.recurrence}><select id="ds-rec" value={f.rec} onChange={set('rec')}><option value="none">{t('dsNoRepeat')}</option><option value="daily">{t('dsDaily')}</option><option value="weekly">{t('dsWeekly')}</option></select></F>
            {f.rec !== 'none' && <>
              <F id="ds-rc" label={t('dsOccurrences')}><input id="ds-rc" type="number" min="1" max="52" value={f.recCount} onChange={set('recCount')} /></F>
              <F id="ds-ru" label={t('dsUntil')}><input id="ds-ru" type="date" value={f.recUntil} onChange={set('recUntil')} /></F>
              <label className="chk"><input type="checkbox" checked={f.skip} onChange={(e) => setF({ ...f, skip: e.target.checked })} />{t('dsSkipConflicts')}</label></>}
          </div>)}
        {conf && (
          <div className="banner bad" role="alert"><b>{t('dsConflict')}.</b> {conf.message}
            {conf.list.length > 0 && <ul className="small">{conf.list.map((c, i) => <li key={i}>{c.message}</li>)}</ul>}
            {conf.overridable && board.me.can_override && (
              <div className="stack"><label className="chk"><input type="checkbox" checked={useOverride} onChange={(e) => setUseOverride(e.target.checked)} />{t('dsOverride')}</label>
                {useOverride && <input aria-label={t('dsOverrideReason')} placeholder={t('dsOverrideReason')} value={reason} onChange={(e) => setReason(e.target.value)} />}
                <small>{t('dsOverrideNote')}</small></div>)}
          </div>)}
        <div className="row"><button type="button" className="btn" disabled={busy || !ok} onClick={submit}>{t('dsSave')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
      </div>
    </Modal>);
}

export function DetailsModal({ appt, board, onClose, onAction, onDone }) {
  const { t, loc, fmt } = useI18n(); const toast = useToast(); const [hist, setHist] = useState(null); const [cancelling, setCancelling] = useState(false); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const can = board.me.can_manage; const editable = appt.status === 'SCHEDULED';
  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); if (ok) toast(ok); onDone(); return r; } catch (e) { toast(e.code === 'NETWORK' ? t('offline') : e.message, true); } finally { setBusy(false); } };
  const loadHist = async () => { try { setHist(await api.get(`/schedule/appointments/${appt.id}/history`)); } catch (e) { toast(e.message, true); } };
  return (
    <Modal title={`${t('dsDetails')} ${appt.ref}`} onClose={onClose}>
      <div className="stack">
        <div className="sch-patient"><div><b>{loc(appt, 'patient_name') || appt.patient_name}</b> · {appt.mrn}{appt.phone ? ` · ${appt.phone}` : ''}</div></div>
        <dl className="tgrid">
          <div><dt>{t('dsDate')}</dt><dd>{appt.date}</dd></div><div><dt>{t('dsTime')}</dt><dd>{appt.start_local}–{appt.end_local} ({appt.duration_minutes} {t('minShort')})</dd></div>
          <div><dt>{t('department')}</dt><dd>{appt.department}</dd></div><div><dt>{t('service')}</dt><dd>{loc(appt, 'service') || '—'}</dd></div>
          <div><dt>{t('clinician')}</dt><dd>{loc(appt, 'clinician') || '—'}</dd></div>
          <div><dt>{t('dsCategory')}</dt><dd>{appt.category ? <span className="sch-cat" style={{ background: appt.category_color }}>{loc(appt, 'category')}</span> : '—'}</dd></div>
          <div><dt>{t('status')}</dt><dd>{t(`dsStatus_${appt.status}`)}</dd></div>{appt.recurrence_id && <div><dt>{t('dsSeries')}</dt><dd>{appt.recurrence_id}</dd></div>}
        </dl>
        {appt.notes && <p className="small">{appt.notes}</p>}
        {can && editable && !cancelling && (
          <div className="row">
            <button className="btn sm" onClick={() => onAction('edit', appt)}>{t('dsEdit')}</button>
            <button className="btn sm" onClick={() => onAction('move', appt)}>{t('dsReschedule')}</button>
            <button className="btn ghost sm" onClick={() => onAction('copy', appt)}>{t('dsCopy')}</button>
            <button className="btn ghost sm" disabled={busy} onClick={() => run(() => api.post(`/schedule/appointments/${appt.id}/arrive`), t('dsArrived')).then((r) => r && onClose())}>{t('dsArrived')}</button>
            <button className="btn red sm" onClick={() => setCancelling(true)}>{t('dsCancelAppt')}</button>
          </div>)}
        {can && !editable && <div className="row"><button className="btn ghost sm" onClick={() => onAction('copy', appt)}>{t('dsCopy')}</button></div>}
        {cancelling && (
          <div className="stack"><input id="ds-cancel-reason" autoFocus aria-label={t('dsCancelReason')} placeholder={t('dsCancelReason')} value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="row"><button className="btn red sm" disabled={busy || !reason.trim()} onClick={() => run(() => api.post(`/schedule/appointments/${appt.id}/cancel`, { reason }), t('dsStatus_CANCELLED')).then((r) => r && onClose())}>{t('dsConfirmCancel')}</button><button className="btn ghost sm" onClick={() => setCancelling(false)}>{t('cancel')}</button></div></div>)}
        <div><button className="btn ghost sm" onClick={loadHist}>{t('dsHistory')}</button>
          {hist && <ol className="sch-history">{hist.map((h) => <li key={h.id}><b>{h.action}</b> <span className="muted small">{fmt(h.ts, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {h.actor || '—'}</span>
            {h.detail?.reason && <div className="small">{h.detail.reason}</div>}{h.detail?.override_reason && <div className="small">{t('dsOverride')}: {h.detail.override_reason}</div>}</li>)}</ol>}</div>
      </div>
    </Modal>);
}

export function BlockModal({ board, config, prefill = {}, onClose, onDone }) {
  const { t, loc } = useI18n(); const toast = useToast();
  const rows = board.groups.flatMap((g) => g.rows.map((r) => ({ ...r, group: g })));
  const [f, setF] = useState({ row_id: String(prefill.row_id || ''), group_id: String(prefill.group_id || board.groups[0]?.id || ''), date: board.date, start: prefill.time || '12:00', end: '13:00', kind: 'BREAK', note: '', rec: 'none', count: '4' });
  const [errs, setErrs] = useState({}); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setBusy(true); setErrs({});
    try {
      const body = { row_id: f.row_id ? Number(f.row_id) : undefined, group_id: Number(f.group_id) || undefined, date: f.date, start_time: f.start, end_time: f.end, kind: f.kind, note: f.note, ...(f.rec !== 'none' ? { recurrence: { freq: f.rec, count: Number(f.count) } } : {}) };
      const r = await api.post('/schedule/blocks', body);
      toast(t('dsBlockSaved')); if (r.existing_appointments_in_period) toast(fill(t('dsBlockAffected'), { n: r.existing_appointments_in_period }), true); onDone(); onClose();
    } catch (e) { if (e.code === 'VALIDATION') setErrs(e.details?.fields || {}); toast(e.message, true); } finally { setBusy(false); }
  };
  return (
    <Modal title={t('dsBlock')} onClose={onClose}>
      <div className="stack">
        <div className="form-grid">
          <div className="field"><label htmlFor="bk-row">{t('dsBlockWho')}</label><select id="bk-row" value={f.row_id} onChange={set('row_id')}><option value="">{t('dsWholeGroup')}</option>{rows.map((r) => <option key={r.id} value={r.id}>{r.label || r.staff_name}</option>)}</select></div>
          {!f.row_id && <div className="field"><label htmlFor="bk-group">{t('dsGroup')}</label><select id="bk-group" value={f.group_id} onChange={set('group_id')}>{board.groups.map((g) => <option key={g.id} value={g.id}>{loc(g)}</option>)}</select>{errs.group_id && <div className="field-err">{errs.group_id}</div>}</div>}
          <div className="field"><label htmlFor="bk-kind">{t('dsBlock')}</label><select id="bk-kind" value={f.kind} onChange={set('kind')}>{['BREAK', 'LEAVE', 'MEETING', 'MAINTENANCE', 'OTHER'].map((k) => <option key={k} value={k}>{t(`dsBlock_${k}`)}</option>)}</select></div>
          <div className="field"><label htmlFor="bk-date">{t('dsDate')}</label><input id="bk-date" type="date" value={f.date} onChange={set('date')} />{errs.date && <div className="field-err">{errs.date}</div>}</div>
          <div className="field"><label htmlFor="bk-s">{t('dsStart')}</label><input id="bk-s" type="time" value={f.start} onChange={set('start')} />{errs.start_time && <div className="field-err">{errs.start_time}</div>}</div>
          <div className="field"><label htmlFor="bk-e">{t('dsEnd')}</label><input id="bk-e" type="time" value={f.end} onChange={set('end')} />{errs.end_time && <div className="field-err">{errs.end_time}</div>}</div>
          <div className="field"><label htmlFor="bk-rec">{t('dsRepeat')}</label><select id="bk-rec" value={f.rec} onChange={set('rec')}><option value="none">{t('dsNoRepeat')}</option><option value="daily">{t('dsDaily')}</option><option value="weekly">{t('dsWeekly')}</option></select></div>
          {f.rec !== 'none' && <div className="field"><label htmlFor="bk-n">{t('dsOccurrences')}</label><input id="bk-n" type="number" min="1" max="52" value={f.count} onChange={set('count')} />{errs.recurrence && <div className="field-err">{errs.recurrence}</div>}</div>}
        </div>
        <div className="field"><label htmlFor="bk-note">{t('dsNotes')}</label><input id="bk-note" maxLength={200} value={f.note} onChange={set('note')} /></div>
        <div className="row"><button className="btn" disabled={busy} onClick={submit}>{t('save')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
      </div>
    </Modal>);
}

export function BlockDetailsModal({ block, onClose, onDone }) {
  const { t } = useI18n(); const toast = useToast(); const [busy, setBusy] = useState(false);
  const rm = async (all) => { setBusy(true); try { await api.post(`/schedule/blocks/${block.id}/remove`, { whole_series: all }); toast(t('dsRemoveBlock')); onDone(); onClose(); } catch (e) { toast(e.message, true); } finally { setBusy(false); } };
  return (
    <Modal title={`${t('dsBlock_' + block.kind)} · ${block.start_local}–${block.end_local}`} onClose={onClose}>
      <div className="stack">{block.note && <p>{block.note}</p>}
        <div className="row"><button className="btn red sm" disabled={busy} onClick={() => rm(false)}>{t('dsRemoveBlock')}</button>{block.series_id && <button className="btn ghost sm" disabled={busy} onClick={() => rm(true)}>{t('dsRemoveSeries')}</button>}<button className="btn ghost sm" onClick={onClose}>{t('dsClose')}</button></div></div>
    </Modal>);
}

/** Add one row, or add time columns (one time or a range with its own interval) to a timetable group. */
export function AddRowModal({ board, config, staff, onClose, onDone }) {
  const { t, loc } = useI18n(); const toast = useToast();
  const [f, setF] = useState({ group_id: String(board.groups[0]?.id || ''), user_id: '', label: '', label_ar: '', capacity: '1' }); const [errs, setErrs] = useState({});
  const g = board.groups.find((x) => String(x.id) === f.group_id);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setErrs({});
    try { await api.post('/config/schedule_rows', { group_id: Number(f.group_id), user_id: f.user_id ? Number(f.user_id) : null, label: f.label, label_ar: f.label_ar, capacity: Number(f.capacity), department_id: g?.department_id ?? null, sort_order: 1000 + g.rows.length }); toast(t('dsRowAdded')); onDone(); onClose(); }
    catch (e) { if (e.code === 'VALIDATION') setErrs(e.details?.fields || {}); toast(e.message, true); }
  };
  return (
    <Modal title={t('dsAddRow')} onClose={onClose}>
      <div className="stack">
        <div className="field"><label htmlFor="ar-g">{t('dsGroup')}</label><select id="ar-g" value={f.group_id} onChange={set('group_id')}>{board.groups.map((x) => <option key={x.id} value={x.id}>{loc(x)}</option>)}</select></div>
        <div className="field"><label htmlFor="ar-u">{t('dsStaffMember')}</label><select id="ar-u" value={f.user_id} onChange={set('user_id')}><option value="">—</option>{staff.filter((s) => s.active && (!g?.department_id || s.department_id === g.department_id || s.role !== 'clinician')).map((s) => <option key={s.id} value={s.id}>{loc(s)} ({s.role})</option>)}</select>{errs.user_id && <div className="field-err">{errs.user_id}</div>}</div>
        <div className="field"><label htmlFor="ar-l">{t('dsLabel')}</label><input id="ar-l" value={f.label} onChange={set('label')} />{errs.label && <div className="field-err">{errs.label}</div>}</div>
        <div className="field"><label htmlFor="ar-la">{t('dsLabelAr')}</label><input id="ar-la" dir="rtl" value={f.label_ar} onChange={set('label_ar')} /></div>
        <div className="field"><label htmlFor="ar-c">{t('dsCapacity')}</label><input id="ar-c" type="number" min="1" max="50" value={f.capacity} onChange={set('capacity')} />{errs.capacity && <div className="field-err">{errs.capacity}</div>}</div>
        <div className="row"><button className="btn" onClick={submit}>{t('save')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
      </div>
    </Modal>);
}

export function AddColumnModal({ board, onClose, onDone }) {
  const { t, loc } = useI18n(); const toast = useToast();
  const [f, setF] = useState({ group_id: String(board.groups[0]?.id || ''), mode: 'one', time: '', start: '09:00', end: '12:00', interval: String(board.groups[0]?.interval_minutes || 30), label: '' }); const [errs, setErrs] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setErrs({});
    try {
      const body = f.mode === 'one' ? { group_id: Number(f.group_id), time: f.time, label: f.label } : { group_id: Number(f.group_id), start: f.start, end: f.end, interval: Number(f.interval), label: f.label };
      const r = await api.post('/schedule/columns/bulk', body); toast(fill(t('dsAdded'), { n: r.added })); onDone(); onClose();
    } catch (e) { if (e.code === 'VALIDATION') setErrs(e.details?.fields || {}); toast(e.message, true); }
  };
  return (
    <Modal title={t('dsAddCol')} onClose={onClose}>
      <div className="stack">
        <div className="field"><label htmlFor="ac-g">{t('dsGroup')}</label><select id="ac-g" value={f.group_id} onChange={set('group_id')}>{board.groups.map((x) => <option key={x.id} value={x.id}>{loc(x)} ({x.interval_minutes} {t('minShort')})</option>)}</select></div>
        <div className="row"><label className="chk"><input type="radio" name="acm" checked={f.mode === 'one'} onChange={() => setF({ ...f, mode: 'one' })} />{t('dsSingleTime')}</label><label className="chk"><input type="radio" name="acm" checked={f.mode === 'range'} onChange={() => setF({ ...f, mode: 'range' })} />{t('dsTimeRange')}</label></div>
        {f.mode === 'one' ? <div className="field"><label htmlFor="ac-t">{t('dsTime')}</label><input id="ac-t" type="time" value={f.time} onChange={set('time')} />{errs.time && <div className="field-err">{errs.time}</div>}</div>
          : <div className="form-grid"><div className="field"><label htmlFor="ac-s">{t('dsStart')}</label><input id="ac-s" type="time" value={f.start} onChange={set('start')} /></div><div className="field"><label htmlFor="ac-e">{t('dsEnd')}</label><input id="ac-e" type="time" value={f.end} onChange={set('end')} />{errs.end && <div className="field-err">{errs.end}</div>}</div><div className="field"><label htmlFor="ac-i">{t('dsInterval')}</label><input id="ac-i" type="number" min="5" max="240" value={f.interval} onChange={set('interval')} /></div></div>}
        <div className="field"><label htmlFor="ac-l">{t('dsColLabel')}</label><input id="ac-l" maxLength={24} value={f.label} onChange={set('label')} /></div>
        <div className="row"><button className="btn" onClick={submit}>{t('save')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
      </div>
    </Modal>);
}

/** Administrator layout manager: rename, reorder, hide/show and safely remove rows and columns; add groups; sync staff. */
export function LayoutModal({ board, config, onClose, onChanged }) {
  const { t, loc } = useI18n(); const toast = useToast(); const [busy, setBusy] = useState(false);
  const act = async (fn, ok) => { setBusy(true); try { const r = await fn(); if (ok) toast(typeof ok === 'function' ? ok(r) : ok); await onChanged(); } catch (e) { toast(e.code === 'NETWORK' ? t('offline') : e.message, true); } finally { setBusy(false); } };
  const [newGroup, setNewGroup] = useState({ name: '', interval: '30', department_id: '' });
  const move = (g, i, d) => { const ids = g.rows.map((r) => r.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; return act(() => api.post('/schedule/rows/reorder', { ids })); };
  return (
    <Modal title={t('dsLayout')} onClose={onClose} wide>
      <div className="stack">
        <p className="small muted">{t('dsLayoutHelp')}</p>
        {board.groups.map((g) => (
          <fieldset key={g.id} className="mrn-box">
            <legend>{loc(g)}{!g.active && ` (${t('dsHidden')})`}</legend>
            <div className="row" style={{ marginBottom: 6 }}>
              <input aria-label={t('name')} defaultValue={g.name} style={{ maxWidth: 220 }} onBlur={(e) => e.target.value !== g.name && act(() => api.patch(`/config/schedule_groups/${g.id}`, { name: e.target.value }), t('save'))} />
              <label className="small">{t('dsInterval')} <input type="number" min="5" max="240" defaultValue={g.interval_minutes} style={{ width: 80 }} onBlur={(e) => Number(e.target.value) !== g.interval_minutes && act(() => api.patch(`/config/schedule_groups/${g.id}`, { interval_minutes: Number(e.target.value) }), t('save'))} /></label>
              <button className="btn ghost sm" disabled={busy} onClick={() => act(() => api.patch(`/config/schedule_groups/${g.id}`, { active: g.active ? 0 : 1 }))}>{g.active ? t('dsHide') : t('dsShow')}</button>
              <button className="btn ghost sm" disabled={busy} onClick={() => act(() => api.post(`/schedule/groups/${g.id}/sync-staff`), (r) => fill(t('dsAdded'), { n: r.added }))}>{t('dsSyncStaff')}</button>
            </div>
            <h4 style={{ margin: '8px 0 4px' }}>{t('dsRowsOf')}</h4>
            <div className="tbl"><table><tbody>{g.rows.map((r, i) => (
              <tr key={r.id} className={r.active ? '' : 'sch-hidden-row'}>
                <td style={{ whiteSpace: 'nowrap' }}><button className="btn ghost sm" aria-label={t('dsMoveUp')} disabled={busy || i === 0} onClick={() => move(g, i, -1)}>▲</button><button className="btn ghost sm" aria-label={t('dsMoveDown')} disabled={busy || i === g.rows.length - 1} onClick={() => move(g, i, 1)}>▼</button></td>
                <td><input aria-label={t('dsLabel')} defaultValue={r.label} placeholder={r.staff_name || ''} onBlur={(e) => e.target.value !== r.label && act(() => api.patch(`/config/schedule_rows/${r.id}`, { label: e.target.value }), t('save'))} />{r.staff_name && <div className="small muted">{r.staff_name}</div>}</td>
                <td><input aria-label={t('dsCapacity')} type="number" min="1" max="50" defaultValue={r.capacity} style={{ width: 70 }} onBlur={(e) => Number(e.target.value) !== r.capacity && act(() => api.patch(`/config/schedule_rows/${r.id}`, { capacity: Number(e.target.value) }), t('save'))} /></td>
                <td style={{ whiteSpace: 'nowrap' }}><button className="btn ghost sm" disabled={busy} onClick={() => act(() => api.patch(`/config/schedule_rows/${r.id}`, { active: r.active ? 0 : 1 }))}>{r.active ? t('dsHide') : t('dsShow')}</button>
                  <button className="btn ghost sm" disabled={busy} onClick={() => act(() => api.post(`/schedule/rows/${r.id}/remove`), t('dsRemove'))}>{t('dsRemove')}</button></td>
              </tr>))}</tbody></table></div>
            <h4 style={{ margin: '8px 0 4px' }}>{t('dsColsOf')}</h4>
            <div className="row">{g.columns.map((c) => (
              <span key={c.id} className={`sch-colchip ${c.active ? '' : 'sch-hidden-row'}`}>
                <input aria-label={t('dsTime')} type="time" defaultValue={c.time} onBlur={(e) => e.target.value && e.target.value !== c.time && act(() => api.patch(`/config/schedule_columns/${c.id}`, { time: e.target.value }), t('save'))} />
                <input aria-label={t('dsColLabel')} defaultValue={c.label} placeholder="…" style={{ width: 60 }} maxLength={24} onBlur={(e) => e.target.value !== c.label && act(() => api.patch(`/config/schedule_columns/${c.id}`, { label: e.target.value }), t('save'))} />
                <button className="btn ghost sm" aria-label={c.active ? t('dsHide') : t('dsShow')} disabled={busy} onClick={() => act(() => api.patch(`/config/schedule_columns/${c.id}`, { active: c.active ? 0 : 1 }))}>{c.active ? '◔' : '◉'}</button>
                <button className="btn ghost sm" aria-label={t('dsRemove')} disabled={busy} onClick={() => act(() => api.post(`/schedule/columns/${c.id}/remove`), t('dsRemove'))}>✕</button>
              </span>))}</div>
          </fieldset>))}
        <fieldset className="mrn-box"><legend>{t('dsAddGroup')}</legend>
          <div className="row">
            <input aria-label={t('name')} placeholder={t('name')} value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
            <select aria-label={t('department')} value={newGroup.department_id} onChange={(e) => setNewGroup({ ...newGroup, department_id: e.target.value })}><option value="">—</option>{config.departments.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select>
            <input aria-label={t('dsInterval')} type="number" min="5" max="240" style={{ width: 80 }} value={newGroup.interval} onChange={(e) => setNewGroup({ ...newGroup, interval: e.target.value })} />
            <button className="btn sm" disabled={busy || !newGroup.name.trim()} onClick={() => act(async () => { await api.post('/config/schedule_groups', { name: newGroup.name, department_id: newGroup.department_id ? Number(newGroup.department_id) : null, interval_minutes: Number(newGroup.interval), sort_order: 1000 }); setNewGroup({ name: '', interval: '30', department_id: '' }); }, t('save'))}>＋ {t('add')}</button>
          </div></fieldset>
      </div>
    </Modal>);
}

export function SetupModal({ onClose, onDone }) {
  const { t } = useI18n(); const toast = useToast();
  const [f, setF] = useState({ start: '09:00', end: '17:00', interval: '30' }); const [errs, setErrs] = useState({});
  const go = async () => { setErrs({}); try { const r = await api.post('/schedule/setup', { start: f.start, end: f.end, interval: Number(f.interval) }); toast(fill(t('dsAdded'), { n: r.created.length })); onDone(); onClose(); } catch (e) { if (e.code === 'VALIDATION') setErrs(e.details?.fields || {}); toast(e.message, true); } };
  return (
    <Modal title={t('dsSetup')} onClose={onClose}>
      <div className="stack"><p className="small muted">{t('dsSetupHelp')}</p>
        <div className="form-grid">
          <div className="field"><label htmlFor="su-s">{t('dsStart')}</label><input id="su-s" type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />{errs.start && <div className="field-err">{errs.start}</div>}</div>
          <div className="field"><label htmlFor="su-e">{t('dsEnd')}</label><input id="su-e" type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
          <div className="field"><label htmlFor="su-i">{t('dsInterval')}</label><input id="su-i" type="number" min="5" max="240" value={f.interval} onChange={(e) => setF({ ...f, interval: e.target.value })} />{errs.interval && <div className="field-err">{errs.interval}</div>}</div>
        </div>
        <div className="row"><button className="btn" onClick={go}>{t('dsSetup')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div></div>
    </Modal>);
}

/** Waiting-list entry or a call task, with an optional patient. */
export function ListItemModal({ kind, onClose, onDone, config, staff, board }) {
  const { t, loc } = useI18n(); const toast = useToast();
  const waiting = kind === 'WAITING';
  const [patient, setPatient] = useState(null); const [errs, setErrs] = useState({});
  const [f, setF] = useState({ department_id: String(config.scope_department ?? ''), clinician_id: '', preferred_date: '', preferred_time: '', contact_status: 'NOT_CONTACTED', notes: '', title: '', assigned_to: '', due_date: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setErrs({});
    try {
      if (waiting) await api.post('/schedule/waiting', { patient_id: patient?.id, department_id: Number(f.department_id) || undefined, clinician_id: f.clinician_id ? Number(f.clinician_id) : null, preferred_date: f.preferred_date || null, preferred_time: f.preferred_time || null, contact_status: f.contact_status, notes: f.notes });
      else await api.post('/schedule/tasks', { kind, patient_id: patient?.id, title: f.title, notes: f.notes, assigned_to: f.assigned_to ? Number(f.assigned_to) : null, due_date: f.due_date || null, department_id: f.department_id ? Number(f.department_id) : null });
      toast(t('save')); onDone(); onClose();
    } catch (e) { if (e.code === 'VALIDATION') setErrs(e.details?.fields || {}); toast(e.message, true); }
  };
  return (
    <Modal title={waiting ? t('dsAddWaiting') : t('dsAddTask')} onClose={onClose}>
      <div className="stack">
        <PatientPicker value={patient} onChange={setPatient} config={config} staff={staff} />{errs.patient_id && <div className="field-err">{errs.patient_id}</div>}
        {waiting ? <div className="form-grid">
          <div className="field"><label htmlFor="li-d">{t('department')}</label><select id="li-d" value={f.department_id} onChange={set('department_id')}><option value="">—</option>{config.departments.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select>{errs.department_id && <div className="field-err">{errs.department_id}</div>}</div>
          <div className="field"><label htmlFor="li-c">{t('dsPrefClinician')}</label><select id="li-c" value={f.clinician_id} onChange={set('clinician_id')}><option value="">—</option>{staff.filter((s) => s.active && s.role === 'clinician' && (!f.department_id || String(s.department_id) === f.department_id)).map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></div>
          <div className="field"><label htmlFor="li-pd">{t('dsPrefDate')}</label><input id="li-pd" type="date" value={f.preferred_date} onChange={set('preferred_date')} /></div>
          <div className="field"><label htmlFor="li-pt">{t('dsPrefTime')}</label><input id="li-pt" type="time" value={f.preferred_time} onChange={set('preferred_time')} /></div>
          <div className="field"><label htmlFor="li-cs">{t('dsContact')}</label><select id="li-cs" value={f.contact_status} onChange={set('contact_status')}>{['NOT_CONTACTED', 'CONTACTED', 'NO_ANSWER', 'WILL_CALL_BACK', 'CONFIRMED'].map((c) => <option key={c} value={c}>{t(`dsContact_${c}`)}</option>)}</select></div>
        </div> : <div className="form-grid">
          <div className="field"><label htmlFor="li-t">{t('dsTitle')}</label><input id="li-t" value={f.title} onChange={set('title')} />{errs.title && <div className="field-err">{errs.title}</div>}</div>
          <div className="field"><label htmlFor="li-a">{t('dsAssignee')}</label><select id="li-a" value={f.assigned_to} onChange={set('assigned_to')}><option value="">—</option>{staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></div>
          <div className="field"><label htmlFor="li-du">{t('dsDue')}</label><input id="li-du" type="date" value={f.due_date} onChange={set('due_date')} />{errs.due_date && <div className="field-err">{errs.due_date}</div>}</div>
        </div>}
        <div className="field"><label htmlFor="li-n">{t('dsNotes')}</label><textarea id="li-n" rows={2} maxLength={500} value={f.notes} onChange={set('notes')} /></div>
        <div className="row"><button className="btn" onClick={submit}>{t('save')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
      </div>
    </Modal>);
}
