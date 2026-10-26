import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n, fmtWait } from '../i18n.jsx';

const mins = (m) => (m == null ? '—' : fmtWait(m * 60000));

export default function Reports({ staff = [] }) {
  const { t, loc, fmt } = useI18n();
  const [f, setF] = useState({ from: '', to: '', department_id: '', service_id: '', clinician_id: '', room_id: '', patient: '' });
  const [applied, setApplied] = useState(f);
  const cfg = usePoll('/config', 0);
  const qs = new URLSearchParams(Object.entries(applied).filter(([, v]) => v)).toString();
  const r = usePoll(`/reports?${qs}`, 15000); const d = r.data; const config = cfg.data;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const sel = (k, label, all, opts) => <div className="field"><label htmlFor={`rf-${k}`}>{label}</label><select id={`rf-${k}`} value={f[k]} onChange={set(k)}><option value="">{all}</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>;
  const exportCsv = async () => { const x = await fetch(`/api/reports/sessions.csv?${qs}`, { credentials: 'same-origin' }); const u = URL.createObjectURL(await x.blob()); const a = document.createElement('a'); a.href = u; a.download = 'treatment-timing.csv'; a.click(); URL.revokeObjectURL(u); };
  return (
    <>
      <div className="card"><h2>{t('filters')}</h2>
        <div className="form-grid two">
          <div className="field"><label htmlFor="rf-from">{t('from')}</label><input id="rf-from" type="date" value={f.from} onChange={set('from')} /></div>
          <div className="field"><label htmlFor="rf-to">{t('to')}</label><input id="rf-to" type="date" value={f.to} onChange={set('to')} /></div>
          {config && sel('department_id', t('department'), t('allDepartments'), config.departments.map((x) => [x.id, loc(x)]))}
          {config && sel('service_id', t('service'), t('allServices'), config.services.map((x) => [x.id, loc(x)]))}
          {sel('clinician_id', t('clinician'), t('allClinicians'), staff.filter((x) => x.role === 'clinician').map((x) => [x.id, loc(x)]))}
          {config && sel('room_id', t('room'), t('allRooms'), config.rooms.map((x) => [x.id, x.code]))}
          <div className="field"><label htmlFor="rf-patient">{t('patient')}</label><input id="rf-patient" placeholder={t('patientFilter')} value={f.patient} onChange={set('patient')} /></div>
        </div>
        <div className="row" style={{ marginTop: 10 }}><button className="btn" onClick={() => setApplied(f)}>{t('apply')}</button><button className="btn ghost" onClick={exportCsv}>{t('export')}</button></div>
      </div>
      {!d ? <p className="muted">{t('loading')}</p> : <>
        <div className="kpis">{[[t('visits'), d.visits], [t('sessions'), d.sessions], [t('repWaitBefore'), mins(d.waiting.before_room_avg_min)], [t('repWaitIn'), mins(d.waiting.in_room_avg_min)], [t('repWaitTotal'), mins(d.waiting.total_avg_min)],
          [t('repPlanned'), d.treatment.planned_avg_min ?? '—'], [t('repActual'), d.treatment.actual_confirmed_avg_min ?? '—'], [t('repFull'), d.treatment.full], [t('repOverruns'), `${d.treatment.overruns}${d.treatment.overrun_avg_min ? ` (+${d.treatment.overrun_avg_min})` : ''}`], [t('repEarly'), `${d.treatment.early}${d.treatment.early_avg_min ? ` (−${d.treatment.early_avg_min})` : ''}`],
          [t('repAuto'), d.treatment.auto_closed_unverified], [t('repOcc'), mins(d.room_occupancy_avg_min)], [t('repVisit'), mins(d.waiting.visit_total_avg_min)], [t('transfers'), d.transfers], [t('corrections'), `${d.corrections.approved}/${d.corrections.total}`], [t('maintEvents'), d.maintenance_events]]
          .map(([l, v]) => <div key={l} className="card kpi"><b style={{ fontSize: 22 }}>{v}</b><span>{l}</span></div>)}</div>
        <div className="grid g2">
          <div className="card"><h2>{t('byService')}</h2><div className="tbl"><table><thead><tr><th>{t('service')}</th><th>#</th><th>{t('repPlanned')}</th><th>{t('minutes')}</th><th>Ø</th></tr></thead><tbody>{d.by_service.map((s) => <tr key={s.service}><td>{s.service}</td><td>{s.sessions}</td><td>{s.planned_avg_minutes ?? '—'}</td><td>{s.minutes}</td><td>{s.avg_minutes}</td></tr>)}</tbody></table></div></div>
          <div className="card"><h2>{t('byRoom')}</h2><div className="tbl"><table><thead><tr><th>{t('room')}</th><th>#</th><th>{t('minutes')}</th></tr></thead><tbody>{d.by_room.map((s) => <tr key={s.room}><td>{s.room}</td><td>{s.uses}</td><td>{s.occupied_minutes}</td></tr>)}</tbody></table></div></div>
        </div>
        <div className="card"><h2>{t('visits')}</h2><div className="tbl"><table>
          <thead><tr><th>{t('patient')}</th><th>{t('arrivalAt')}</th><th>{t('waitBefore')}</th><th>{t('waitInRoom')}</th><th>{t('waitTotal')}</th><th>{t('treatmentStart')}</th><th>{t('roomExit')}</th><th>{t('totalVisit')}</th></tr></thead>
          <tbody>{d.visit_rows.map((v) => <tr key={v.visit_id}><td>{v.patient}<div className="small muted">{v.mrn}</div></td><td>{fmt(v.arrival_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>{mins(v.waiting_before_room_min)}</td><td>{mins(v.waiting_in_room_min)}</td><td>{mins(v.total_waiting_min)}</td><td>{v.treatment_start_at ? fmt(v.treatment_start_at, { hour: '2-digit', minute: '2-digit' }) : '—'}</td><td>{v.room_exit_at ? fmt(v.room_exit_at, { hour: '2-digit', minute: '2-digit' }) : '—'}</td><td>{mins(v.total_visit_min)}</td></tr>)}</tbody></table></div></div>
      </>}
    </>
  );
}
