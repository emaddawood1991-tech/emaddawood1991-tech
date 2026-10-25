import { usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Chip } from '../ui.jsx';

export default function System({ user }) {
  const { t, fmtDT } = useI18n();
  const isAdmin = user.role === 'admin';
  const h = usePoll('/health', 10000, isAdmin); const a = usePoll('/audit?limit=100', 10000);
  return (
    <>
      {isAdmin && h.data && <div className="card"><h2>{t('health')}</h2>
        <div className="kpis">
          <div className="card kpi"><b><Chip s="ACTIVE" label="UP" /></b><span>{h.data.application.node} · {h.data.application.uptime_s}s</span></div>
          <div className="card kpi"><b><Chip s={h.data.database.connected ? 'ACTIVE' : 'REJECTED'} label={h.data.database.connected ? t('connected') : 'DOWN'} /></b><span>{t('database')}</span></div>
          <div className="card kpi"><b>{h.data.failed_operations_24h}</b><span>{t('failedOps')}</span></div>
          <div className="card kpi"><b>{h.data.sync_problems_24h}</b><span>{t('syncProblems')}</span></div>
          <div className="card kpi"><b><Chip s={h.data.backup.stale ? 'REJECTED' : 'APPROVED'} label={h.data.backup.last ? fmtDT(h.data.backup.last.ts) : t('never')} /></b><span>{t('lastBackup')} · {h.data.backup.encrypted_files} files</span></div>
        </div>
        <h3 style={{ marginTop: 12 }}>{t('recentErrors')}</h3>
        {h.data.recent_errors.length === 0 ? <p className="muted">{t('noData')}</p> : h.data.recent_errors.map((e, i) => <p key={i} className="small">{fmtDT(e.ts)} · {e.source} · {e.code} · {e.message}</p>)}
      </div>}
      <div className="card"><h2>{t('audit')}</h2><div className="tbl"><table>
        <thead><tr><th>Time</th><th>{t('by')}</th><th>Action</th><th>Entity</th></tr></thead>
        <tbody>{(a.data || []).map((r) => <tr key={r.id}><td>{fmtDT(r.ts)}</td><td>{r.actor || '—'}</td><td>{r.action}</td><td className="small muted">{r.entity} {r.entity_id}</td></tr>)}</tbody></table></div></div>
    </>
  );
}
