import { usePoll, useTicker } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Empty } from '../ui.jsx';
import { SessionControls } from './shared.jsx';

export default function Sessions({ user }) {
  const { t, fmtDT } = useI18n(); const s = usePoll('/sessions/active', 3000); const now = useTicker(1000);
  const list = (s.data?.sessions || []).filter((x) => user.role !== 'clinician' || x.clinician_id === user.id);
  return (
    <div className="card"><h2>{t('sessions')}</h2>
      <p className="small muted">Timers are computed from server timestamps — refresh, navigation or reconnecting never resets or duplicates a session.</p>
      {list.length === 0 ? <Empty /> : list.map((x) => <div key={x.id} style={{ padding: '10px 0', borderTop: '1px solid rgba(46,85,178,.1)' }}>
        <SessionControls s={x} now={now} onChange={s.reload} /><div className="small muted">#{x.id} · {fmtDT(x.started_at)}</div></div>)}
    </div>
  );
}
