import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Chip, Empty, Modal, useAction } from '../ui.jsx';

export default function Corrections({ user }) {
  const { t, fmtDT } = useI18n(); const { run } = useAction();
  const c = usePoll('/corrections', 5000); const [d, setD] = useState(null);
  const canDecide = ['admin', 'supervisor'].includes(user.role);
  const decide = async () => { const r = await run(() => api.post(`/corrections/${d.id}/decision`, { approve: d.approve, note: d.note }), d.approve ? t('approved') : t('rejected')); if (r) { setD(null); c.reload(); } };
  const rows = c.data || [];
  return (
    <div className="card"><h2>{t('corrections')}</h2>
      <p className="small muted">Original events are never overwritten: approved corrections add a linked record and reports use the corrected time.</p>
      {rows.length === 0 ? <Empty /> : <div className="tbl"><table>
        <thead><tr><th>{t('patient')}</th><th>Type</th><th>{t('originalTime')}</th><th>{t('correctedTime')}</th><th>{t('reason')}</th><th>{t('by')}</th><th>{t('status')}</th><th /></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td>{r.patient_name}<div className="small muted">{r.mrn}</div></td><td>{r.kind}</td><td>{fmtDT(r.original_ts)}</td><td><b>{fmtDT(r.corrected_ts)}</b></td><td>{r.reason}</td>
          <td>{r.requester}{r.decider && <div className="small muted">→ {r.decider}</div>}</td><td><Chip s={r.status} /></td>
          <td>{canDecide && r.status === 'PENDING' && r.requested_by !== user.id && <div className="row"><button className="btn sm" onClick={() => setD({ id: r.id, approve: true, note: '' })}>{t('approve')}</button><button className="btn ghost sm" onClick={() => setD({ id: r.id, approve: false, note: '' })}>{t('reject')}</button></div>}</td></tr>)}</tbody></table></div>}
      {d && <Modal title={d.approve ? t('approve') : t('reject')} onClose={() => setD(null)}><div className="stack"><label>{t('reason')}<input value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} /></label><button className="btn" onClick={decide}>{t('confirm')}</button></div></Modal>}
    </div>
  );
}
