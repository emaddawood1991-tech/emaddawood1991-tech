import { useMemo, useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Modal, Empty, useToast } from '../ui.jsx';
import { ActivityTable } from './Account.jsx';

const EVENTS = ['LOGIN_OK', 'LOGIN_FAILED', 'LOGIN_BLOCKED', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED', 'PASSWORD_RESET', 'SESSIONS_REVOKED', 'USERNAME_CHANGED'];
const SUBS = [['accounts', 'saAccounts'], ['roles', 'saRoles'], ['activity', 'saLoginActivity'], ['audit', 'saAuditHistory'], ['settings', 'saSettings']];

function Accounts() {
  const { t, loc, fmtDT } = useI18n(); const toast = useToast();
  const list = usePoll('/security/accounts', 15000); const [modal, setModal] = useState(null); const [val, setVal] = useState(''); const [err, setErr] = useState('');
  const rows = list.data || [];
  const close = () => { setModal(null); setVal(''); setErr(''); };
  const act = async (fn, ok) => { try { await fn(); if (ok) toast(ok); list.reload(); close(); } catch (e) { setErr(e.details?.fields?.temporary_password || e.details?.fields?.username || e.message); } };
  return (
    <div className="card"><h2>{t('saAccounts')}</h2>
      {rows.length === 0 ? <Empty /> : <div className="tbl"><table>
        <thead><tr><th>{t('name')}</th><th>{t('saRole')}</th><th>{t('saLastLogin')}</th><th>{t('saPwChanged')}</th><th>{t('saSessionsCount')}</th><th /></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id} className={u.active ? '' : 'sch-hidden-row'}>
          <td>{loc(u)}<div className="small muted">{u.username}{u.must_change_password ? ` · ${t('saForce')}` : ''}</div></td><td>{u.role}</td>
          <td className="small">{u.last_login_at ? fmtDT(u.last_login_at) : t('saNever')}</td><td className="small">{u.password_changed_at ? fmtDT(u.password_changed_at) : '—'}</td><td>{u.sessions}</td>
          <td><div className="row"><button className="btn ghost sm" onClick={() => setModal({ k: 'reset', u })}>{t('saResetPw')}</button><button className="btn ghost sm" disabled={!u.sessions} onClick={() => act(() => api.post(`/security/users/${u.id}/revoke-sessions`), t('saRevoked'))}>{t('saRevoke')}</button><button className="btn ghost sm" onClick={() => { setVal(u.username); setModal({ k: 'name', u }); }}>{t('saRename')}</button></div></td></tr>)}</tbody></table></div>}
      {modal?.k === 'reset' && <Modal title={`${t('saResetPw')} — ${loc(modal.u)}`} onClose={close}><div className="stack">
        <div className="field"><label htmlFor="sa-temp">{t('saTempPw')}</label><input id="sa-temp" type="password" autoComplete="new-password" autoFocus value={val} onChange={(e) => setVal(e.target.value)} />{err && <div className="field-err" role="alert">{err}</div>}</div>
        <small className="hint">{t('saTempHint')}</small>
        <div className="row"><button className="btn" disabled={!val} onClick={() => act(() => api.post(`/security/users/${modal.u.id}/reset-password`, { temporary_password: val }), t('saDone'))}>{t('saResetPw')}</button><button className="btn ghost" onClick={close}>{t('cancel')}</button></div></div></Modal>}
      {modal?.k === 'name' && <Modal title={`${t('saRename')} — ${loc(modal.u)}`} onClose={close}><div className="stack">
        <div className="field"><label htmlFor="sa-user">{t('saUsername')}</label><input id="sa-user" autoFocus value={val} onChange={(e) => setVal(e.target.value)} />{err && <div className="field-err" role="alert">{err}</div>}</div>
        <div className="row"><button className="btn" disabled={!val} onClick={() => act(() => api.post(`/security/users/${modal.u.id}/username`, { username: val }), t('saSaved'))}>{t('save')}</button><button className="btn ghost" onClick={close}>{t('cancel')}</button></div></div></Modal>}
    </div>);
}

function Roles() {
  const { t } = useI18n(); const r = usePoll('/security/permissions', 0).data;
  if (!r) return <p className="muted">{t('loading')}</p>;
  return (
    <div className="card"><h2>{t('saRoles')}</h2><p className="small muted">{t('saRolesNote')}</p>
      <div className="tbl"><table><thead><tr><th>{t('saPermission')}</th>{r.roles.map((x) => <th key={x}>{x}</th>)}</tr></thead>
        <tbody>{Object.entries(r.permissions).map(([perm, roles]) => <tr key={perm}><td><code>{perm}</code></td>{r.roles.map((x) => <td key={x} style={{ textAlign: 'center' }}>{roles.includes(x) ? '✓' : '—'}</td>)}</tr>)}</tbody></table></div></div>);
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

function Audit() {
  const { t, fmtDT } = useI18n(); const [q, setQ] = useState('');
  const rows = usePoll('/audit?limit=300', 20000).data || [];
  const shown = useMemo(() => { const s = q.trim().toLowerCase(); return s ? rows.filter((r) => `${r.action} ${r.actor || ''} ${r.entity || ''} ${r.entity_id || ''}`.toLowerCase().includes(s)) : rows; }, [rows, q]);
  return (
    <div className="card"><h2>{t('saAuditHistory')}</h2>
      <input type="search" aria-label={t('saSearchAudit')} placeholder={t('saSearchAudit')} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360, marginBottom: 8 }} />
      {shown.length === 0 ? <Empty /> : <div className="tbl"><table><thead><tr><th>{t('saTime')}</th><th>{t('name')}</th><th>{t('actions')}</th><th>#</th></tr></thead>
        <tbody>{shown.map((r) => <tr key={r.id}><td className="small">{fmtDT(r.ts)}</td><td>{r.actor || '—'}</td><td><code>{r.action}</code></td><td className="small">{r.entity || ''} {r.entity_id || ''}</td></tr>)}</tbody></table></div>}
    </div>);
}

function SecuritySettings({ config, reload }) {
  const { t } = useI18n(); const toast = useToast();
  const [v, setV] = useState({ password_min_length: config.settings.password_min_length ?? '10', session_idle_hours: config.settings.session_idle_hours ?? '12', session_absolute_hours: config.settings.session_absolute_hours ?? '14', max_concurrent_sessions: config.settings.max_concurrent_sessions ?? '3' });
  const [err, setErr] = useState('');
  const save = async () => { setErr(''); try { await api.patch('/config/settings', v); toast(t('saSaved')); reload(); } catch (e) { setErr(e.message); } };
  const N = ({ k, label, min, max }) => <div className="field"><label htmlFor={`ss-${k}`}>{label}</label><input id={`ss-${k}`} type="number" min={min} max={max} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></div>;
  return (
    <div className="card" style={{ maxWidth: 520 }}><h2>{t('saSettings')}</h2>
      <div className="stack"><N k="password_min_length" label={t('saMinLen')} min={10} max={64} /><N k="session_idle_hours" label={t('saIdleHours')} min={1} max={72} /><N k="session_absolute_hours" label={t('saAbsHours')} min={1} max={72} /><N k="max_concurrent_sessions" label={t('saMaxSessions')} min={0} max={20} />
        {err && <div className="field-err" role="alert">{err}</div>}<button className="btn" onClick={save}>{t('save')}</button></div></div>);
}

export default function SecurityAccess({ config, reload }) {
  const { t } = useI18n(); const [sub, setSub] = useState('accounts');
  return (
    <>
      <div className="tabs" role="tablist" aria-label={t('saSecurityAccess')}>{SUBS.map(([k, l]) => <button key={k} role="tab" aria-selected={sub === k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{t(l)}</button>)}</div>
      {sub === 'accounts' && <Accounts />}{sub === 'roles' && <Roles />}{sub === 'activity' && <Activity />}{sub === 'audit' && <Audit />}{sub === 'settings' && <SecuritySettings config={config} reload={reload} />}
    </>);
}
