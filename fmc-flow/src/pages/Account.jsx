import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { useToast } from '../ui.jsx';
import logo from '../assets/logo.webp';
import { MfaCard } from './Mfa.jsx';

const fill = (txt, n) => txt.replace('{n}', n);
const devName = (ua) => { const s = String(ua || ''); const b = /Edg\//.test(s) ? 'Edge' : /Chrome\//.test(s) ? 'Chrome' : /Firefox\//.test(s) ? 'Firefox' : /Safari\//.test(s) ? 'Safari' : ''; const o = /Windows/.test(s) ? 'Windows' : /Android/.test(s) ? 'Android' : /iPhone|iPad/.test(s) ? 'iOS' : /Mac OS/.test(s) ? 'macOS' : /Linux/.test(s) ? 'Linux' : ''; return [b, o].filter(Boolean).join(' · ') || s.slice(0, 40) || '—'; };

/** Change-password form (also used for the forced first-sign-in step). Passwords are only ever sent to the server, never stored or shown. */
export function PasswordForm({ minLength = 10, onDone }) {
  const { t } = useI18n(); const toast = useToast();
  const [f, setF] = useState({ cur: '', next: '', again: '' }); const [errs, setErrs] = useState({}); const [busy, setBusy] = useState(false);
  const mismatch = f.again && f.next !== f.again;
  const submit = async () => {
    if (f.next !== f.again) { setErrs({ again: t('saPwMismatch') }); return; }
    setBusy(true); setErrs({});
    try { await api.post('/account/password', { current_password: f.cur, new_password: f.next }); toast(t('saPwSaved')); setF({ cur: '', next: '', again: '' }); onDone?.(); }
    catch (e) { if (e.code === 'VALIDATION') setErrs({ cur: e.details?.fields?.current_password, next: e.details?.fields?.new_password }); else toast(e.code === 'NETWORK' ? t('offline') : e.message, true); }
    finally { setBusy(false); }
  };
  const Field = ({ id, label, k, auto, err }) => (
    <div className="field"><label htmlFor={id}>{label}</label>
      <input id={id} type="password" autoComplete={auto} value={f[k]} aria-invalid={err ? 'true' : undefined} onChange={(e) => setF({ ...f, [k]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && f.cur && f.next && f.again && submit()} />
      {err && <div className="field-err" role="alert">{err}</div>}</div>);
  return (
    <div className="stack">
      <Field id="pw-current" label={t('saCurrentPw')} k="cur" auto="current-password" err={errs.cur} />
      <Field id="pw-new" label={t('saNewPw')} k="next" auto="new-password" err={errs.next} />
      <small className="hint">{fill(t('saPwHint'), minLength)}</small>
      <Field id="pw-confirm" label={t('saConfirmPw')} k="again" auto="new-password" err={errs.again || (mismatch ? t('saPwMismatch') : '')} />
      <button type="button" className="btn" disabled={busy || !f.cur || !f.next || !f.again || mismatch} onClick={submit}>{t('saSavePw')}</button>
    </div>);
}

/** Shown instead of the application until a person who was given a temporary password chooses their own. */
export function ForcedPasswordChange({ user, onDone, onSignOut }) {
  const { t, lang, setLang, loc } = useI18n();
  const acct = usePoll('/account', 0);
  return (
    <div className="login">
      <div className="glass box" style={{ maxWidth: 460 }}>
        <img src={logo} alt="FMC Ideal Care" /><h1>{t('saChangePw')}</h1>
        <p className="small">{loc(user)} · {user.username}</p>
        <div className="banner warn" role="status">{t('saMustChange')}</div>
        <PasswordForm minLength={acct.data?.policy?.min_length || 10} onDone={onDone} />
        <div className="row"><button type="button" className="btn ghost sm" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t('lang')}</button><button type="button" className="btn ghost sm" onClick={onSignOut}>{t('signOut')}</button></div>
      </div>
    </div>);
}

export function ActivityTable({ rows }) {
  const { t, fmtDT } = useI18n();
  return rows.length === 0 ? <p className="muted small">—</p> : (
    <div className="tbl"><table><thead><tr><th>{t('saTime')}</th><th>{t('saEvent')}</th><th>{t('saAddress')}</th><th>{t('saDevice')}</th></tr></thead>
      <tbody>{rows.map((e, i) => <tr key={e.id ?? i}><td className="small">{fmtDT(e.ts)}</td><td>{t(`saEv_${e.event}`)}</td><td className="small">{e.ip || '—'}</td><td className="small">{devName(e.user_agent)}</td></tr>)}</tbody></table></div>);
}

export default function Account({ user }) {
  const { t, loc, fmtDT } = useI18n(); const toast = useToast();
  const acct = usePoll('/account', 15000); const d = acct.data;
  if (!d) return <p className="muted">{t('loading')}</p>;
  const p = d.profile;
  const revokeOthers = async () => { try { await api.post('/account/sessions/revoke-others'); toast(t('saOthersEnded')); acct.reload(); } catch (e) { toast(e.message, true); } };
  const revokeOne = async (sid) => { try { const r = await api.post(`/account/sessions/${sid}/revoke`); if (r.signed_out) location.reload(); else acct.reload(); } catch (e) { toast(e.message, true); } };
  return (
    <>
      <div className="card"><h2>{t('saProfile')}</h2>
        <dl className="tgrid">
          <div><dt>{t('name')}</dt><dd>{loc(p)}</dd></div><div><dt>{t('saUsername')}</dt><dd>{p.username}</dd></div><div><dt>{t('saRole')}</dt><dd>{p.role}</dd></div>
          <div><dt>{t('department')}</dt><dd>{p.department ? loc(p.department) : '—'}</dd></div>
          <div><dt>{t('saLastLogin')}</dt><dd>{p.last_login_at ? fmtDT(p.last_login_at) : t('saNever')}</dd></div><div><dt>{t('saPwChanged')}</dt><dd>{p.password_changed_at ? fmtDT(p.password_changed_at) : t('saNever')}</dd></div>
        </dl></div>
      <MfaCard />
      <div className="card" style={{ maxWidth: 560 }}><h2>{t('saChangePw')}</h2><PasswordForm minLength={d.policy.min_length} onDone={acct.reload} /></div>
      <div className="card"><h2>{t('saSessions')}<button className="btn ghost sm" onClick={revokeOthers} disabled={d.sessions.length < 2}>{t('saSignOutOthers')}</button></h2>
        <div className="tbl"><table><thead><tr><th>{t('saDevice')}</th><th>{t('saAddress')}</th><th>{t('saSignedIn')}</th><th>{t('saLastActive')}</th><th /></tr></thead>
          <tbody>{d.sessions.map((s) => <tr key={s.sid}><td>{s.user_agent ? s.user_agent.slice(0, 60) : '—'}{s.current && <> <span className="chip ok">{t('saThisDevice')}</span></>}</td><td className="small">{s.ip || '—'}</td><td className="small">{fmtDT(s.created_at)}</td><td className="small">{fmtDT(s.last_seen)}</td>
            <td><button className="btn ghost sm" onClick={() => revokeOne(s.sid)}>{t('saSignOutOne')}</button></td></tr>)}</tbody></table></div></div>
      <div className="card"><h2>{t('saActivity')}</h2><ActivityTable rows={d.activity} /></div>
    </>);
}
