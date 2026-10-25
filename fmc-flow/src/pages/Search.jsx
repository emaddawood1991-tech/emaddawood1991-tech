import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Chip, Empty, useAction } from '../ui.jsx';
import { TimelineModal } from './shared.jsx';

export default function Search({ staff }) {
  const { t, loc, fmtDT } = useI18n(); const { run } = useAction();
  const cfg = usePoll('/config', 0); const [f, setF] = useState({}); const [rows, setRows] = useState(null); const [tl, setTl] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async (e) => { e.preventDefault(); const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString(); const r = await run(() => api.get(`/search?${qs}`)); if (r) setRows(r === true ? [] : r); };
  const config = cfg.data;
  const sel = (k, list, label) => <label>{label}<select value={f[k] || ''} onChange={set(k)}><option value="">—</option>{list.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
  return (
    <>
      <div className="card stack" role="search" onKeyDown={(e) => e.key === 'Enter' && e.target.tagName === 'INPUT' && go(e)}>
        <div className="form-grid">
          <label>{t('patient')} / ID<input value={f.patient || ''} onChange={set('patient')} /></label>
          <label>{t('mrn')}<input value={f.mrn || ''} onChange={set('mrn')} /></label>
          <label>{t('appointment')}<input value={f.appointment || ''} onChange={set('appointment')} /></label>
          {config && sel('department_id', config.departments.map((d) => [d.id, loc(d)]), t('department'))}
          {config && sel('service_id', config.services.map((d) => [d.id, loc(d)]), t('service'))}
          {sel('clinician_id', staff.filter((s) => s.role === 'clinician').map((s) => [s.id, loc(s)]), t('clinician'))}
          {config && sel('room_id', config.rooms.map((r) => [r.id, r.code]), t('room'))}
          <label>{t('arrival')}<input type="date" value={f.date || ''} onChange={set('date')} /></label>
          {sel('session_status', ['ACTIVE', 'PAUSED', 'COMPLETED'].map((s) => [s, t(s)]), `${t('session')} ${t('status')}`)}
        </div>
        <div className="row"><button type="button" className="btn" onClick={go}>{t('search')}</button><button type="button" className="btn ghost" onClick={() => { setF({}); setRows(null); }}>{t('cancel')}</button></div>
      </div>
      {rows && <div className="card">{rows.length === 0 ? <Empty /> : <div className="tbl"><table>
        <thead><tr><th>{t('patient')}</th><th>{t('mrn')}</th><th>{t('arrival')}</th><th>{t('status')}</th><th /></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.visit_id}><td>{loc(r, 'patient_name') || r.patient_name}</td><td>{r.mrn}</td><td>{fmtDT(r.arrived_at)}</td><td><Chip s={r.status} /></td><td><button className="btn ghost sm" onClick={() => setTl(r.visit_id)}>{t('timeline')}</button></td></tr>)}</tbody></table></div>}</div>}
      {tl && <TimelineModal visitId={tl} onClose={() => setTl(null)} />}
    </>
  );
}
