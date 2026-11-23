import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Empty, Modal, useAction, useToast } from '../ui.jsx';

/** One side of a pair: what a person needs to decide whether two records are the same patient. */
function Side({ p }) {
  const { t, fmtDT } = useI18n();
  const busy = p.open && Object.values(p.open).some((n) => n > 0);
  return (
    <div className="small"><b>{p.mrn}</b> · {p.name}{p.name_ar ? ` · ${p.name_ar}` : ''}
      <div className="muted">{[p.dob, p.sex, p.phone].filter(Boolean).join(' · ') || '—'}</div>
      {p.visit_count !== '' && <div className="muted">{p.visit_count} {t('dupVisits')}{p.last_visit ? ` · ${t('dupLast')} ${fmtDT(p.last_visit)}` : ''}{p.departments?.length ? ` · ${p.departments.join(', ')}` : ''}</div>}
      {busy && <div className="chip warn">{t('dupOpenWork')}</div>}</div>);
}

function ReportForm({ onDone }) {
  const { t } = useI18n(); const toast = useToast(); const { run } = useAction();
  const [f, setF] = useState({ a: '', b: '', reason: '' }); const [err, setErr] = useState('');
  const find = async (mrn) => { const r = await api.get(`/patients?q=${encodeURIComponent(mrn.trim())}`); return (r || []).find((x) => String(x.mrn).toLowerCase() === mrn.trim().toLowerCase()) || null; };
  const send = async () => {
    setErr('');
    const r = await run(async () => {
      const [a, b] = [await find(f.a), await find(f.b)];
      if (!a || !b) { setErr(t('dupNotFound')); return null; }
      return api.post('/patients/flag-duplicate', { patient_id: a.id, other_patient_id: b.id, reason: f.reason });
    }, t('dupReported'));
    if (r) { setF({ a: '', b: '', reason: '' }); onDone(); }
  };
  void toast;
  return (
    <div className="card" data-testid="dup-report"><h2>{t('dupReport')}</h2><p className="small muted">{t('dupReportNote')}</p>
      <div className="form-grid">
        <div className="field"><label htmlFor="dr-a">{t('dupEmrA')}</label><input id="dr-a" value={f.a} onChange={(e) => setF({ ...f, a: e.target.value })} /></div>
        <div className="field"><label htmlFor="dr-b">{t('dupEmrB')}</label><input id="dr-b" value={f.b} onChange={(e) => setF({ ...f, b: e.target.value })} /></div></div>
      <div className="field"><label htmlFor="dr-r">{t('reason')}</label><input id="dr-r" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
      {err && <div className="field-err" role="alert">{err}</div>}
      <button className="btn" disabled={!f.a.trim() || !f.b.trim() || f.reason.trim().length < 5} onClick={send}>{t('dupSendReport')}</button></div>);
}

/** Reception can only report a suspected duplicate; administrators and clinic managers review, link and undo. */
export default function Duplicates({ user }) {
  return ['admin', 'supervisor'].includes(user.role) ? <ManagerView user={user} /> : <ReportForm onDone={() => {}} />;
}

function ManagerView({ user }) {
  const { t, fmtDT } = useI18n(); const { run } = useAction(); const toast = useToast();
  const links = usePoll('/patients/links', 10000); const cands = usePoll('/patients/duplicate-candidates', 0);
  const [m, setM] = useState(null); const [err, setErr] = useState('');
  const d = links.data; const me = d?.me;
  const reload = () => { links.reload(); cands.reload(); };
  const open = (a, b) => { setErr(''); setM({ k: 'propose', a, b, survivor: String(a.id), reason: '', ack: false, conflicts: null }); };
  const propose = async () => {
    setErr('');
    const dup = m.survivor === String(m.a.id) ? m.b : m.a;
    try { await api.post('/patients/links', { duplicate_id: dup.id, survivor_id: Number(m.survivor), reason: m.reason, acknowledge_conflicts: m.ack }); toast(t('dupProposed')); setM(null); reload(); }
    catch (e) { if (e.code === 'DEMOGRAPHIC_CONFLICT') setM({ ...m, conflicts: e.details?.conflicts || ['dob'] }); else setErr(e.details?.fields?.reason || e.details?.fields?.survivor_id || e.details?.fields?.duplicate_id || e.message); }
  };
  const act = async (fn, ok) => { const r = await run(fn, ok); if (r) { setM(null); reload(); } };
  const rows = d?.links || []; const pending = rows.filter((x) => x.status === 'PROPOSED'); const active = rows.filter((x) => x.status === 'ACTIVE'); const past = rows.filter((x) => ['REJECTED', 'UNDONE'].includes(x.status));
  const pair = (l) => <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}><div><div className="small muted">{t('dupDuplicate')}</div><Side p={{ ...l.duplicate, visit_count: '', departments: [] }} /></div><div>→</div><div><div className="small muted">{t('dupSurvivor')}</div><Side p={{ ...l.survivor, visit_count: '', departments: [] }} /></div></div>;
  return (
    <div className="stack">
      <div className="card"><h2>{t('dupCandidates')}</h2><p className="small muted">{t('dupCandidatesNote')}</p>
        {!cands.data ? <p className="muted">{t('loading')}</p> : cands.data.length === 0 ? <Empty /> : <div className="tbl"><table data-testid="dup-candidates"><thead><tr><th>{t('dupWhy')}</th><th>{t('dupRecordA')}</th><th>{t('dupRecordB')}</th><th /></tr></thead>
          <tbody>{cands.data.map((c) => <tr key={`${c.a.id}-${c.b.id}`}><td className="small">{c.why === 'PHONE' ? t('dupWhyPhone') : t('dupWhyNameDob')}</td><td><Side p={c.a} /></td><td><Side p={c.b} /></td><td><button className="btn sm" onClick={() => open(c.a, c.b)}>{t('dupLinkThem')}</button></td></tr>)}</tbody></table></div>}</div>
      {(d?.flags || []).length > 0 && <div className="card"><h2>{t('dupFlagged')}</h2>
        <div className="tbl"><table><tbody>{d.flags.map((f) => <tr key={f.id}><td className="small">{fmtDT(f.ts)} · {f.flagged_by_name}</td><td className="small"><b>{f.a?.mrn}</b> {f.a?.name} ↔ <b>{f.b?.mrn}</b> {f.b?.name}<div className="muted">{f.reason}</div></td>
          <td><div className="row"><button className="btn sm" onClick={() => open(f.a, f.b)}>{t('dupReview')}</button><button className="btn ghost sm" onClick={() => act(() => api.post(`/patients/flags/${f.id}/dismiss`), t('saDone'))}>{t('saDismiss')}</button></div></td></tr>)}</tbody></table></div></div>}
      <div className="card"><h2>{t('dupPending')}</h2>
        {pending.length === 0 ? <p className="muted small">—</p> : <div className="tbl"><table data-testid="dup-pending"><tbody>{pending.map((l) => <tr key={l.id}><td>{pair(l)}</td><td className="small">{l.reason}<div className="muted">{t('dupProposedBy')} {l.proposer} · {fmtDT(l.proposed_at)}</div>{l.conflicts.length > 0 && <div className="chip warn">{t('dupConflictChip')}</div>}</td>
          <td><div className="row"><button className="btn sm" data-testid={`approve-${l.id}`} disabled={l.proposed_by === me} title={l.proposed_by === me ? t('dupOtherPerson') : ''} onClick={() => setM({ k: 'approve', l, note: '' })}>{t('approve')}</button>
            <button className="btn ghost sm" onClick={() => setM({ k: 'reject', l, note: '' })}>{l.proposed_by === me ? t('dupWithdraw') : t('reject')}</button></div>{l.proposed_by === me && <div className="small muted">{t('dupOtherPerson')}</div>}</td></tr>)}</tbody></table></div>}</div>
      <div className="card"><h2>{t('dupLinked')}</h2>
        {active.length === 0 ? <p className="muted small">—</p> : <div className="tbl"><table data-testid="dup-active"><tbody>{active.map((l) => <tr key={l.id}><td>{pair(l)}</td><td className="small">{l.reason}<div className="muted">{t('dupApprovedBy')} {l.approver} · {fmtDT(l.approved_at)}</div></td>
          <td>{user.role === 'admin' && <button className="btn ghost sm" onClick={() => setM({ k: 'undo', l, reason: '' })}>{t('dupUndo')}</button>}</td></tr>)}</tbody></table></div>}
        {past.length > 0 && <details style={{ marginTop: 8 }}><summary className="small muted">{t('dupHistory')} ({past.length})</summary><div className="tbl"><table><tbody>{past.map((l) => <tr key={l.id}><td className="small">{l.status} · {l.duplicate?.mrn} → {l.survivor?.mrn}</td><td className="small muted">{l.undo_reason || l.decision_note || ''}</td></tr>)}</tbody></table></div></details>}</div>
      <ReportForm onDone={reload} />
      {m?.k === 'propose' && <Modal title={t('dupLinkThem')} onClose={() => setM(null)} wide><div className="stack" data-testid="dup-propose">
        <p className="small">{t('dupChoose')}</p>
        {[m.a, m.b].map((p) => <label key={p.id} className="chk" style={{ alignItems: 'flex-start' }}><input type="radio" name="surv" checked={m.survivor === String(p.id)} onChange={() => setM({ ...m, survivor: String(p.id) })} /><span><b>{t('dupKeep')}</b><Side p={p} /></span></label>)}
        <div className="field"><label htmlFor="dp-reason">{t('dupReasonLabel')}</label><input id="dp-reason" value={m.reason} onChange={(e) => setM({ ...m, reason: e.target.value })} /></div>
        {m.conflicts && <div className="banner warn" role="alert">{t('dupConflictText')}<label className="chk"><input type="checkbox" checked={m.ack} onChange={(e) => setM({ ...m, ack: e.target.checked })} />{t('dupConflictAck')}</label></div>}
        {err && <div className="field-err" role="alert">{err}</div>}
        <button className="btn" disabled={m.reason.trim().length < 15 || (m.conflicts && !m.ack)} onClick={propose}>{t('dupPropose')}</button></div></Modal>}
      {m?.k === 'approve' && <Modal title={t('approve')} onClose={() => setM(null)} wide><div className="stack">{pair(m.l)}<p className="small">{m.l.reason}</p>
        <div className="field"><label htmlFor="da-note">{t('dupNoteOptional')}</label><input id="da-note" value={m.note} onChange={(e) => setM({ ...m, note: e.target.value })} /></div>
        <button className="btn" onClick={() => act(() => api.post(`/patients/links/${m.l.id}/approve`, { note: m.note }), t('dupApproved'))}>{t('approve')}</button></div></Modal>}
      {m?.k === 'reject' && <Modal title={t('reject')} onClose={() => setM(null)}><div className="stack">
        <div className="field"><label htmlFor="dj-note">{t('saBgNote')}</label><input id="dj-note" value={m.note} onChange={(e) => setM({ ...m, note: e.target.value })} /></div>
        <button className="btn" disabled={m.note.trim().length < 3} onClick={() => act(() => api.post(`/patients/links/${m.l.id}/reject`, { note: m.note }), t('saDone'))}>{t('confirm')}</button></div></Modal>}
      {m?.k === 'undo' && <Modal title={t('dupUndo')} onClose={() => setM(null)}><div className="stack"><p className="small">{t('dupUndoNote')}</p>
        <div className="field"><label htmlFor="du-reason">{t('reason')}</label><input id="du-reason" value={m.reason} onChange={(e) => setM({ ...m, reason: e.target.value })} /></div>
        <button className="btn" disabled={m.reason.trim().length < 10} onClick={() => act(() => api.post(`/patients/links/${m.l.id}/undo`, { reason: m.reason }), t('saDone'))}>{t('dupUndo')}</button></div></Modal>}
    </div>);
}
