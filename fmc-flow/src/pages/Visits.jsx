import { Fragment, useState } from 'react';
import { api, usePoll, useTicker } from '../api.js';
import { useI18n, fmtWait, waitingView } from '../i18n.jsx';
import { Chip, Empty, useAction, useToast } from '../ui.jsx';
import PatientFormModal from './PatientForm.jsx';
import { CorrectionModal, RoomPickerModal, ScheduleBadge, SessionControls, StartSessionModal, TimelineModal, TimingGrid } from './shared.jsx';

function CheckIn({ config, staff, onDone, canWrite }) {
  const { t, loc, fmt } = useI18n(); const { run, busy } = useAction(); const toast = useToast();
  const [q, setQ] = useState(''); const [found, setFound] = useState(null); const [p, setP] = useState(null);
  const [f, setF] = useState({ appointmentId: '', departmentId: '', serviceId: '', clinicianId: '' });
  const [errs, setErrs] = useState({}); const [open, setOpen] = useState(false);
  const appts = usePoll('/appointments', 0);
  const needService = config.settings.require_service_at_checkin === '1';
  const search = async (v) => { setQ(v); if (v.trim().length < 2) return setFound(null); try { setFound(await api.get(`/patients?q=${encodeURIComponent(v.trim())}`)); } catch { /* connection banner explains */ } };
  const myAppts = (appts.data || []).filter((a) => a.patient_id === p?.id);
  const pick = (a) => setF({ appointmentId: a?.id || '', departmentId: a?.department_id || f.departmentId, serviceId: a?.service_id || '', clinicianId: a?.clinician_id || '' });
  const reset = () => { setP(null); setQ(''); setFound(null); setErrs({}); setF({ appointmentId: '', departmentId: '', serviceId: '', clinicianId: '' }); };
  const submit = async () => {
    setErrs({});
    try {
      const r = await api.post('/visits/checkin', { patientId: p.id, appointmentId: f.appointmentId ? Number(f.appointmentId) : undefined, departmentId: Number(f.departmentId), serviceId: f.serviceId ? Number(f.serviceId) : undefined, clinicianId: f.clinicianId ? Number(f.clinicianId) : undefined });
      toast(`${loc(p)} (${p.mrn}) — ${t('checkedInAs')} ${r.queue.display}`); reset(); onDone();
    } catch (e) { if (e.code === 'NETWORK') toast(t('offline'), true); else { setErrs(e.details?.fields || {}); toast(e.message, true); } }
  };
  const deptServices = config.services.filter((s) => s.active && String(s.department_id) === String(f.departmentId));
  const deptClin = staff.filter((s) => s.role === 'clinician' && s.active && String(s.department_id) === String(f.departmentId));
  return (
    <div className="card"><h2>{t('checkIn')}{canWrite && <button className="btn ghost sm" onClick={() => setOpen(true)}>＋ {t('newPatient')}</button>}</h2>
      <div className="stack">
        {!p ? <>
          <input placeholder={t('searchHint')} value={q} onChange={(e) => search(e.target.value)} aria-label={t('searchHint')} />
          {found?.length === 0 && <p className="muted small">{t('noResults')}</p>}
          {found?.map((x) => (
            <button key={x.id} type="button" className="btn ghost patient-row" onClick={() => { setP(x); setFound(null); }}>
              <b>{loc(x)}</b><span className="muted small">{x.mrn}{x.phone ? ` · ${x.phone}` : ''}{x.dob ? ` · ${x.dob}` : ''}{x.open_visit_id ? ` · ${t('openVisitNote')}` : ''}</span>
            </button>
          ))}
        </> : <>
          <div className="row" style={{ justifyContent: 'space-between' }}><span><span className="muted small">{t('patientSelected')}: </span><b>{loc(p)} · {p.mrn}</b></span><button className="btn ghost sm" onClick={reset}>{t('changePatient')}</button></div>
          <div className="field"><label htmlFor="ci-appt">{t('appointment')} <span className="opt">· {t('optionalWord')}</span></label>
            <select id="ci-appt" value={f.appointmentId} onChange={(e) => pick(myAppts.find((a) => String(a.id) === e.target.value))}>
              <option value="">{t('walkIn')}</option>{myAppts.map((a) => <option key={a.id} value={a.id}>{a.ref} · {fmt(a.scheduled_at, { hour: '2-digit', minute: '2-digit' })} · {a.department}</option>)}</select></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="ci-dept">{t('department')} <span className="req" aria-hidden="true">*</span><span className="sr-only"> ({t('requiredWord')})</span></label>
              <select id="ci-dept" aria-required="true" aria-invalid={errs.department_id ? 'true' : undefined} value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value, serviceId: '', clinicianId: '' })}><option value="">—</option>{config.departments.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select></div>
            <div className="field"><label htmlFor="ci-svc">{t('service')} {needService ? <span className="req" aria-hidden="true">*</span> : <span className="opt">· {t('optionalWord')}</span>}</label>
              <select id="ci-svc" disabled={!f.departmentId} aria-invalid={errs.service_id ? 'true' : undefined} value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}><option value="">—</option>{deptServices.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select>
              {errs.service_id && <div className="field-err" role="alert">{errs.service_id}</div>}</div>
            <div className="field"><label htmlFor="ci-clin">{t('clinician')} <span className="opt">· {t('optionalWord')}</span></label>
              <select id="ci-clin" disabled={!f.departmentId} value={f.clinicianId} onChange={(e) => setF({ ...f, clinicianId: e.target.value })}><option value="">—</option>{deptClin.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></div>
          </div>
          <button className="btn" disabled={busy || !f.departmentId} onClick={() => run(submit)}>{t('checkIn')}</button>
        </>}
      </div>
      {open && <PatientFormModal config={config} staff={staff} onClose={() => setOpen(false)} onUse={(x) => { setP(x); setFound(null); }}
        onSaved={(r, checkedIn) => { if (checkedIn) { reset(); onDone(); } else { setP(r); setQ(''); setFound(null); } }} />}
    </div>
  );
}

export default function Visits({ user, staff }) {
  const { t, loc, fmt } = useI18n(); const { run } = useAction();
  const cfgP = usePoll('/config', 10000); const open = usePoll('/visits/open', 4000);
  const now = useTicker(1000);
  const [modal, setModal] = useState(null); const [expanded, setExpanded] = useState({});
  const sess = usePoll('/sessions/active', 4000);
  const config = cfgP.data; if (!config) return <p className="muted">{t('loading')}</p>;
  const me = staff.find((s) => s.id === user.id);
  const canManage = ['admin', 'supervisor', 'reception'].includes(user.role);
  const canTreat = ['admin', 'supervisor', 'clinician'].includes(user.role);
  const reload = () => { open.reload(); sess.reload(); cfgP.reload(); };
  const post = (path, ok) => run(() => api.post(path), ok).then(reload);
  const sessionsOf = (id) => (sess.data?.sessions || []).filter((s) => s.visit_id === id);
  return (
    <>
      {canManage && <CheckIn config={config} staff={staff} canWrite={['admin', 'reception'].includes(user.role)} onDone={reload} />}
      <div className="card"><h2>{t('openVisits')}</h2>
        {(open.data || []).length === 0 ? <Empty /> : <div className="tbl"><table>
          <thead><tr><th>{t('queue')}</th><th>{t('patient')}</th><th>{t('arrival')}</th><th>{t('room')}</th><th>{t('sessions')}</th><th>{t('actions')}</th></tr></thead>
          <tbody>{open.data.map((v) => {
            const ss = sessionsOf(v.id); const o = v.occupancy;
            const wv = waitingView(v.timing, now); const isOpen = !!expanded[v.id];
            return (
              <Fragment key={v.id}>
              <tr>
                <td><span className="q-no">{v.queue?.display || '—'}</span>{v.queue && <div><Chip s={v.queue.status} /></div>}</td>
                <td><b>{loc(v, 'patient_name') || v.patient_name}</b><div className="small muted">{v.mrn}</div>{v.schedule_status && <div><ScheduleBadge status={v.schedule_status} compact /></div>}</td>
                <td>{fmt(v.arrived_at, { hour: '2-digit', minute: '2-digit' })}<div className="small muted" title={t('waitTotal')}>{t('waiting')}: {fmtWait(wv.total)}{wv.live ? ' ●' : ''}</div></td>
                <td>{o ? <><b>{o.room_code}{o.station_code ? `/${o.station_code}` : ''}</b><div className="small muted">{o.entered_at ? t('IN_ROOM') : t('pending')}</div></> : '—'}</td>
                <td style={{ minWidth: 260 }}>{ss.map((s) => <SessionControls key={s.id} s={{ ...s, patient_name: undefined }} now={now} user={user} onChange={reload} onCorrect={(target) => setModal({ k: 'correct', v, target })} />)}</td>
                <td><div className="row">
                  {!o && <button className="btn sm" onClick={() => setModal({ k: 'assign', v })}>{t('assignRoom')}</button>}
                  {o && !o.entered_at && <button className="btn sm" onClick={() => post(`/visits/${v.id}/room/enter`, t('enterRoom'))}>{t('enterRoom')}</button>}
                  {o?.entered_at && canTreat && <button className="btn sm" onClick={() => setModal({ k: 'start', v })}>{t('startSession')}</button>}
                  {o?.entered_at && <button className="btn ghost sm" onClick={() => setModal({ k: 'transfer', v })}>{t('transfer')}</button>}
                  {o && ss.length === 0 && <button className="btn ghost sm" onClick={() => post(`/visits/${v.id}/room/exit`, t('exitRoom'))}>{t('exitRoom')}</button>}
                  {!o && ss.length === 0 && canManage && <button className="btn red sm" onClick={() => post(`/visits/${v.id}/checkout`, t('checkOut'))}>{t('checkOut')}</button>}
                  <button className="btn ghost sm" aria-expanded={isOpen} onClick={() => setExpanded({ ...expanded, [v.id]: !isOpen })}>{isOpen ? t('hideTiming') : t('timing')}</button>
                  <button className="btn ghost sm" onClick={() => setModal({ k: 'timeline', v })}>{t('timeline')}</button>
                  {o && ss.length === 0 && <button className="btn ghost sm" onClick={() => setModal({ k: 'correct', v, target: { kind: 'ROOM_EXIT', entity_id: o.id, started: o.entered_at, open: true } })}>{t('requestCorrection')}</button>}
                </div></td>
              </tr>
              {isOpen && <tr className="detail-row"><td colSpan={6}><TimingGrid tm={v.timing} sessions={ss} now={now} /></td></tr>}
              </Fragment>);
          })}</tbody></table></div>}
      </div>
      {modal?.k === 'assign' && <RoomPickerModal visit={modal.v} config={config} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'transfer' && <RoomPickerModal transfer visit={modal.v} config={config} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'start' && <StartSessionModal visit={modal.v} user={user} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'timeline' && <TimelineModal visitId={modal.v.id} onClose={() => setModal(null)} onCorrect={(target) => setModal({ k: 'correct', v: modal.v, target })} />}
      {modal?.k === 'correct' && <CorrectionModal target={modal.target} visitId={modal.v.id} onClose={() => setModal(null)} onDone={reload} />}
    </>
  );
}
