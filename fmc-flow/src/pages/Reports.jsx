import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';

export default function Reports() {
  const { t } = useI18n(); const [f, setF] = useState({ from: '', to: '' });
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const r = usePoll(`/reports?${qs}`, 15000); const d = r.data;
  return (
    <>
      <div className="card row"><label>{t('from')}<input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label>{t('to')}<input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
        <button className="btn ghost" onClick={async () => { const r = await fetch(`/api/reports/sessions.csv?${qs}`, { credentials: 'same-origin' }); const u = URL.createObjectURL(await r.blob()); const a = document.createElement('a'); a.href = u; a.download = 'sessions.csv'; a.click(); URL.revokeObjectURL(u); }}>{t('export')}</button></div>
      {!d ? <p className="muted">{t('loading')}</p> : <>
        <div className="kpis">{[[t('visits'), d.visits], [t('sessions'), d.sessions], [t('avgWait'), d.avg_wait_minutes ?? '—'], [t('transfers'), d.transfers], [t('corrections'), `${d.corrections.approved}/${d.corrections.total}`], [t('maintEvents'), d.maintenance_events]]
          .map(([l, v]) => <div key={l} className="card kpi"><b>{v}</b><span>{l}</span></div>)}</div>
        <div className="grid g2">
          <div className="card"><h2>{t('byService')}</h2><table><thead><tr><th>{t('service')}</th><th>#</th><th>{t('minutes')}</th><th>Ø</th></tr></thead><tbody>{d.by_service.map((s) => <tr key={s.service}><td>{s.service}</td><td>{s.sessions}</td><td>{s.minutes}</td><td>{s.avg_minutes}</td></tr>)}</tbody></table></div>
          <div className="card"><h2>{t('byRoom')}</h2><table><thead><tr><th>{t('room')}</th><th>#</th><th>{t('minutes')}</th></tr></thead><tbody>{d.by_room.map((s) => <tr key={s.room}><td>{s.room}</td><td>{s.uses}</td><td>{s.occupied_minutes}</td></tr>)}</tbody></table></div>
        </div></>}
    </>
  );
}
