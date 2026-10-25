import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Chip, Modal, useAction } from '../ui.jsx';

export default function Rooms({ user }) {
  const { t, loc, fmtDT } = useI18n(); const { run } = useAction();
  const cfg = usePoll('/config', 4000); const [m, setM] = useState(null); const [hist, setHist] = useState(null);
  const canMaint = ['admin', 'supervisor'].includes(user.role);
  const config = cfg.data; if (!config) return <p className="muted">{t('loading')}</p>;
  const setStatus = async (room, status, reason) => { const r = await run(() => api.put(`/rooms/${room.id}/status`, { status, reason }), t(status)); if (r) { setM(null); cfg.reload(); } };
  const openHist = async (r) => setHist({ room: r, rows: await api.get(`/rooms/${r.id}/history`) });
  return (
    <>
      {config.departments.filter((d) => config.rooms.some((r) => r.department_id === d.id && r.active)).map((d) => (
        <div key={d.id} className="card"><h2>{loc(d)}</h2>
          <div className="rooms">{config.rooms.filter((r) => r.department_id === d.id && r.active).map((r) => (
            <div key={r.id} className={`room ${r.display_status}`}>
              <div className="row" style={{ justifyContent: 'space-between' }}><b>{r.code}</b><Chip s={r.display_status} /></div>
              <span className="small muted">{loc(r)} · {t('capacity')} {r.effective_capacity}{r.status_reason ? ` · ${r.status_reason}` : ''}</span>
              {r.stations.length > 0 && <div className="beds">{r.stations.map((s) => <span key={s.id} className={`bed ${s.occupied_by ? 'busy' : ''}`}>{s.code}</span>)}</div>}
              <div className="row">
                {r.status === 'CLEANING' && <button className="btn sm" onClick={() => setStatus(r, 'AVAILABLE')}>{t('AVAILABLE')}</button>}
                {r.status === 'AVAILABLE' && r.occupants === 0 && <button className="btn ghost sm" onClick={() => setStatus(r, 'CLEANING')}>{t('CLEANING')}</button>}
                {canMaint && r.status === 'AVAILABLE' && <button className="btn ghost sm" disabled={r.occupants > 0} onClick={() => setM({ room: r, status: 'MAINTENANCE', reason: '' })}>{t('maintenance')}</button>}
                {canMaint && ['MAINTENANCE', 'OUT_OF_SERVICE'].includes(r.status) && <button className="btn sm" onClick={() => setStatus(r, 'AVAILABLE')}>{t('restore')}</button>}
                {canMaint && <button className="btn ghost sm" onClick={() => openHist(r)}>{t('history')}</button>}
              </div>
            </div>))}</div>
        </div>))}
      {m && <Modal title={`${m.room.code} — ${t('maintenance')}`} onClose={() => setM(null)}><div className="stack">
        <label>{t('status')}<select value={m.status} onChange={(e) => setM({ ...m, status: e.target.value })}><option value="MAINTENANCE">{t('MAINTENANCE')}</option><option value="OUT_OF_SERVICE">{t('OUT_OF_SERVICE')}</option></select></label>
        <label>{t('reason')}<input value={m.reason} onChange={(e) => setM({ ...m, reason: e.target.value })} /></label>
        <button className="btn" disabled={!m.reason.trim()} onClick={() => setStatus(m.room, m.status, m.reason)}>{t('confirm')}</button></div></Modal>}
      {hist && <Modal title={`${hist.room.code} — ${t('history')}`} onClose={() => setHist(null)}>
        {hist.rows.length === 0 ? <p className="muted">{t('noData')}</p> : hist.rows.map((h) => <p key={h.id} className="small">{fmtDT(h.ts)} · {h.from_status} → <b>{h.to_status}</b> · {h.reason || '—'} · {h.actor || 'system'}</p>)}</Modal>}
    </>
  );
}
