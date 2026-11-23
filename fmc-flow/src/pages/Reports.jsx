import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n, fmtWait } from '../i18n.jsx';

const mins = (m) => (m == null ? '—' : fmtWait(m * 60000));

/** Simple bar chart (inline SVG, no library): one bar per day, labelled for screen readers, with the numbers also available as a table. */
function Bars({ title, rows, valueKey, unit }) {
  const { t } = useI18n();
  const vals = rows.map((r) => r[valueKey] ?? 0); const max = Math.max(1, ...vals); const W = 640, H = 140, pad = 24; const bw = Math.max(2, Math.min(28, (W - pad * 2) / Math.max(1, rows.length) - 3));
  const step = rows.length > 1 ? (W - pad * 2 - bw) / (rows.length - 1) : 0;
  const summary = rows.length ? `${title}: ${rows.map((r) => `${r.date} ${r[valueKey] ?? '—'}`).join(', ')}` : title;
  return (
    <div className="card" data-testid={`chart-${valueKey}`}><h2>{title}</h2>
      {rows.length === 0 ? <p className="muted">{t('repNoTrend')}</p> : <>
        <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={summary} style={{ width: '100%', height: 'auto', maxHeight: 200 }}>
          <line x1={pad} y1={H} x2={W - pad} y2={H} stroke="currentColor" opacity=".3" />
          {rows.map((r, i) => { const h = Math.round(((r[valueKey] ?? 0) / max) * (H - 18)); const x = pad + i * step; return <rect key={r.date} x={x} y={H - h} width={bw} height={h} rx="2" fill="var(--blue, #2e55b2)"><title>{`${r.date}: ${r[valueKey] ?? '—'}${unit || ''}`}</title></rect>; })}
          <text x={pad} y={H + 14} fontSize="11" fill="currentColor">{rows[0].date}</text><text x={W - pad} y={H + 14} fontSize="11" textAnchor="end" fill="currentColor">{rows[rows.length - 1].date}</text>
          <text x={W - pad} y="12" fontSize="11" textAnchor="end" fill="currentColor">max {max}{unit || ''}</text>
        </svg>
        <details><summary className="small muted">{t('repShowNumbers')}</summary><div className="tbl"><table><thead><tr><th>{t('dsDate')}</th><th>{title}</th></tr></thead><tbody>{rows.map((r) => <tr key={r.date}><td>{r.date}</td><td>{r[valueKey] ?? '—'}</td></tr>)}</tbody></table></div></details></>}
    </div>);
}

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
        <div className="kpis">{[[t('visits'), d.visits], [t('repPeople'), d.people], [t('sessions'), d.sessions], [t('repWaitBefore'), mins(d.waiting.before_room_avg_min)], [t('repWaitIn'), mins(d.waiting.in_room_avg_min)], [t('repWaitTotal'), mins(d.waiting.total_avg_min)],
          [t('repPlanned'), d.treatment.planned_avg_min ?? '—'], [t('repActual'), d.treatment.actual_confirmed_avg_min ?? '—'], [t('repFull'), d.treatment.full], [t('repOverruns'), `${d.treatment.overruns}${d.treatment.overrun_avg_min ? ` (+${d.treatment.overrun_avg_min})` : ''}`], [t('repEarly'), `${d.treatment.early}${d.treatment.early_avg_min ? ` (−${d.treatment.early_avg_min})` : ''}`],
          [t('repAuto'), d.treatment.auto_closed_unverified], [t('repOcc'), mins(d.room_occupancy_avg_min)], [t('repVisit'), mins(d.waiting.visit_total_avg_min)], [t('transfers'), d.transfers], [t('corrections'), `${d.corrections.approved}/${d.corrections.total}`], [t('maintEvents'), d.maintenance_events]]
          .map(([l, v]) => <div key={l} className="card kpi"><b style={{ fontSize: 22 }}>{v}</b><span>{l}</span></div>)}</div>
        <div className="card" data-testid="appt-outcomes"><h2>{t('repAppts')}</h2>
          <div className="kpis">{[[t('repApTotal'), d.appointments.total], [t('repApArrived'), d.appointments.arrived], [t('repApNot'), d.appointments.not_arrived], [t('repApCancel'), d.appointments.cancelled], [t('repApUp'), d.appointments.upcoming],
            [t('repApRate'), d.appointments.arrival_rate_pct == null ? '—' : `${d.appointments.arrival_rate_pct}%`], [t('repApCancelRate'), d.appointments.cancel_rate_pct == null ? '—' : `${d.appointments.cancel_rate_pct}%`], [t('repQueueNoShow'), d.appointments.queue_no_shows]]
            .map(([l, v]) => <div key={l} className="card kpi"><b style={{ fontSize: 22 }}>{v}</b><span>{l}</span></div>)}</div>
          <p className="small muted">{t('repApNote')}</p></div>
        <div className="grid g2"><Bars title={t('repVisitsPerDay')} rows={d.daily} valueKey="visits" /><Bars title={t('repWaitPerDay')} rows={d.daily} valueKey="avg_wait_min" unit=" min" /></div>
        <div className="grid g2">
          <div className="card"><h2>{t('byService')}</h2><div className="tbl"><table><thead><tr><th>{t('service')}</th><th>#</th><th>{t('repPlanned')}</th><th>{t('minutes')}</th><th>Ø</th></tr></thead><tbody>{d.by_service.map((s) => <tr key={s.service}><td>{s.service}</td><td>{s.sessions}</td><td>{s.planned_avg_minutes ?? '—'}</td><td>{s.minutes}</td><td>{s.avg_minutes}</td></tr>)}</tbody></table></div></div>
          <div className="card"><h2>{t('byRoom')}</h2><div className="tbl"><table><thead><tr><th>{t('room')}</th><th>#</th><th>{t('minutes')}</th></tr></thead><tbody>{d.by_room.map((s) => <tr key={s.room}><td>{s.room}</td><td>{s.uses}</td><td>{s.occupied_minutes}</td></tr>)}</tbody></table></div></div>
        </div>
        <div className="card"><h2>{t('visits')}</h2><div className="tbl"><table>
          <thead><tr><th>{t('patient')}</th><th>{t('arrivalAt')}</th><th>{t('waitBefore')}</th><th>{t('waitInRoom')}</th><th>{t('waitTotal')}</th><th>{t('treatmentStart')}</th><th>{t('roomExit')}</th><th>{t('totalVisit')}</th></tr></thead>
          <tbody>{d.visit_rows.map((v) => <tr key={v.visit_id}><td>{v.patient}<div className="small muted">{v.mrn}{v.person_mrn && v.person_mrn !== v.mrn ? ` → ${v.person_mrn}` : ''}</div></td><td>{fmt(v.arrival_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>{mins(v.waiting_before_room_min)}</td><td>{mins(v.waiting_in_room_min)}</td><td>{mins(v.total_waiting_min)}</td><td>{v.treatment_start_at ? fmt(v.treatment_start_at, { hour: '2-digit', minute: '2-digit' }) : '—'}</td><td>{v.room_exit_at ? fmt(v.room_exit_at, { hour: '2-digit', minute: '2-digit' }) : '—'}</td><td>{mins(v.total_visit_min)}</td></tr>)}</tbody></table></div></div>
      </>}
    </>
  );
}
