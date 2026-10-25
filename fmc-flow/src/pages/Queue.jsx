import { useState } from 'react';
import { api, usePoll, useTicker } from '../api.js';
import { useI18n, fmtMs } from '../i18n.jsx';
import { Chip, Empty, Modal, useAction } from '../ui.jsx';
import { TimelineModal } from './shared.jsx';

export default function Queue({ user }) {
  const { t, loc, fmt } = useI18n(); const { run } = useAction();
  const cfg = usePoll('/config', 15000); const [dep, setDep] = useState('');
  const q = usePoll(`/queue${dep ? `?department_id=${dep}` : ''}`, 3000);
  const now = useTicker(1000); const [pri, setPri] = useState(null); const [tl, setTl] = useState(null);
  const canPri = ['admin', 'supervisor', 'reception'].includes(user.role);
  const config = cfg.data; if (!config) return <p className="muted">{t('loading')}</p>;
  const entries = q.data?.entries || [];
  const depts = config.departments.filter((d) => d.active && (config.scope_department == null || d.id === config.scope_department));
  const callNext = async () => { const d = dep || config.scope_department || depts[0]?.id; await run(() => api.post('/queue/call-next', { department_id: Number(d) })); q.reload(); };
  const savePri = async () => { const r = await run(() => api.patch(`/queue/${pri.id}/priority`, { priority: Number(pri.priority), reason: pri.reason }), t('priority')); if (r) { setPri(null); q.reload(); } };
  return (
    <div className="card">
      <h2><span className="row">{config.scope_department == null && <select value={dep} onChange={(e) => setDep(e.target.value)} style={{ width: 220 }}><option value="">{t('allDepartments')}</option>{depts.map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select>}</span>
        <button className="btn" onClick={callNext} disabled={(config.scope_department == null && !dep) || !entries.some((e) => e.status === 'WAITING' && (!dep || String(e.department_id) === String(dep)))}>{t('callNext')}</button></h2>
      {entries.length === 0 ? <Empty /> : <div className="tbl"><table>
        <thead><tr><th>#</th><th>{t('patient')}</th><th>{t('department')}</th><th>{t('clinician')}</th><th>{t('arrival')}</th><th>{t('waited')}</th><th>{t('priority')}</th><th>{t('status')}</th><th /></tr></thead>
        <tbody>{entries.map((e) => (
          <tr key={e.id}><td><span className="q-no">{e.display}</span></td><td><b>{e.patient_name}</b><div className="small muted">{e.mrn}</div></td><td>{e.department}</td><td>{e.clinician || '—'}</td>
            <td>{fmt(e.created_at, { hour: '2-digit', minute: '2-digit' })}</td><td className="timer" style={{ fontSize: 15 }}>{fmtMs(now - Date.parse(e.created_at))}</td>
            <td>{e.priority ? <span title={e.priority_reason}><Chip s="WAITING" label={t(e.priority === 2 ? 'urgent' : 'high')} /></span> : <span className="muted">{t('normal')}</span>}{canPri && <button className="btn ghost sm" onClick={() => setPri({ id: e.id, priority: e.priority, reason: e.priority_reason || '' })}> ✎</button>}</td>
            <td><Chip s={e.status} /></td><td><button className="btn ghost sm" onClick={() => setTl(e.visit_id)}>{t('timeline')}</button></td></tr>))}</tbody></table></div>}
      <p className="small muted" style={{ marginTop: 10 }}>{t('priority')}: manual only · FIFO within equal priority.</p>
      {pri && <Modal title={t('priority')} onClose={() => setPri(null)}><div className="stack">
        <label>{t('priority')}<select value={pri.priority} onChange={(e) => setPri({ ...pri, priority: e.target.value })}><option value={0}>{t('normal')}</option><option value={1}>{t('high')}</option><option value={2}>{t('urgent')}</option></select></label>
        {Number(pri.priority) > 0 && <label>{t('reason')}<input value={pri.reason} onChange={(e) => setPri({ ...pri, reason: e.target.value })} /></label>}
        <button className="btn" onClick={savePri} disabled={Number(pri.priority) > 0 && !pri.reason.trim()}>{t('save')}</button></div></Modal>}
      {tl && <TimelineModal visitId={tl} onClose={() => setTl(null)} />}
    </div>
  );
}
