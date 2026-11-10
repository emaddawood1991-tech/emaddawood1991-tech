import { useMemo, useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Modal, Empty, useToast } from '../ui.jsx';
import { ActivityTable } from './Account.jsx';

const EVENTS = ['RECOVERY_REQUESTED', 'MFA_ENABLED', 'MFA_DISABLED', 'MFA_RESET', 'MFA_RECOVERY_USED', 'MFA_CODES_REGENERATED', 'LOGIN_OK', 'LOGIN_FAILED', 'LOGIN_BLOCKED', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED', 'PASSWORD_RESET', 'SESSIONS_REVOKED', 'USERNAME_CHANGED'];
const SUBS = [['accounts', 'saAccounts'], ['roles', 'saRoles'], ['activity', 'saLoginActivity'], ['access', 'saPatientAccess'], ['alerts', 'saAlerts'], ['audit', 'saAuditHistory'], ['settings', 'saSettings'], ['readiness', 'saReadiness'], ['recovery', 'saRecovery']];
const KINDS = ['PATIENT_EDIT', 'BREAK_GLASS', 'SEARCH', 'SCHEDULE', 'VISITS', 'QUEUE', 'SESSIONS', 'TIMELINE', 'CLINICAL_NOTE', 'APPOINTMENT', 'CORRECTIONS', 'REPORT', 'EXPORT'];

function Accounts() {
  const { t, loc, fmtDT } = useI18n(); const toast = useToast();
  const list = usePoll('/security/accounts', 15000); const [modal, setModal] = useState(null); const [val, setVal] = useState(''); const [err, setErr] = useState('');
  const rows = list.data || [];
  const close = () => { setModal(null); setVal(''); setErr(''); };
  const act = async (fn, ok) => { try { await fn(); if (ok) toast(ok); list.reload(); close(); } catch (e) { setErr(e.details?.fields?.temporary_password || e.details?.fields?.username || e.message); } };
  return (
    <div className="card"><h2>{t('saAccounts')}</h2>
      {rows.length === 0 ? <Empty /> : <div className="tbl"><table>
        <thead><tr><th>{t('name')}</th><th>{t('saRole')}</th><th>{t('saLastLogin')}</th><th>{t('saPwChanged')}</th><th>{t('saSessionsCount')}</th><th>{t('saMfa')}</th><th /></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id} className={u.active ? '' : 'sch-hidden-row'}>
          <td>{loc(u)}<div className="small muted">{u.username}{u.must_change_password ? ` · ${t('saForce')}` : ''}</div></td><td>{u.role}</td>
          <td className="small">{u.last_login_at ? fmtDT(u.last_login_at) : t('saNever')}</td><td className="small">{u.password_changed_at ? fmtDT(u.password_changed_at) : '—'}</td><td>{u.sessions}</td><td>{u.mfa_enabled ? <span className="chip ok">{t('mfaOn')}</span> : <span className="small muted">{t('mfaOff')}</span>}</td>
          <td><div className="row"><button className="btn ghost sm" onClick={() => setModal({ k: 'reset', u })}>{t('saResetPw')}</button><button className="btn ghost sm" disabled={!u.sessions} onClick={() => act(() => api.post(`/security/users/${u.id}/revoke-sessions`), t('saRevoked'))}>{t('saRevoke')}</button><button className="btn ghost sm" onClick={() => { setVal(u.username); setModal({ k: 'name', u }); }}>{t('saRename')}</button>{u.mfa_enabled ? <button className="btn ghost sm" onClick={() => setModal({ k: 'mfa', u })}>{t('saResetMfa')}</button> : null}</div></td></tr>)}</tbody></table></div>}
      {modal?.k === 'reset' && <Modal title={`${t('saResetPw')} — ${loc(modal.u)}`} onClose={close}><div className="stack">
        <div className="field"><label htmlFor="sa-temp">{t('saTempPw')}</label><input id="sa-temp" type="password" autoComplete="new-password" autoFocus value={val} onChange={(e) => setVal(e.target.value)} />{err && <div className="field-err" role="alert">{err}</div>}</div>
        <small className="hint">{t('saTempHint')}</small>
        <div className="row"><button className="btn" disabled={!val} onClick={() => act(() => api.post(`/security/users/${modal.u.id}/reset-password`, { temporary_password: val }), t('saDone'))}>{t('saResetPw')}</button><button className="btn ghost" onClick={close}>{t('cancel')}</button></div></div></Modal>}
      {modal?.k === 'mfa' && <Modal title={`${t('saResetMfa')} — ${loc(modal.u)}`} onClose={close}><div className="stack"><p>{t('saConfirmResetMfa')}</p><div className="row"><button className="btn red" onClick={() => act(() => api.post(`/security/users/${modal.u.id}/reset-mfa`), t('saDone'))}>{t('saResetMfa')}</button><button className="btn ghost" onClick={close}>{t('cancel')}</button></div></div></Modal>}
      {modal?.k === 'name' && <Modal title={`${t('saRename')} — ${loc(modal.u)}`} onClose={close}><div className="stack">
        <div className="field"><label htmlFor="sa-user">{t('saUsername')}</label><input id="sa-user" autoFocus value={val} onChange={(e) => setVal(e.target.value)} />{err && <div className="field-err" role="alert">{err}</div>}</div>
        <div className="row"><button className="btn" disabled={!val} onClick={() => act(() => api.post(`/security/users/${modal.u.id}/username`, { username: val }), t('saSaved'))}>{t('save')}</button><button className="btn ghost" onClick={close}>{t('cancel')}</button></div></div></Modal>}
    </div>);
}

function Roles() {
  const { t, loc, lang } = useI18n(); const r = usePoll('/security/permissions', 0).data; const [q, setQ] = useState('');
  if (!r) return <p className="muted">{t('loading')}</p>;
  const eps = (r.endpoints || []).filter((e) => !q || `${e.method} ${e.path} ${e.permission || ''}`.toLowerCase().includes(q.toLowerCase()));
  return (<div className="stack">
    <div className="card"><h2>{t('saTemplates')}</h2><p className="small muted">{t('saTemplateNote')}</p>
      <div className="tbl"><table><thead><tr><th>{t('saTemplate')}</th><th>{t('saBaseRole')}</th><th>{t('department')}</th><th /></tr></thead>
        <tbody>{(r.templates || []).map((x) => <tr key={x.key} data-testid={`tpl-${x.key}`}><td><b>{lang === 'ar' ? x.name_ar : x.name}</b></td><td><code>{x.base_role}</code></td><td className="small">{x.department_names.length ? x.department_names.join(' / ') : x.needs_department ? '＊' : '—'}</td><td className="small muted">{x.summary}</td></tr>)}</tbody></table></div></div>
    <div className="card"><h2>{t('saRoles')}</h2><p className="small muted">{t('saRolesNote')}</p>
      <div className="tbl"><table><thead><tr><th>{t('saPermission')}</th>{r.roles.map((x) => <th key={x}>{x}</th>)}</tr></thead>
        <tbody>{Object.entries(r.permissions).map(([perm, roles]) => <tr key={perm}><td><code>{perm}</code></td>{r.roles.map((x) => <td key={x} style={{ textAlign: 'center' }}>{roles.includes(x) ? '✓' : '—'}</td>)}</tr>)}</tbody></table></div></div>
    <div className="card"><h2>{t('saEndpoints')}</h2><p className="small muted">{t('saEndpointsNote')}</p>
      <input placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
      <div className="tbl" style={{ maxHeight: 360, overflow: 'auto' }}><table><thead><tr><th>{t('saRoute')}</th><th>{t('saRequires')}</th></tr></thead>
        <tbody>{eps.map((e, i) => <tr key={i}><td className="small"><code>{e.method} {e.path}</code></td><td className="small">{e.permission ? <><code>{e.permission}</code> <span className="muted">({(r.permissions[e.permission] || []).join(', ')})</span></> : <span className="muted">{t('saSignedIn')}</span>}</td></tr>)}</tbody></table></div></div>
  </div>);
}

function Readiness() {
  const { t } = useI18n(); const r = usePoll('/security/readiness', 0).data;
  if (!r) return <p className="muted">{t('loading')}</p>;
  const mark = { ok: '✓', warn: '!', fail: '✕' };
  return (
    <div className="card"><h2>{t('saReadiness')}</h2><p className="small muted">{t('saReadinessNote')}</p>
      <p id="readiness-summary"><b>{r.summary.ok}</b> {t('saRdOk')} · <b>{r.summary.warn}</b> {t('saRdTodo')} · <b>{r.summary.fail}</b> {t('saRdFail')}</p>
      <div className="tbl"><table><thead><tr><th /><th>{t('saRdItem')}</th><th>{t('saRdDetail')}</th></tr></thead>
        <tbody>{r.checks.map((c) => <tr key={c.id} data-testid={`rd-${c.id}`}><td style={{ textAlign: 'center', fontWeight: 700, color: c.status === 'ok' ? '#1e8e4e' : c.status === 'fail' ? '#c0392b' : '#b7791f' }}>{mark[c.status]}</td><td>{c.label}<div className="small muted">{c.class}</div></td><td className="small">{c.detail}</td></tr>)}</tbody></table></div>
      <p className="small muted">{r.note}</p></div>);
}

function Recovery({ config, reload }) {
  const { t, loc, fmtDT } = useI18n(); const toast = useToast();
  const rq = usePoll('/security/recovery-requests', 15000); const bg = usePoll('/security/break-glass', 15000);
  const [modal, setModal] = useState(null); const [pw, setPw] = useState(''); const [mfaToo, setMfaToo] = useState(false); const [note, setNote] = useState(''); const [outcome, setOutcome] = useState('JUSTIFIED'); const [err, setErr] = useState('');
  const close = () => { setModal(null); setPw(''); setNote(''); setErr(''); setMfaToo(false); setOutcome('JUSTIFIED'); };
  const act = async (fn, ok) => { try { await fn(); toast(ok); rq.reload(); bg.reload(); close(); } catch (e) { setErr(e.details?.fields?.temporary_password || e.details?.fields?.note || e.message); } };
  const setBg = async (patch) => { try { await api.patch('/config/settings', patch); toast(t('saSaved')); bg.reload(); reload?.(); } catch (e) { toast(e.message, true); } };
  const reqs = rq.data?.requests || []; const grants = bg.data?.grants || [];
  return (<div className="stack">
    <div className="card"><h2>{t('saRecoveryReqs')}{rq.data?.pending ? <span className="chip warn" style={{ marginInlineStart: 8 }}>{rq.data.pending}</span> : null}</h2><p className="small muted">{t('saRecoveryNote')}</p>
      {reqs.length === 0 ? <Empty /> : <div className="tbl"><table data-testid="recovery-table"><thead><tr><th>{t('saTime')}</th><th>{t('saUsername')}</th><th>{t('saStatus')}</th><th /></tr></thead>
        <tbody>{reqs.map((r) => <tr key={r.id}><td className="small">{fmtDT(r.ts)}</td><td>{r.username}{r.name ? <div className="small muted">{loc(r)}</div> : <div className="small muted">{t('saNoAccount')}</div>}</td><td>{r.status}</td>
          <td>{r.status === 'PENDING' && <div className="row">{r.user_id && <button className="btn ghost sm" onClick={() => setModal({ k: 'reset', r })}>{t('saResetPw')}</button>}<button className="btn ghost sm" onClick={() => act(() => api.post(`/security/recovery-requests/${r.id}/resolve`, { action: 'dismiss' }), t('saDone'))}>{t('saDismiss')}</button></div>}</td></tr>)}</tbody></table></div>}</div>
    <div className="card"><h2>{t('saBreakGlass')}</h2><p className="small muted">{t('saBreakGlassNote')}</p>
      <div className="row"><label className="chk"><input data-testid="bg-enabled" type="checkbox" checked={!!bg.data?.enabled} onChange={(e) => setBg({ break_glass_enabled: e.target.checked ? '1' : '0' })} />{t('saBgEnable')}</label>
        <label className="small">{t('saBgMinutes')} <input type="number" min={15} max={240} defaultValue={bg.data?.minutes ?? 60} key={bg.data?.minutes} style={{ width: 80 }} onBlur={(e) => Number(e.target.value) !== bg.data?.minutes && setBg({ break_glass_minutes: e.target.value })} /></label></div>
      {grants.length === 0 ? <p className="muted small">{t('saBgNone')}</p> : <div className="tbl"><table data-testid="bg-table"><thead><tr><th>{t('saTime')}</th><th>{t('name')}</th><th>{t('saPatient')}</th><th>{t('saBgReason')}</th><th>{t('saStatus')}</th><th /></tr></thead>
        <tbody>{grants.map((g) => <tr key={g.id}><td className="small">{fmtDT(g.granted_at)}</td><td>{g.user_name}<div className="small muted">{g.username}</div></td><td><code>{g.mrn}</code></td><td className="small">{g.reason}</td>
          <td className="small">{g.reviewed_at ? `${g.outcome === 'JUSTIFIED' ? '✓' : '✕'} ${g.reviewer || ''} — ${g.review_note}` : t('saBgUnreviewed')}</td>
          <td>{!g.reviewed_at && <button className="btn ghost sm" onClick={() => setModal({ k: 'review', g })}>{t('saBgReview')}</button>}</td></tr>)}</tbody></table></div>}</div>
    {modal?.k === 'reset' && <Modal title={`${t('saResetPw')} — ${modal.r.username}`} onClose={close}><div className="stack">
      <p className="small">{t('saRecoveryVerify')}</p>
      <div className="field"><label htmlFor="rc-temp">{t('saTempPw')}</label><input id="rc-temp" type="password" autoComplete="new-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <label className="chk"><input type="checkbox" checked={mfaToo} onChange={(e) => setMfaToo(e.target.checked)} />{t('saAlsoMfa')}</label>
      {err && <div className="field-err" role="alert">{err}</div>}
      <div className="row"><button className="btn" disabled={!pw} onClick={() => act(() => api.post(`/security/recovery-requests/${modal.r.id}/resolve`, { action: 'reset', temporary_password: pw, reset_mfa: mfaToo }), t('saDone'))}>{t('saResetPw')}</button><button className="btn ghost" onClick={close}>{t('cancel')}</button></div></div></Modal>}
    {modal?.k === 'review' && <Modal title={`${t('saBgReview')} — ${modal.g.user_name}`} onClose={close}><div className="stack">
      <p className="small">{modal.g.reason}</p>
      <label className="chk"><input type="radio" checked={outcome === 'JUSTIFIED'} onChange={() => setOutcome('JUSTIFIED')} />{t('saBgJustified')}</label><label className="chk"><input type="radio" checked={outcome === 'NOT_JUSTIFIED'} onChange={() => setOutcome('NOT_JUSTIFIED')} />{t('saBgNotJustified')}</label>
      <div className="field"><label htmlFor="bg-note">{t('saBgNote')}</label><input id="bg-note" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      {err && <div className="field-err" role="alert">{err}</div>}
      <div className="row"><button className="btn" disabled={note.trim().length < 3} onClick={() => act(() => api.post(`/security/break-glass/${modal.g.id}/review`, { outcome, note }), t('saDone'))}>{t('save')}</button><button className="btn ghost" onClick={close}>{t('cancel')}</button></div></div></Modal>}
  </div>);
}

function Activity() {
  const { t, loc } = useI18n(); const [uid, setUid] = useState(''); const [ev, setEv] = useState('');
  const users = usePoll('/security/accounts', 0).data || [];
  const rows = usePoll(`/security/login-activity?user_id=${uid}&event=${ev}&limit=200`, 15000).data || [];
  return (
    <div className="card"><h2>{t('saLoginActivity')}</h2>
      <div className="row" style={{ marginBottom: 8 }}>
        <select aria-label={t('saFilterUser')} value={uid} onChange={(e) => setUid(e.target.value)}><option value="">{t('saFilterUser')}</option>{users.map((u) => <option key={u.id} value={u.id}>{loc(u)}</option>)}</select>
        <select aria-label={t('saFilterEvent')} value={ev} onChange={(e) => setEv(e.target.value)}><option value="">{t('saFilterEvent')}</option>{EVENTS.map((x) => <option key={x} value={x}>{t(`saEv_${x}`)}</option>)}</select></div>
      {rows.length === 0 ? <Empty /> : <div className="tbl"><table><thead><tr><th>{t('saTime')}</th><th>{t('name')}</th><th>{t('saEvent')}</th><th>{t('saAddress')}</th></tr></thead>
        <tbody>{rows.map((e) => <tr key={e.id}><td className="small">{new Date(e.ts).toLocaleString()}</td><td>{e.name || '—'}<div className="small muted">{e.username || ''}</div></td><td>{t(`saEv_${e.event}`)}</td><td className="small">{e.ip || '—'}</td></tr>)}</tbody></table></div>}
    </div>);
}

function Access() {
  const { t, loc, fmtDT } = useI18n(); const [term, setTerm] = useState(''); const [found, setFound] = useState(null); const [patient, setPatient] = useState(null); const [uid, setUid] = useState(''); const [kind, setKind] = useState('');
  const users = usePoll('/security/accounts', 0).data || [];
  const rows = usePoll(`/security/access-log?patient_id=${patient?.id || ''}&user_id=${uid}&kind=${kind}&limit=300`, 15000).data || [];
  const search = async (v) => { setTerm(v); if (v.trim().length < 3) return setFound(null); try { setFound(await api.get(`/patients?q=${encodeURIComponent(v.trim())}`)); } catch { /* shown by the connection banner */ } };
  return (
    <div className="card"><h2>{t('saPatientAccess')}</h2>
      <div className="row" style={{ marginBottom: 8 }}>
        {patient ? <span className="chip ok">{loc(patient)} · {patient.mrn} <button className="btn ghost sm" aria-label={t('cancel')} onClick={() => { setPatient(null); setTerm(''); }}>✕</button></span>
          : <input id="sa-access-q" type="search" aria-label={t('saPickPatient')} placeholder={t('saPickPatient')} value={term} onChange={(e) => search(e.target.value)} style={{ minWidth: 280 }} />}
        <select aria-label={t('saAccessBy')} value={uid} onChange={(e) => setUid(e.target.value)}><option value="">{t('saFilterUser')}</option>{users.map((u) => <option key={u.id} value={u.id}>{loc(u)}</option>)}</select>
        <select aria-label={t('saAccessKind')} value={kind} onChange={(e) => setKind(e.target.value)}><option value="">{t('saAccessAny')}</option>{KINDS.map((k) => <option key={k} value={k}>{t(`saKind_${k}`)}</option>)}</select></div>
      {!patient && found?.slice(0, 8).map((p) => <button key={p.id} type="button" className="btn ghost patient-row" onClick={() => { setPatient(p); setFound(null); }}><b>{loc(p)}</b><span className="muted small">{p.mrn}</span></button>)}
      {rows.length === 0 ? <p className="muted small">{t('saAccessNone')}</p> : <div className="tbl"><table><thead><tr><th>{t('saTime')}</th><th>{t('saAccessBy')}</th><th>{t('saAccessPatient')}</th><th>{t('saAccessKind')}</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td className="small">{fmtDT(r.ts)}</td><td>{r.actor || '—'}<div className="small muted">{r.username || ''}</div></td><td>{r.patient_name}<div className="small muted">{r.mrn}</div></td><td>{t(`saKind_${r.kind}`)}</td></tr>)}</tbody></table></div>}
    </div>);
}

function Alerts() {
  const { t, fmtDT } = useI18n(); const toast = useToast(); const [all, setAll] = useState(false);
  const al = usePoll(`/security/alerts?status=${all ? 'all' : 'open'}`, 15000); const rows = al.data?.alerts || [];
  const ack = async (id) => { try { await api.post(`/security/alerts/${id}/ack`); al.reload(); } catch (e) { toast(e.message, true); } };
  const brief = (d) => Object.entries(d || {}).filter(([k]) => k !== 'problems').map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ');
  return (
    <div className="card"><h2>{t('saAlerts')}<button className="btn ghost sm" onClick={() => setAll(!all)}>{all ? t('saAlertOpen') : t('saAlertAll')}</button></h2>
      {rows.length === 0 ? <p className="muted">{t('saAlertNone')}</p> : <div className="tbl"><table><thead><tr><th>{t('saTime')}</th><th>{t('saEvent')}</th><th>{t('name')}</th><th /></tr></thead>
        <tbody>{rows.map((a) => <tr key={a.id} className={a.status === 'OPEN' ? '' : 'sch-hidden-row'}><td className="small">{fmtDT(a.ts)}</td>
          <td><span className={`chip ${a.severity === 'CRITICAL' ? 'bad' : 'warn'}`}>{t(`saAlertSev_${a.severity}`)}</span> <b>{t(`saAl_${a.kind}`)}</b><div className="small muted">{brief(a.detail)}</div></td><td>{a.user_name || '—'}<div className="small muted">{a.username || ''}</div></td>
          <td>{a.status === 'OPEN' && <button className="btn sm" onClick={() => ack(a.id)}>{t('saAck')}</button>}</td></tr>)}</tbody></table></div>}
    </div>);
}

function Audit() {
  const { t, fmtDT } = useI18n(); const [q, setQ] = useState(''); const chain = usePoll('/security/audit-chain', 0); const c = chain.data;
  const rows = usePoll('/audit?limit=300', 20000).data || [];
  const shown = useMemo(() => { const s = q.trim().toLowerCase(); return s ? rows.filter((r) => `${r.action} ${r.actor || ''} ${r.entity || ''} ${r.entity_id || ''}`.toLowerCase().includes(s)) : rows; }, [rows, q]);
  return (
    <div className="card"><h2>{t('saAuditHistory')}<button className="btn ghost sm" onClick={chain.reload}>{t('saVerifyNow')}</button></h2>
      {c && <div className={`banner ${c.ok ? 'ok' : 'bad'}`} role={c.ok ? 'status' : 'alert'} id="chain-status">{c.ok ? t('saChainOk') : t('saChainBad')} <small>{c.rows} {t('saChainRows')}{c.legacy_rows ? ` · ${c.legacy_rows} ${t('saChainLegacy')}` : ''}{c.head ? <> · {t('saChainHead')}: <code>{c.head.slice(0, 16)}…</code></> : null}</small></div>}
      <input type="search" aria-label={t('saSearchAudit')} placeholder={t('saSearchAudit')} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360, marginBottom: 8 }} />
      {shown.length === 0 ? <Empty /> : <div className="tbl"><table><thead><tr><th>{t('saTime')}</th><th>{t('name')}</th><th>{t('actions')}</th><th>#</th></tr></thead>
        <tbody>{shown.map((r) => <tr key={r.id}><td className="small">{fmtDT(r.ts)}</td><td>{r.actor || '—'}</td><td><code>{r.action}</code></td><td className="small">{r.entity || ''} {r.entity_id || ''}</td></tr>)}</tbody></table></div>}
    </div>);
}

function SecuritySettings({ config, reload }) {
  const { t } = useI18n(); const toast = useToast();
  const [v, setV] = useState({ password_min_length: config.settings.password_min_length ?? '10', session_idle_hours: config.settings.session_idle_hours ?? '12', session_absolute_hours: config.settings.session_absolute_hours ?? '14', max_concurrent_sessions: config.settings.max_concurrent_sessions ?? '3',
    rate_search_per_min: config.settings.rate_search_per_min ?? '60', rate_export_per_hour: config.settings.rate_export_per_hour ?? '10', rate_api_per_min: config.settings.rate_api_per_min ?? '1200', export_max_rows: config.settings.export_max_rows ?? '5000',
    alert_failed_logins: config.settings.alert_failed_logins ?? '5', alert_export_rows: config.settings.alert_export_rows ?? '500', alert_search_patients: config.settings.alert_search_patients ?? '60', alert_office_hours: config.settings.alert_office_hours ?? '06:00-23:00' });
  const [err, setErr] = useState(''); const [roles, setRoles] = useState(() => String(config.settings.mfa_required_roles || '').split(',').filter(Boolean));
  const save = async () => { setErr(''); try { await api.patch('/config/settings', { ...v, mfa_required_roles: roles.join(',') }); toast(t('saSaved')); reload(); } catch (e) { setErr(e.message); } };
  const N = ({ k, label, min, max }) => <div className="field"><label htmlFor={`ss-${k}`}>{label}</label><input id={`ss-${k}`} type="number" min={min} max={max} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></div>;
  return (
    <div className="card" style={{ maxWidth: 520 }}><h2>{t('saSettings')}</h2>
      <div className="stack"><N k="password_min_length" label={t('saMinLen')} min={10} max={64} /><N k="session_idle_hours" label={t('saIdleHours')} min={1} max={72} /><N k="session_absolute_hours" label={t('saAbsHours')} min={1} max={72} /><N k="max_concurrent_sessions" label={t('saMaxSessions')} min={0} max={20} />
        <N k="rate_search_per_min" label={t('saRateSearch')} min={0} max={1000} /><N k="rate_export_per_hour" label={t('saRateExport')} min={0} max={1000} /><N k="rate_api_per_min" label={t('saRateApi')} min={0} max={100000} /><N k="export_max_rows" label={t('saExportMax')} min={100} max={100000} />
        <N k="alert_failed_logins" label={t('saAlertFails')} min={2} max={100} /><N k="alert_export_rows" label={t('saAlertRows')} min={10} max={100000} /><N k="alert_search_patients" label={t('saAlertSearch')} min={5} max={10000} />
        <div className="field"><label htmlFor="ss-alert_office_hours">{t('saOffice')}</label><input id="ss-alert_office_hours" value={v.alert_office_hours} onChange={(e) => setV({ ...v, alert_office_hours: e.target.value })} /></div>
        <fieldset className="mrn-box"><legend>{t('saMfaRequiredRoles')}</legend>{['admin', 'supervisor', 'reception', 'clinician'].map((r) => <label key={r} className="chk"><input type="checkbox" checked={roles.includes(r)} onChange={(e) => setRoles(e.target.checked ? [...roles, r] : roles.filter((x) => x !== r))} />{r}</label>)}</fieldset>
        {err && <div className="field-err" role="alert">{err}</div>}<button className="btn" onClick={save}>{t('save')}</button></div></div>);
}

export default function SecurityAccess({ config, reload }) {
  const { t } = useI18n(); const [sub, setSub] = useState('accounts');
  return (
    <>
      <div className="tabs" role="tablist" aria-label={t('saSecurityAccess')}>{SUBS.map(([k, l]) => <button key={k} role="tab" aria-selected={sub === k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{t(l)}</button>)}</div>
      {sub === 'accounts' && <Accounts />}{sub === 'roles' && <Roles />}{sub === 'activity' && <Activity />}{sub === 'access' && <Access />}{sub === 'alerts' && <Alerts />}{sub === 'audit' && <Audit />}{sub === 'readiness' && <Readiness />}{sub === 'recovery' && <Recovery config={config} reload={reload} />}{sub === 'settings' && <SecuritySettings config={config} reload={reload} />}
    </>);
}
