import { useMemo, useRef, useState } from 'react';
import { api, usePoll, newKey } from '../api.js';
import { useI18n, fmtMs } from '../i18n.jsx';
import { Modal, Chip, useAction, Empty } from '../ui.jsx';

/** Active (non-paused) milliseconds for a session at server time `now`. */
export function activeMs(s, now) {
  const end = s.ended_effective ? Date.parse(s.ended_effective) : now;
  let paused = 0;
  for (const p of s.pauses || []) paused += (p.resumed_at ? Date.parse(p.resumed_at) : end) - Date.parse(p.paused_at);
  return Math.max(0, end - Date.parse(s.started_at) - paused);
}

export function SessionControls({ s, now, onChange }) {
  const { t, loc } = useI18n(); const { run, busy } = useAction();
  const go = (a) => run(() => api.post(`/sessions/${s.id}/${a}`), null).then(onChange);
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <div><b>{loc(s, 'service') || s.service}</b> <Chip s={s.status} /><div className="small muted">{s.patient_name && `${s.patient_name} · `}{s.room}{s.clinician && ` · ${s.clinician}`}</div></div>
      <div className="row"><span className="timer" aria-label={t('duration')}>{fmtMs(activeMs(s, now))}</span>
        {s.status === 'ACTIVE' && <button className="btn ghost sm" disabled={busy} onClick={() => go('pause')}>{t('pause')}</button>}
        {s.status === 'PAUSED' && <button className="btn ghost sm" disabled={busy} onClick={() => go('resume')}>{t('resume')}</button>}
        <button className="btn sm" disabled={busy} onClick={() => go('complete')}>{t('complete')}</button></div>
    </div>
  );
}

export function TimelineModal({ visitId, onClose, onCorrect }) {
  const { t, loc, fmtDT, fmt } = useI18n();
  const { data, error } = usePoll(`/visits/${visitId}/timeline`, 0);
  const detail = (e) => {
    const d = e.data || {};
    if (e.type === 'ROOM_TRANSFERRED') return `${d.from} → ${d.to}${d.reason ? ` · ${d.reason}` : ''}`;
    if (e.type.startsWith('CORRECTION')) return [d.kind, d.original && `${fmt(d.original)} → ${fmt(d.corrected)}`, d.reason, d.note].filter(Boolean).join(' · ');
    return [d.queue, d.service, d.room, d.station, d.location, d.ref, d.late_close && 'late close'].filter(Boolean).join(' · ');
  };
  const D = data?.durations;
  return (
    <Modal wide title={`${t('timelineTitle')} — ${data ? `${loc(data.patient)} (${data.patient.mrn})` : ''}`} onClose={onClose}>
      {error && <p className="err">{error.message}</p>}
      {!data ? <p className="muted">…</p> : (
        <div className="stack">
          <ul className="tl">
            {data.events.map((e) => (
              <li key={e.id} className={e.type.startsWith('CORRECTION') ? 'corr' : ''}>
                <time>{fmtDT(e.ts)}</time>
                <div className="ev"><b>{t(`ev_${e.type}`)}</b> <span className="muted small">{detail(e)}</span><div className="small muted">{t('by')}: {e.actor || '—'}</div></div>
              </li>
            ))}
          </ul>
          {D?.sessions.length > 0 && (
            <div className="card"><h2>{t('sessions')}</h2>
              <table><thead><tr><th>{t('service')}</th><th>{t('status')}</th><th>{t('duration')}</th>{onCorrect && <th />}</tr></thead>
                <tbody>{D.sessions.map((s) => (
                  <tr key={s.id}><td>{loc(s, 'service') || s.service} <span className="muted small">#{s.id}</span></td><td><Chip s={s.status} /></td><td className="timer" style={{ fontSize: 14 }}>{fmtMs(s.active_ms)}</td>
                    {onCorrect && <td>{data.visit.status === 'OPEN' && <button className="btn ghost sm" onClick={() => onCorrect({ kind: 'SESSION_END', entity_id: s.id, started: s.started_at, open: s.status !== 'COMPLETED' })}>{t('requestCorrection')}</button>}</td>}</tr>))}</tbody></table>
              <p className="small">{t('totalNoOverlap')}: <b>{fmtMs(D.total_ms)}</b> · {t('sumSessions')}: {fmtMs(D.sum_ms)}</p>
            </div>
          )}
          {data.corrections.length > 0 && (
            <div className="card"><h2>{t('corrections')}</h2>
              {data.corrections.map((c) => <p key={c.id} className="small"><Chip s={c.status} /> {c.kind}: {fmt(c.original_ts)} → <b>{fmt(c.corrected_ts)}</b> · {c.reason} · {c.requester}{c.decider ? ` → ${c.decider}` : ''}</p>)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function RoomPickerModal({ visit, transfer, config, onClose, onDone }) {
  const { t, loc } = useI18n(); const { run, busy } = useAction();
  const [roomId, setRoomId] = useState(''); const [stationId, setStationId] = useState(''); const [reason, setReason] = useState('');
  const room = config.rooms.find((r) => r.id === Number(roomId));
  const usable = (r) => r.active && r.status === 'AVAILABLE' && (r.stations.length ? r.stations.some((s) => !s.occupied_by) : r.occupants < r.capacity);
  const submit = async () => {
    const path = `/visits/${visit.id}/room${transfer ? '/transfer' : ''}`;
    const r = await run(() => api.post(path, { room_id: Number(roomId), station_id: stationId ? Number(stationId) : undefined, reason: reason || undefined }), transfer ? t('transfer') : t('assignRoom'));
    if (r) { onDone(); onClose(); }
  };
  return (
    <Modal title={`${transfer ? t('transfer') : t('assignRoom')} — ${visit.patient_name}`} onClose={onClose}>
      <div className="stack">
        {transfer && visit.occupancy && <p className="muted">{t('from_room')}: <b>{visit.occupancy.room_code}{visit.occupancy.station_code ? `/${visit.occupancy.station_code}` : ''}</b></p>}
        <label>{t('room')}<select value={roomId} onChange={(e) => { setRoomId(e.target.value); setStationId(''); }}>
          <option value="">—</option>
          {config.rooms.filter((r) => r.active).map((r) => <option key={r.id} value={r.id} disabled={!usable(r)}>{r.code} · {loc(r)} · {t(r.display_status)}</option>)}
        </select></label>
        {room?.stations.length > 0 && (
          <label>{t('station')}<select value={stationId} onChange={(e) => setStationId(e.target.value)}>
            <option value="">—</option>{room.stations.map((s) => <option key={s.id} value={s.id} disabled={!!s.occupied_by}>{s.code}{s.occupied_by ? ` · ${t('OCCUPIED')}` : ''}</option>)}
          </select></label>
        )}
        {transfer && <label>{t('reason')}<input value={reason} onChange={(e) => setReason(e.target.value)} /></label>}
        <div className="row"><button className="btn" disabled={busy || !roomId || (room?.stations.length > 0 && !stationId)} onClick={submit}>{t('confirm')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
      </div>
    </Modal>
  );
}

export function StartSessionModal({ visit, config, me, onClose, onDone }) {
  const { t, loc } = useI18n(); const { run, busy } = useAction();
  const key = useRef(newKey()); // stable across retries/double clicks → server returns the same session
  const [serviceId, setServiceId] = useState('');
  const mine = useMemo(() => config.services.filter((s) => s.active && (me?.service_ids || []).includes(s.id)), [config, me]);
  const submit = async () => { const r = await run(() => api.post(`/visits/${visit.id}/sessions`, { service_id: Number(serviceId), idem_key: key.current }), t('startSession')); if (r) { onDone(); onClose(); } };
  return (
    <Modal title={`${t('startSession')} — ${visit.patient_name}`} onClose={onClose}>
      <div className="stack">
        <label>{t('service')}<select value={serviceId} onChange={(e) => setServiceId(e.target.value)}><option value="">—</option>{mine.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></label>
        {mine.length === 0 && <p className="err">{t('unauthorizedNote')}</p>}
        <div className="row"><button className="btn" disabled={busy || !serviceId} onClick={submit}>{t('confirm')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
      </div>
    </Modal>
  );
}

export function CorrectionModal({ target, visitId, onClose, onDone }) {
  const { t } = useI18n(); const { run, busy } = useAction();
  const [ts, setTs] = useState(''); const [reason, setReason] = useState('');
  const submit = async () => {
    const r = await run(() => api.post('/corrections', { kind: target.kind, entity_id: target.entity_id, corrected_ts: new Date(ts).toISOString(), reason }), t('requestCorrection'));
    if (r) { onDone?.(); onClose(); }
  };
  const min = target.started ? new Date(Date.parse(target.started) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined;
  return (
    <Modal title={t('requestCorrection')} onClose={onClose}>
      <div className="stack">
        <p className="muted small">{target.kind}{target.open ? ' — the open record will be closed now using the server time (kept as the original) and your corrected time goes to review.' : ''}</p>
        <label>{t('correctedTime')}<input type="datetime-local" min={min} value={ts} onChange={(e) => setTs(e.target.value)} /></label>
        <label>{t('reason')}<textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <div className="row"><button className="btn" disabled={busy || !ts || !reason.trim()} onClick={submit}>{t('confirm')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
      </div>
    </Modal>
  );
}
export { Empty };
