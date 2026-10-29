import { api, usePoll, useTicker } from '../api.js';
import { useI18n, fmtMs, fmtCountdown, timerView } from '../i18n.jsx';
import { Chip, Empty, useAction } from '../ui.jsx';
import { SessionControls, TimelineModal, RoomTimers } from './shared.jsx';
import { useState } from 'react';

export default function Dashboard({ user, staff }) {
  const { t, loc } = useI18n(); const { run } = useAction();
  const cfg = usePoll('/config', 10000); const queue = usePoll('/queue', 4000); const sess = usePoll('/sessions/active', 4000);
  const now = useTicker(1000); const [tl, setTl] = useState(null);
  const config = cfg.data; const entries = queue.data?.entries || []; const sessions = sess.data?.sessions || [];
  if (!config) return <p className="muted">{t('loading')}</p>;
  const rooms = config.rooms.filter((r) => r.active);
  const depts = config.departments.filter((d) => d.active && (config.scope_department == null || d.id === config.scope_department));
  const call = async (d) => { const r = await run(() => api.post('/queue/call-next', { department_id: d.id })); if (r === true) return; queue.reload(); };
  return (
    <>
      <div className="kpis">
        {[[t('waiting'), entries.filter((e) => e.status === 'WAITING').length], [t('inTreatment'), sessions.length], [t('roomsFree'), rooms.filter((r) => r.display_status === 'AVAILABLE').length], [t('staffAvail'), staff.filter((s) => s.availability === 'AVAILABLE').length]]
          .map(([l, v]) => <div key={l} className="card kpi"><b>{v}</b><span>{l}</span></div>)}
      </div>
      <div className="grid g2">
        <div className="card"><h2>{t('queue')}</h2>
          {depts.map((d) => {
            const list = entries.filter((e) => e.department_id === d.id);
            return (
              <div key={d.id} style={{ marginBottom: 12 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}><h3>{loc(d)} <span className="muted">({list.filter((e) => e.status === 'WAITING').length})</span></h3>
                  <button className="btn sm" onClick={() => call(d)} disabled={!list.some((e) => e.status === 'WAITING')}>{t('callNext')}</button></div>
                {list.slice(0, 5).map((e) => (
                  <div key={e.id} className="row small" style={{ padding: '4px 0' }}>
                    <span className="q-no">{e.display}</span><span style={{ flex: 1 }}>{e.patient_name}</span>
                    {e.priority > 0 && <Chip s="WAITING" label={t(e.priority === 2 ? 'urgent' : 'high')} />}
                    <Chip s={e.status} /><span className="muted">{fmtMs(now - Date.parse(e.created_at))}</span>
                    <button className="btn ghost sm" onClick={() => setTl(e.visit_id)}>{t('timeline')}</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="card"><h2>{t('sessions')}</h2>
          {sessions.length === 0 ? <Empty /> : sessions.map((s) => <div key={s.id} style={{ padding: '6px 0', borderTop: '1px solid rgba(46,85,178,.1)' }}>
            {user.role === 'reception' ? <div className="row" style={{ justifyContent: 'space-between' }}><span><b>{s.patient_name}</b> · {s.service} · {s.room}</span><span className="timer">{(() => { const v = timerView(s, now); return v.legacy ? fmtMs(now - Date.parse(s.started_at)) : v.state === 'ELAPSED' ? t('TIMER_ELAPSED') : fmtCountdown(v.remaining); })()}</span></div>
              : <SessionControls s={s} now={now} user={user} onChange={sess.reload} />}</div>)}
        </div>
      </div>
      <div className="card"><h2>{t('rooms')}</h2>
        <div className="rooms">{rooms.map((r) => (
          <div key={r.id} className={`room ${r.display_status}`}>
            <div className="row" style={{ justifyContent: 'space-between' }}><b>{r.code}</b><Chip s={r.display_status} /></div>
            <span className="small muted">{loc(r)}{r.status_reason ? ` — ${r.status_reason}` : ''}</span>
            {r.stations.length > 0 ? <div className="beds">{r.stations.map((s) => <span key={s.id} className={`bed ${s.occupied_by ? 'busy' : ''}`}>{s.code.replace('BED-', 'B')}</span>)}</div>
              : <span className="small">{r.occupants}/{r.capacity}</span>}
            <RoomTimers room={r} now={now} />
          </div>))}</div>
      </div>
      <div className="card"><h2>{t('staff')}</h2>
        <div className="grid g3">{staff.filter((s) => s.role === 'clinician' && s.active).map((s) => <div key={s.id} className="row" style={{ justifyContent: 'space-between' }}><span>{loc(s)}</span><Chip s={s.availability} /></div>)}</div>
      </div>
      {tl && <TimelineModal visitId={tl} onClose={() => setTl(null)} />}
    </>
  );
}
