import { useState } from 'react';
import { api, usePoll, useTicker } from '../api.js';
import { useI18n, fmtMs } from '../i18n.jsx';
import { Chip, Empty, Modal, useAction } from '../ui.jsx';
import { CorrectionModal, RoomPickerModal, SessionControls, StartSessionModal, TimelineModal } from './shared.jsx';

function CheckIn({ config, staff, onDone, canWrite }) {
  const { t, loc, fmt } = useI18n(); const { run, busy } = useAction();
  const [q, setQ] = useState(''); const [found, setFound] = useState([]); const [p, setP] = useState(null);
  const [f, setF] = useState({ appointmentId: '', departmentId: '', serviceId: '', clinicianId: '' });
  const [np, setNp] = useState(null);
  const appts = usePoll('/appointments', 0);
  const search = async (v) => { setQ(v); if (v.trim().length < 2) return setFound([]); try { setFound(await api.get(`/patients?q=${encodeURIComponent(v.trim())}`)); } catch { /* shown by banner */ } };
  const myAppts = (appts.data || []).filter((a) => a.patient_id === p?.id);
  const pick = (a) => setF({ appointmentId: a?.id || '', departmentId: a?.department_id || f.departmentId, serviceId: a?.service_id || '', clinicianId: a?.clinician_id || '' });
  const submit = async () => {
    const r = await run(() => api.post('/visits/checkin', { patientId: p.id, appointmentId: f.appointmentId ? Number(f.appointmentId) : undefined, departmentId: Number(f.departmentId), serviceId: f.serviceId ? Number(f.serviceId) : undefined, clinicianId: f.clinicianId ? Number(f.clinicianId) : undefined }));
    if (r?.queue) { setP(null); setQ(''); setFound([]); setF({ appointmentId: '', departmentId: '', serviceId: '', clinicianId: '' }); onDone(r.queue.display); }
  };
  const saveNew = async () => { const r = await run(() => api.post('/patients', np)); if (r?.id) { setP(r); setNp(null); } };
  const deptServices = config.services.filter((s) => s.active && String(s.department_id) === String(f.departmentId));
  const deptClin = staff.filter((s) => s.role === 'clinician' && s.active && String(s.department_id) === String(f.departmentId));
  return (
    <div className="card"><h2>{t('checkIn')}{canWrite && <button className="btn ghost sm" onClick={() => setNp({ name: '', name_ar: '' })}>＋ {t('newPatient')}</button>}</h2>
      <div className="stack">
        {!p ? <>
          <input placeholder={t('searchPatient')} value={q} onChange={(e) => search(e.target.value)} aria-label={t('searchPatient')} />
          {found.map((x) => <button key={x.id} className="btn ghost" onClick={() => setP(x)}>{loc(x)} · {x.mrn}</button>)}
        </> : <>
          <div className="row" style={{ justifyContent: 'space-between' }}><b>{loc(p)} · {p.mrn}</b><button className="btn ghost sm" onClick={() => setP(null)}>✕</button></div>
          <label>{t('appointment')}<select value={f.appointmentId} onChange={(e) => pick(myAppts.find((a) => String(a.id) === e.target.value))}>
            <option value="">{t('walkIn')}</option>{myAppts.map((a) => <option key={a.id} value={a.id}>{a.ref} · {fmt(a.scheduled_at, { hour: '2-digit', minute: '2-digit' })} · {a.department}</option>)}</select></label>
          <div className="form-grid">
            <label>{t('department')}<select value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value, serviceId: '', clinicianId: '' })}><option value="">—</option>{config.departments.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select></label>
            <label>{t('service')}<select value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}><option value="">—</option>{deptServices.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></label>
            <label>{t('clinician')}<select value={f.clinicianId} onChange={(e) => setF({ ...f, clinicianId: e.target.value })}><option value="">—</option>{deptClin.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></label>
          </div>
          <button className="btn" disabled={busy || !f.departmentId} onClick={submit}>{t('checkIn')}</button>
        </>}
      </div>
      {np && <Modal title={t('newPatient')} onClose={() => setNp(null)}><div className="stack">
        <label>{t('name')}<input value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} /></label>
        <label>{t('nameAr')}<input dir="rtl" value={np.name_ar} onChange={(e) => setNp({ ...np, name_ar: e.target.value })} /></label>
        <div className="row"><button className="btn" disabled={!np.name || busy} onClick={saveNew}>{t('save')}</button></div></div></Modal>}
    </div>
  );
}

export default function Visits({ user, staff }) {
  const { t, loc, fmt } = useI18n(); const { run } = useAction();
  const cfgP = usePoll('/config', 10000); const open = usePoll('/visits/open', 4000);
  const now = useTicker(1000);
  const [modal, setModal] = useState(null);
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
            return (
              <tr key={v.id}>
                <td><span className="q-no">{v.queue?.display || '—'}</span>{v.queue && <div><Chip s={v.queue.status} /></div>}</td>
                <td><b>{loc(v, 'patient_name') || v.patient_name}</b><div className="small muted">{v.mrn}</div></td>
                <td>{fmt(v.arrived_at, { hour: '2-digit', minute: '2-digit' })}<div className="small muted">{fmtMs(now - Date.parse(v.arrived_at))}</div></td>
                <td>{o ? <><b>{o.room_code}{o.station_code ? `/${o.station_code}` : ''}</b><div className="small muted">{o.entered_at ? t('IN_ROOM') : t('pending')}</div></> : '—'}</td>
                <td style={{ minWidth: 260 }}>{ss.map((s) => <SessionControls key={s.id} s={{ ...s, patient_name: undefined }} now={now} onChange={reload} />)}</td>
                <td><div className="row">
                  {!o && <button className="btn sm" onClick={() => setModal({ k: 'assign', v })}>{t('assignRoom')}</button>}
                  {o && !o.entered_at && <button className="btn sm" onClick={() => post(`/visits/${v.id}/room/enter`, t('enterRoom'))}>{t('enterRoom')}</button>}
                  {o?.entered_at && canTreat && <button className="btn sm" onClick={() => setModal({ k: 'start', v })}>{t('startSession')}</button>}
                  {o?.entered_at && <button className="btn ghost sm" onClick={() => setModal({ k: 'transfer', v })}>{t('transfer')}</button>}
                  {o && ss.length === 0 && <button className="btn ghost sm" onClick={() => post(`/visits/${v.id}/room/exit`, t('exitRoom'))}>{t('exitRoom')}</button>}
                  {!o && ss.length === 0 && canManage && <button className="btn red sm" onClick={() => post(`/visits/${v.id}/checkout`, t('checkOut'))}>{t('checkOut')}</button>}
                  <button className="btn ghost sm" onClick={() => setModal({ k: 'timeline', v })}>{t('timeline')}</button>
                  {o && ss.length === 0 && <button className="btn ghost sm" onClick={() => setModal({ k: 'correct', v, target: { kind: 'ROOM_EXIT', entity_id: o.id, started: o.entered_at, open: true } })}>{t('requestCorrection')}</button>}
                </div></td>
              </tr>);
          })}</tbody></table></div>}
      </div>
      {modal?.k === 'assign' && <RoomPickerModal visit={modal.v} config={config} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'transfer' && <RoomPickerModal transfer visit={modal.v} config={config} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'start' && <StartSessionModal visit={modal.v} config={config} me={me} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'timeline' && <TimelineModal visitId={modal.v.id} onClose={() => setModal(null)} onCorrect={(target) => setModal({ k: 'correct', v: modal.v, target })} />}
      {modal?.k === 'correct' && <CorrectionModal target={modal.target} visitId={modal.v.id} onClose={() => setModal(null)} onDone={reload} />}
    </>
  );
}
