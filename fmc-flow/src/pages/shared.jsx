import { useEffect, useMemo, useRef, useState } from 'react';
import { api, usePoll, newKey, useTicker } from '../api.js';
import { useI18n, fmtMs, fmtCountdown, fmtWait, waitingView, timerView } from '../i18n.jsx';
import { Modal, Chip, useAction, useToast, Empty } from '../ui.jsx';

/** Active (non-paused) milliseconds for a session at server time `now`. */
export function activeMs(s, now) {
  const end = s.ended_effective ? Date.parse(s.ended_effective) : now;
  let paused = 0;
  for (const p of s.pauses || []) paused += (p.resumed_at ? Date.parse(p.resumed_at) : end) - Date.parse(p.paused_at);
  return Math.max(0, end - Date.parse(s.started_at) - paused);
}

const TIMER_TONE = { RUNNING: 'ACTIVE', PAUSED: 'PAUSED', ELAPSED: 'REJECTED', DONE: 'COMPLETED' };

/** One treatment: live countdown from stored timestamps, with Pause/Resume, End early, Confirm completion and Request correction. */
export function SessionControls({ s, now, onChange, onCorrect }) {
  const { t, loc, fmt } = useI18n(); const { run, busy } = useAction(); const toast = useToast();
  const [confirmEarly, setConfirmEarly] = useState(false);
  const tv = timerView(s, now);
  const prev = useRef(tv.state);
  useEffect(() => { // one visible notification when the scheduled time is reached while this screen is open
    if (prev.current === 'RUNNING' && tv.state === 'ELAPSED') toast(`${t('elapsedToast')}: ${loc(s, 'service') || s.service}`);
    prev.current = tv.state;
  }, [tv.state]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (a, body) => run(() => api.post(`/sessions/${s.id}/${a}`, body), null).then((r) => { setConfirmEarly(false); onChange?.(r); });
  const main = tv.legacy ? fmtMs(activeMs(s, now)) : fmtCountdown(tv.remaining);
  return (
    <div className={`sess ${tv.state === 'ELAPSED' ? 'sess-elapsed' : ''}`}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <b>{loc(s, 'service') || s.service}</b> <Chip s={tv.legacy ? s.status : TIMER_TONE[tv.state]} label={tv.legacy ? undefined : t(`TIMER_${tv.state}`)} />
          <div className="small muted">{s.patient_name && `${s.patient_name} · `}{s.room}{s.clinician && ` · ${s.clinician}`}</div>
          {!tv.legacy && <div className="small muted">{t('planned')} {s.planned_minutes} {t('minShort')} · {t('scheduledEnd')} <b>{fmt(s.scheduled_end_at)}</b></div>}
        </div>
        <div style={{ textAlign: 'end' }}>
          <span className="timer" aria-label={tv.legacy ? t('duration') : t('remaining')}>{main}</span>
          {tv.state === 'ELAPSED' && <div className="small err">+{fmtCountdown(tv.overtime)} {t('overtime')}</div>}
        </div>
      </div>
      {tv.state === 'ELAPSED' && <div className="banner bad" role="alert" style={{ margin: '8px 0' }}>{t('elapsedNotice')}</div>}
      <div className="row" style={{ marginTop: 6 }}>
        {tv.state === 'ELAPSED' ? <>
          <button className="btn sm" disabled={busy} onClick={() => go('complete', { mode: 'scheduled' })}>{t('confirmCompletion')}</button>
          <button className="btn ghost sm" disabled={busy} onClick={() => go('complete', { mode: 'now' })}>{t('continuedEndNow')}</button>
        </> : <>
          {s.status === 'ACTIVE' && <button className="btn ghost sm" disabled={busy} onClick={() => go('pause')}>{t(tv.legacy ? 'pause' : 'pauseTimer')}</button>}
          {s.status === 'PAUSED' && <button className="btn ghost sm" disabled={busy} onClick={() => go('resume')}>{t(tv.legacy ? 'resume' : 'resumeTimer')}</button>}
          {tv.legacy ? <button className="btn sm" disabled={busy} onClick={() => go('complete')}>{t('complete')}</button>
            : confirmEarly ? <><button className="btn red sm" disabled={busy} onClick={() => go('complete')}>{t('confirmEndEarly')}</button><button className="btn ghost sm" onClick={() => setConfirmEarly(false)}>{t('cancel')}</button></>
              : <button className="btn sm" disabled={busy} onClick={() => setConfirmEarly(true)}>{t('endEarly')}</button>}
        </>}
        {onCorrect && <button className="btn ghost sm" onClick={() => onCorrect({ kind: 'SESSION_END', entity_id: s.id, started: s.started_at, open: true })}>{t('requestCorrection')}</button>}
      </div>
    </div>
  );
}

/** The ten timing facts of a visit, from stored timestamps. Live values tick; recorded values never change. */
export function TimingGrid({ tm, sessions = [], now }) {
  const { t, fmt } = useI18n();
  const w = waitingView(tm, now);
  const live = (on) => (on ? ' ●' : '');
  const open = sessions.filter((x) => x.status !== 'COMPLETED' && x.planned_minutes);
  const done = sessions.filter((x) => x.status === 'COMPLETED');
  const lastEnd = done.length ? done.map((x) => x.ended_effective).sort().at(-1) : tm.last_treatment_end_at;
  const items = [
    [t('arrivalAt'), fmt(tm.arrival_at)], [t('waitBefore'), fmtWait(w.before) + live(!tm.room_entry_at && w.live)], [t('roomEntry'), tm.room_entry_at ? fmt(tm.room_entry_at) : '—'],
    [t('waitInRoom'), w.inRoom == null ? '—' : fmtWait(w.inRoom) + live(w.live && !!tm.room_entry_at)], [t('treatmentStart'), tm.treatment_start_at ? fmt(tm.treatment_start_at) : '—'], [t('waitTotal'), fmtWait(w.total) + live(w.live)],
    [t('planned'), sessions.length ? sessions.filter((x) => x.planned_minutes).map((x) => `${x.planned_minutes} ${t('minShort')}`).join(' · ') || '—' : '—'],
    [t('remaining'), open.length ? open.map((x) => { const v = timerView(x, now); return v.state === 'ELAPSED' ? t('TIMER_ELAPSED') : `${fmtCountdown(v.remaining)}${v.state === 'PAUSED' ? ' ⏸' : ''}`; }).join(' · ') : '—'],
    [t('scheduledEnd'), open.length ? open.map((x) => fmt(x.scheduled_end_at)).join(' · ') : '—'], [t('actualEnd'), lastEnd && !open.length ? fmt(lastEnd) : '—'],
    [t('roomExit'), tm.room_exit_at ? fmt(tm.room_exit_at) : '—'], [t('totalVisit'), tm.departed_at ? fmtWait(Date.parse(tm.departed_at) - Date.parse(tm.arrival_at)) : `${fmtWait(now - Date.parse(tm.arrival_at))} ●`],
  ];
  return <dl className="tgrid">{items.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

/** Active treatment timers on a room/bed. Shows time only (no patient identity), so it is safe on the shared room map. */
export function RoomTimers({ room, now }) {
  const { t } = useI18n();
  if (!room.timers?.length) return null;
  return (
    <div className="rtimers small">
      {room.timers.map((x) => {
        const label = room.stations.find((st) => st.id === x.station_id)?.code || room.code;
        const left = x.scheduled_end_at ? Date.parse(x.scheduled_end_at) - now : null;
        const elapsed = x.timer_state === 'ELAPSED' || (x.timer_state === 'RUNNING' && left != null && left <= 0);
        return <div key={x.session_id} className={elapsed ? 'err' : ''}>{label} · {x.planned_ms == null ? t('inTreatment') : elapsed ? t('TIMER_ELAPSED') : x.timer_state === 'PAUSED' ? `⏸ ${fmtCountdown(x.remaining_ms)}` : `${fmtCountdown(left)} ${t('timeLeft')}`}</div>;
      })}
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
    if (e.type === 'TREATMENT_STARTED') return [d.service, d.location, d.planned_minutes && `${d.planned_minutes} ${t('minShort')}`, d.scheduled_end_at && `→ ${fmt(d.scheduled_end_at)}`].filter(Boolean).join(' · ');
    if (e.type === 'TIMER_ELAPSED') return `${t('scheduledEnd')} ${fmt(d.scheduled_end_at)}`;
    if (e.type === 'TREATMENT_COMPLETED' && d.kind) return `${t(`completionKind_${d.kind}`)}${d.kind !== 'AUTO' ? ` · ${t('actualEnd')} ${fmt(d.ended_at)}` : ''}`;
    return [d.queue, d.service, d.room, d.station, d.location, d.ref, d.late_close && 'late close'].filter(Boolean).join(' · ');
  };
  const D = data?.durations; const now = useTicker(1000);
  return (
    <Modal wide title={`${t('timelineTitle')} — ${data ? `${loc(data.patient)} (${data.patient.mrn})` : ''}`} onClose={onClose}>
      {error && <p className="err">{error.message}</p>}
      {!data ? <p className="muted">…</p> : (
        <div className="stack">
          <div className="card"><h2>{t('timing')}</h2><TimingGrid tm={data.timing} sessions={D?.sessions || []} now={now} /></div>
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

export function StartSessionModal({ visit, user, onClose, onDone }) {
  const { t, loc } = useI18n(); const { run, busy } = useAction();
  const key = useRef(newKey()); // stable across retries/double clicks → server returns the same session
  const { data, error } = usePoll(`/visits/${visit.id}/treatment-options`, 0);
  const [deptId, setDeptId] = useState(''); const [serviceId, setServiceId] = useState(''); const [clinId, setClinId] = useState(''); const [problem, setProblem] = useState(''); const [minutes, setMinutes] = useState('');
  const isAdmin = user.role === 'admin';
  const forOthers = !!data?.viewer.can_start_for_others;
  const dept = data?.departments.find((d) => String(d.id) === String(deptId)) || data?.departments[0];
  const services = dept?.services || [];
  const svc = services.find((x) => String(x.id) === String(serviceId));
  const authorized = svc?.authorized || [];
  const iCan = (x) => x.can_start_as_me;
  const clinician = forOthers ? authorized.find((c) => String(c.id) === String(clinId)) : authorized.find((c) => c.id === user.id);
  const needSettings = (txt) => (isAdmin ? `${txt.a}` : `${txt.o}`);
  const pickService = (id) => {
    setServiceId(id); setProblem('');
    setMinutes(String(services.find((x) => String(x.id) === String(id))?.default_minutes ?? ''));
    const sv = services.find((x) => String(x.id) === String(id));
    const auth = sv?.authorized || [];
    setClinId(auth.some((c) => c.id === user.id) ? String(user.id) : auth.length === 1 ? String(auth[0].id) : '');
  };
  const hasAnyOwn = services.some(iCan);
  const nMin = Number(minutes); const minOk = svc && /^\d+$/.test(String(minutes).trim()) && nMin >= svc.min_minutes && nMin <= svc.max_minutes && (svc.allow_override || nMin === svc.default_minutes);
  const fill = (txt) => txt.replace('{min}', svc?.min_minutes).replace('{max}', svc?.max_minutes).replace('{def}', svc?.default_minutes);
  const canConfirm = data?.ready && svc && clinician && minOk && !busy;
  const goSettings = () => { onClose(); try { location.hash = '/settings'; } catch { /* hash unavailable */ } };
  const submit = async () => {
    setProblem('');
    const r = await run(async () => {
      try { return await api.post(`/visits/${visit.id}/sessions`, { service_id: Number(serviceId), clinician_id: forOthers ? Number(clinId) : undefined, planned_minutes: Number(minutes), idem_key: key.current }); }
      catch (e) { if (e.code !== 'NETWORK') setProblem(e.message); throw e; }
    }, `${t('treatmentStarted')}: ${loc(svc)} — ${loc(clinician)} · ${nMin} ${t('minShort')}`);
    if (r) { onDone(); onClose(); }
  };
  const warn = (txt, extra) => <div className="banner warn" role="alert">{txt}{extra}</div>;
  return (
    <Modal title={`${t('startSession')} — ${visit.patient_name}`} onClose={onClose}>
      <div className="stack">
        {error && <p className="err">{error.message}</p>}
        {!data ? <p className="muted">{t('loading')}</p> : <>
          {!data.ready && warn(data.not_ready_reason === 'NO_ROOM' ? t('needRoom') : t('needEntry'))}
          {data.departments.length === 0 && warn(t('noDeptVisit'))}
          {data.departments.length > 1 && (
            <div className="field"><label htmlFor="st-dept">{t('serviceDept')}</label>
              <select id="st-dept" value={dept?.id ?? ''} onChange={(e) => { setDeptId(e.target.value); setServiceId(''); setClinId(''); }}>{data.departments.map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select></div>
          )}
          {dept && data.departments.length === 1 && <p className="small muted">{t('serviceDept')}: <b>{loc(dept)}</b></p>}
          {dept && services.length === 0 && warn(t('noServicesFor').replace('{dept}', loc(dept)), <> {needSettings({ a: t('noServicesAdmin'), o: t('noServicesOther') })}</>)}
          {dept && services.length > 0 && !forOthers && !hasAnyOwn && warn(t('notAuthAny').replace('{dept}', loc(dept)), <> {t('notAuthAnyHelp')}</>)}
          {services.length > 0 && (
            <div className="field"><label htmlFor="st-service">{t('service')} <span className="req" aria-hidden="true">*</span><span className="sr-only"> ({t('requiredWord')})</span></label>
              <select id="st-service" aria-required="true" value={serviceId} onChange={(e) => pickService(e.target.value)}>
                <option value="">{t('chooseService')}</option>
                {services.map((x) => {
                  const blocked = forOthers ? x.authorized.length === 0 : !iCan(x);
                  return <option key={x.id} value={x.id}>{loc(x)}{blocked ? ` — ${forOthers ? t('noClinicianTag') : t('notAuthorizedTag')}` : ''}</option>;
                })}
              </select></div>
          )}
          {svc && !forOthers && !iCan(svc) && authorized.length > 0 && warn(t('notAuthSvc').replace('{svc}', loc(svc)), <> {t('notAuthAnyHelp')}</>)}
          {svc && authorized.length === 0 && warn(t('noAuthClinician'), <> {needSettings({ a: t('noAuthAdmin'), o: t('noAuthOther') })} {isAdmin && <button type="button" className="btn ghost sm" onClick={goSettings}>{t('openSettings')}</button>}</>)}
          {svc && authorized.length > 0 && (forOthers
            ? <div className="field"><label htmlFor="st-clin">{t('startOnBehalf')} <span className="req" aria-hidden="true">*</span></label>
                <select id="st-clin" aria-required="true" value={clinId} onChange={(e) => setClinId(e.target.value)}>
                  <option value="">—</option>{authorized.map((c) => <option key={c.id} value={c.id}>{loc(c)} · {t(c.availability)}</option>)}</select>
                <small className="hint">{t('onBehalfNote')} {t('authNote')}</small></div>
            : <p className="small">{t('startingAs')}: <b>{loc(user)}</b></p>)}
          {svc && clinician && (
            <>
              <dl className="tgrid compact" aria-label="Summary">
                <div><dt>{t('summaryPatient')}</dt><dd>{loc(data.patient)} · {data.patient.mrn}</dd></div><div><dt>{t('department')}</dt><dd>{loc(dept)}</dd></div>
                <div><dt>{t('service')}</dt><dd>{loc(svc)}</dd></div><div><dt>{t('clinician')}</dt><dd>{loc(clinician)}</dd></div><div><dt>{t('summaryRoom')}</dt><dd>{data.location || '—'}</dd></div>
              </dl>
              <div className="field"><label htmlFor="st-minutes">{t('durationMin')} <span className="req" aria-hidden="true">*</span><span className="sr-only"> ({t('requiredWord')})</span></label>
                <input id="st-minutes" type="number" inputMode="numeric" min={svc.min_minutes} max={svc.max_minutes} step="1" aria-required="true" aria-invalid={!minOk ? 'true' : undefined} aria-describedby="st-minutes-hint" disabled={!svc.allow_override} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                {minOk ? <small id="st-minutes-hint" className="hint">{svc.allow_override ? fill(t('durationHint')) : fill(t('durationFixed'))}</small> : <div id="st-minutes-hint" className="field-err" role="alert">{fill(t('durationInvalid'))}</div>}
              </div>
            </>
          )}
          {problem && <div className="banner bad" role="alert">{problem}</div>}
        </>}
        <div className="row"><button className="btn" disabled={!canConfirm} onClick={submit}>{t('confirm')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
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
