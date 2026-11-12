import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Modal, useToast } from '../ui.jsx';
import logo from '../assets/logo.webp';
import { MfaCard } from './Mfa.jsx';

const fill = (txt, n) => txt.replace('{n}', n);
const devName = (ua) => { const s = String(ua || ''); const b = /Edg\//.test(s) ? 'Edge' : /Chrome\//.test(s) ? 'Chrome' : /Firefox\//.test(s) ? 'Firefox' : /Safari\//.test(s) ? 'Safari' : ''; const o = /Windows/.test(s) ? 'Windows' : /Android/.test(s) ? 'Android' : /iPhone|iPad/.test(s) ? 'iOS' : /Mac OS/.test(s) ? 'macOS' : /Linux/.test(s) ? 'Linux' : ''; return [b, o].filter(Boolean).join(' · ') || s.slice(0, 40) || '—'; };

/** One password input. Defined at module level on purpose: a component created inside another component is rebuilt on every keystroke and the field loses focus after each letter. */
function PwField({ id, label, value, onChange, onEnter, auto, err }) {
  return (
    <div className="field"><label htmlFor={id}>{label}</label>
      <input id={id} type="password" autoComplete={auto} value={value} aria-invalid={err ? 'true' : undefined} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onEnter()} />
      {err && <div className="field-err" role="alert">{err}</div>}</div>);
}

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
  const enter = () => { if (f.cur && f.next && f.again) submit(); };
  return (
    <div className="stack">
      <PwField id="pw-current" label={t('saCurrentPw')} value={f.cur} onChange={(v) => setF((c) => ({ ...c, cur: v }))} onEnter={enter} auto="current-password" err={errs.cur} />
      <PwField id="pw-new" label={t('saNewPw')} value={f.next} onChange={(v) => setF((c) => ({ ...c, next: v }))} onEnter={enter} auto="new-password" err={errs.next} />
      <small className="hint">{fill(t('saPwHint'), minLength)}</small>
      <PwField id="pw-confirm" label={t('saConfirmPw')} value={f.again} onChange={(v) => setF((c) => ({ ...c, again: v }))} onEnter={enter} auto="new-password" err={errs.again || (mismatch ? t('saPwMismatch') : '')} />
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

/** Read-only emergency access (break-glass) to one patient outside the person's department. Visible only when an administrator has switched it on. */
function EmergencyCard({ user }) {
  const { t, fmtDT } = useI18n(); const toast = useToast();
  const mine = usePoll('/break-glass/mine', 30000); const d = mine.data;
  const [f, setF] = useState({ mrn: '', reason: '' }); const [errs, setErrs] = useState({}); const [view, setView] = useState(null); const [detail, setDetail] = useState(null);
  if (!d || !d.enabled || !d.scoped) return null;
  const open = async () => { setErrs({}); try { const r = await api.post('/break-glass', f); setView({ grant: r.grant, visits: r.visits }); setF({ mrn: '', reason: '' }); mine.reload(); } catch (e) { setErrs(e.details?.fields || {}); toast(e.message, true); } };
  const resume = async (g) => { try { const r = await api.get(`/break-glass/${g.id}/visits`); setView({ grant: g, visits: r.visits }); } catch (e) { toast(e.message, true); } };
  const end = async (g) => { try { await api.post(`/break-glass/${g.id}/end`); setView(null); setDetail(null); mine.reload(); } catch (e) { toast(e.message, true); } };
  const show = async (kind, id) => { try { setDetail({ kind, id, data: await api.get(kind === 'visit' ? `/visits/${id}/timeline` : `/sessions/${id}/documentation`) }); } catch (e) { toast(e.message, true); } };
  return (
    <div className="card" data-testid="emergency-card"><h2>{t('saEmergency')}</h2><p className="small muted">{t('saEmergencyNote')}</p>
      <div className="form-grid">
        <div className="field"><label htmlFor="bg-mrn">{t('saEmrExact')}</label><input id="bg-mrn" value={f.mrn} onChange={(e) => setF({ ...f, mrn: e.target.value })} aria-invalid={errs.mrn ? 'true' : undefined} />{errs.mrn && <div className="field-err" role="alert">{errs.mrn}</div>}</div>
        <div className="field"><label htmlFor="bg-reason">{t('saBgReason')}</label><input id="bg-reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} aria-invalid={errs.reason ? 'true' : undefined} />{errs.reason && <div className="field-err" role="alert">{errs.reason}</div>}</div></div>
      <button type="button" className="btn" disabled={!f.mrn || f.reason.trim().length < 15} onClick={open}>{t('saEmergencyOpen')}</button>
      {d.grants.filter((g) => g.active).length > 0 && <div className="tbl" style={{ marginTop: 10 }}><table><tbody>{d.grants.filter((g) => g.active).map((g) => <tr key={g.id}><td><code>{g.mrn}</code></td><td className="small">{t('saExpires')} {fmtDT(g.expires_at)}</td><td><div className="row"><button className="btn ghost sm" onClick={() => resume(g)}>{t('saResume')}</button><button className="btn ghost sm" onClick={() => end(g)}>{t('saEndAccess')}</button></div></td></tr>)}</tbody></table></div>}
      {view && <div className="banner warn" role="status" data-testid="emergency-view" style={{ marginTop: 10 }}>{t('saReadOnly')} · {t('saExpires')} {fmtDT(view.grant.expires_at)}
        {view.visits.length === 0 ? <p className="small">—</p> : view.visits.map((v) => <div key={v.id} className="small" style={{ marginTop: 6 }}><b>#{v.id}</b> {fmtDT(v.arrived_at)} · {v.status} <button className="btn ghost sm" onClick={() => show('visit', v.id)}>{t('saTimeline')}</button>
          {v.sessions.map((x) => <button key={x.id} className="btn ghost sm" onClick={() => show('session', x.id)}>{x.service}</button>)}</div>)}</div>}
      {detail && <Modal title={detail.kind === 'visit' ? t('saTimeline') : t('saDocumentation')} onClose={() => setDetail(null)}>
        {detail.kind === 'visit' ? <div className="tbl"><table data-testid="emergency-detail"><tbody>{detail.data.events.map((e) => <tr key={e.id}><td className="small">{fmtDT(e.ts)}</td><td>{e.type}</td><td className="small">{e.actor || ''}</td></tr>)}</tbody></table></div>
          : <pre data-testid="emergency-detail" className="small" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(detail.data.content ?? detail.data.status, null, 2)}</pre>}</Modal>}
    </div>);
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
      {(user?.role === 'clinician' || user?.role === 'supervisor') && <EmergencyCard user={user} />}
      <div className="card" style={{ maxWidth: 560 }}><h2>{t('saChangePw')}</h2><PasswordForm minLength={d.policy.min_length} onDone={acct.reload} /></div>
      <div className="card"><h2>{t('saSessions')}<button className="btn ghost sm" onClick={revokeOthers} disabled={d.sessions.length < 2}>{t('saSignOutOthers')}</button></h2>
        <div className="tbl"><table><thead><tr><th>{t('saDevice')}</th><th>{t('saAddress')}</th><th>{t('saSignedIn')}</th><th>{t('saLastActive')}</th><th /></tr></thead>
          <tbody>{d.sessions.map((s) => <tr key={s.sid}><td>{s.user_agent ? devName(s.user_agent) : '—'}{s.current && <> <span className="chip ok">{t('saThisDevice')}</span></>}</td><td className="small">{s.ip || '—'}</td><td className="small">{fmtDT(s.created_at)}</td><td className="small">{fmtDT(s.last_seen)}</td>
            <td><button className="btn ghost sm" onClick={() => revokeOne(s.sid)}>{t('saSignOutOne')}</button></td></tr>)}</tbody></table></div></div>
      <div className="card"><h2>{t('saActivity')}</h2><ActivityTable rows={d.activity} /></div>
    </>);
}
