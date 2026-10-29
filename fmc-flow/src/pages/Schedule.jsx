import { useState } from 'react';
import { usePoll, useTicker, serverNow } from '../api.js';
import { useI18n, fmtCountdown, timerView } from '../i18n.jsx';
import { Empty } from '../ui.jsx';
import { DocumentationModal, ScheduleBadge } from './shared.jsx';

/** Day schedule: one row per treatment session, coloured by documentation status (YELLOW incomplete, ORANGE complete). */
export default function Schedule({ user }) {
  const { t, loc, fmt } = useI18n(); const now = useTicker(1000);
  const [day, setDay] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: window.__tz || 'Asia/Dubai' }).format(new Date(serverNow())));
  const [doc, setDoc] = useState(null);
  const list = usePoll(`/schedule?from=${day}&to=${day}`, 5000);
  const rows = list.data?.sessions || [];
  return (
    <div className="card"><h2>{t('schedule')}</h2>
      <div className="row" style={{ marginBottom: 10, alignItems: 'center' }}>
        <label htmlFor="sch-day">{t('scheduleDay')}</label>
        <input id="sch-day" type="date" style={{ width: 180 }} value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />
        <span className="sp" />
        <span className="small"><span className="sched sched-yellow"><i aria-hidden="true" />{t('schedYellow')}</span> <span className="sched sched-orange"><i aria-hidden="true" />{t('schedOrange')}</span></span>
      </div>
      <p className="small muted">{t('scheduleHelp')}</p>
      {rows.length === 0 ? <Empty /> : <div className="tbl"><table>
        <thead><tr><th>{t('time')}</th><th>{t('patient')}</th><th>{t('service')}</th><th>{t('clinician')}</th><th>{t('room')}</th><th>{t('status')}</th><th>{t('treatment')}</th><th /></tr></thead>
        <tbody>{rows.map((s) => {
          const tv = timerView(s, now);
          return (
            <tr key={s.id} className={`sched-row sched-row-${(s.schedule_status || '').toLowerCase()}`}>
              <td>{fmt(s.started_at, { hour: '2-digit', minute: '2-digit' })}</td>
              <td><b>{loc(s, 'patient_name') || s.patient_name}</b><div className="small muted">{s.mrn}</div></td>
              <td>{loc(s, 'service') || s.service}{s.planned_minutes ? <div className="small muted">{s.planned_minutes} {t('minShort')}</div> : null}</td>
              <td>{s.clinician}</td>
              <td>{s.room}</td>
              <td><ScheduleBadge status={s.schedule_status} doc={s.documentation} /></td>
              <td className="small">
                {s.status === 'COMPLETED' ? <>{t('TIMER_DONE')}{s.completion_kind ? ` · ${t(`completionKind_${s.completion_kind}`)}` : ''}</>
                  : tv.state === 'ELAPSED' ? <b className="err">{t('TIMER_ELAPSED')}</b> : <span className="timer">{tv.legacy ? '—' : fmtCountdown(tv.remaining)}</span>}
                {s.operational_checkout_at && <div className="muted">{t('opCheckout')} {fmt(s.operational_checkout_at, { hour: '2-digit', minute: '2-digit' })}{s.operational_checkout_kind === 'AUTO' ? ` · ${t('opCheckoutAutoShort')}` : ''}</div>}
              </td>
              <td><button className="btn ghost sm" onClick={() => setDoc(s)}>{t('docBtn')}</button></td>
            </tr>);
        })}</tbody></table></div>}
      {doc && <DocumentationModal session={doc} user={user} onClose={() => setDoc(null)} onSaved={() => list.reload()} />}
    </div>
  );
}
