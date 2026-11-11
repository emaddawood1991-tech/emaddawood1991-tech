import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Modal, useToast } from '../ui.jsx';
import logo from '../assets/logo.webp';

const groups4 = (s) => String(s || '').replace(/(.{4})/g, '$1 ').trim();

/** Enrol an authenticator app: QR code → confirm a code → save recovery codes. Used for the required first set-up and for voluntary set-up. */
export function MfaEnrol({ onDone }) {
  const { t } = useI18n(); const toast = useToast();
  const [setup, setSetup] = useState(null); const [code, setCode] = useState(''); const [err, setErr] = useState(''); const [codes, setCodes] = useState(null); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);
  const started = useRef(false);
  useEffect(() => { if (started.current) return; started.current = true; api.post('/mfa/setup').then(setSetup).catch((e) => setErr(e.message)); }, []);
  const confirm = async () => { setBusy(true); setErr(''); try { const r = await api.post('/mfa/confirm', { code }); setCodes(r.recovery_codes); } catch (e) { setErr(e.details?.fields?.code || e.message); } finally { setBusy(false); } };
  const text = () => (codes || []).join('\n');
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`FMC Patient Flow recovery codes\n\n${text()}\n`], { type: 'text/plain' })); a.download = 'fmc-recovery-codes.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const copy = async () => { try { await navigator.clipboard.writeText(text()); toast(t('mfaCopy')); } catch { /* clipboard unavailable */ } };
  if (codes) return (
    <div className="stack"><h3 style={{ margin: 0 }}>{t('mfaCodes')}</h3><p className="small">{t('mfaCodesHelp')}</p>
      <ul className="sch-history" style={{ columns: 2, listStyle: 'none', padding: 0, fontFamily: 'monospace', fontSize: '1rem' }}>{codes.map((c) => <li key={c}>{c}</li>)}</ul>
      <div className="row"><button className="btn ghost sm" onClick={download}>{t('mfaDownload')}</button><button className="btn ghost sm" onClick={copy}>{t('mfaCopy')}</button></div>
      <label className="chk"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />{t('mfaSaved')}</label>
      <button className="btn" disabled={!saved} onClick={onDone}>{t('mfaDone')}</button></div>);
  return (
    <div className="stack">
      <p className="small">{t('mfaIntro')}</p>
      {!setup ? (err ? <div className="field-err" role="alert">{err}</div> : <p className="muted">{t('loading')}</p>) : <>
        <b>{t('mfaStep1')}</b>
        <div style={{ background: '#fff', padding: 8, borderRadius: 12, width: 236, margin: '0 auto' }}><img alt="QR code" width={220} height={220} src={`data:image/svg+xml;utf8,${encodeURIComponent(setup.qr_svg)}`} /></div>
        <details><summary className="small">{t('mfaCantScan')}</summary><code id="mfa-secret" dir="ltr" style={{ display: 'block', wordBreak: 'break-all', padding: 6 }}>{groups4(setup.secret)}</code></details>
        <b>{t('mfaStep2')}</b>
        <div className="field"><label htmlFor="mfa-confirm-code">{t('mfaCode')}</label><input id="mfa-confirm-code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && code && confirm()} />{err && <div className="field-err" role="alert">{err}</div>}</div>
        <button className="btn" disabled={busy || code.replace(/\s/g, '').length < 6} onClick={confirm}>{t('mfaConfirm')}</button></>}
    </div>);
}

/** Replaces the application until a person whose role requires two-step verification has set it up. */
export function ForcedMfaSetup({ user, onDone, onSignOut }) {
  const { t, lang, setLang, loc } = useI18n();
  return (
    <div className="login"><div className="glass box" style={{ maxWidth: 480 }}>
      <img src={logo} alt="FMC Ideal Care" /><h1>{t('mfaTitle')}</h1><p className="small">{loc(user)} · {user.username}</p>
      <div className="banner warn" role="status">{t('mfaSetupForced')}</div>
      <MfaEnrol onDone={onDone} />
      <div className="row"><button type="button" className="btn ghost sm" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t('lang')}</button><button type="button" className="btn ghost sm" onClick={onSignOut}>{t('signOut')}</button></div>
    </div></div>);
}

/** Second step of sign-in. */
export function MfaChallenge({ token, onDone, onBack }) {
  const { t } = useI18n(); const [recovery, setRecovery] = useState(false); const [v, setV] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); setErr(''); try { const r = await api.post('/login/mfa', { mfa_token: token, ...(recovery ? { recovery_code: v } : { code: v }) }); onDone(r.user); } catch (e) { setErr(e.message); if (e.code === 'MFA_CHALLENGE_EXPIRED') setTimeout(onBack, 1500); } finally { setBusy(false); } };
  return (
    <div className="stack">
      <p className="small">{recovery ? t('mfaRecovery') : t('mfaSignInCode')}</p>
      <div className="field"><label htmlFor="mfa-code">{recovery ? t('mfaRecovery') : t('mfaCode')}</label>
        <input id="mfa-code" autoFocus inputMode={recovery ? 'text' : 'numeric'} autoComplete="one-time-code" maxLength={recovery ? 16 : 7} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && v && go()} />
        {err && <div className="field-err" role="alert">{err}</div>}</div>
      <button type="button" className="btn" disabled={busy || !v} onClick={go}>{t('mfaVerify')}</button>
      <button type="button" className="btn ghost sm" onClick={() => { setRecovery(!recovery); setV(''); setErr(''); }}>{recovery ? t('mfaUseApp') : t('mfaUseRecovery')}</button>
      <button type="button" className="btn ghost sm" onClick={onBack}>{t('cancel')}</button>
    </div>);
}

/** My Account card: status, turn on/off, renew recovery codes. */
export function MfaCard() {
  const { t } = useI18n(); const toast = useToast();
  const [st, setSt] = useState(null); const [modal, setModal] = useState(null); const [f, setF] = useState({ password: '', code: '' }); const [err, setErr] = useState(''); const [codes, setCodes] = useState(null);
  const load = () => api.get('/mfa/status').then(setSt).catch(() => setSt({ available: false }));
  useEffect(() => { load(); }, []);
  if (!st) return null;
  if (!st.available) return <div className="card"><h2>{t('mfaTitle')}</h2><p className="muted small">{t('mfaNotAvail')}</p></div>;
  const close = () => { setModal(null); setF({ password: '', code: '' }); setErr(''); setCodes(null); load(); };
  const disable = async () => { try { await api.post('/mfa/disable', f); toast(t('mfaOff')); close(); } catch (e) { setErr(e.details?.fields?.password || e.message); } };
  const regen = async () => { try { const r = await api.post('/mfa/recovery-codes', { code: f.code }); setCodes(r.recovery_codes); } catch (e) { setErr(e.details?.fields?.code || e.message); } };
  return (
    <div className="card"><h2>{t('mfaTitle')}</h2>
      <dl className="tgrid"><div><dt>{t('mfaStatus')}</dt><dd><span className={`chip ${st.enabled ? 'ok' : 'warn'}`}>{st.enabled ? t('mfaOn') : t('mfaOff')}</span></dd></div>{st.enabled && <div><dt>{t('mfaRemaining')}</dt><dd>{st.recovery_codes_remaining}</dd></div>}</dl>
      <div className="row">
        {!st.enabled && <button className="btn" onClick={() => setModal('enrol')}>{t('mfaEnable')}</button>}
        {st.enabled && <button className="btn ghost sm" onClick={() => setModal('regen')}>{t('mfaRegen')}</button>}
        {st.enabled && !st.required && <button className="btn ghost sm" onClick={() => setModal('disable')}>{t('mfaDisable')}</button>}
      </div>
      {st.enabled && st.required && <p className="small muted">{t('mfaRequired')}</p>}
      {modal === 'enrol' && <Modal title={t('mfaTitle')} onClose={close}><MfaEnrol onDone={close} /></Modal>}
      {modal === 'disable' && <Modal title={t('mfaDisable')} onClose={close}><div className="stack">
        <div className="field"><label htmlFor="mfa-pw">{t('mfaDisablePw')}</label><input id="mfa-pw" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <div className="field"><label htmlFor="mfa-dis-code">{t('mfaEnterCode')}</label><input id="mfa-dis-code" inputMode="numeric" autoComplete="one-time-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />{err && <div className="field-err" role="alert">{err}</div>}</div>
        <div className="row"><button className="btn red" disabled={!f.password || !f.code} onClick={disable}>{t('mfaDisable')}</button><button className="btn ghost" onClick={close}>{t('cancel')}</button></div></div></Modal>}
      {modal === 'regen' && <Modal title={t('mfaRegen')} onClose={close}>{codes ? (
        <div className="stack"><p className="small">{t('mfaCodesHelp')}</p><ul style={{ columns: 2, listStyle: 'none', padding: 0, fontFamily: 'monospace' }}>{codes.map((c) => <li key={c}>{c}</li>)}</ul><button className="btn" onClick={close}>{t('mfaDone')}</button></div>
      ) : (
        <div className="stack"><div className="field"><label htmlFor="mfa-regen-code">{t('mfaEnterCode')}</label><input id="mfa-regen-code" inputMode="numeric" autoComplete="one-time-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />{err && <div className="field-err" role="alert">{err}</div>}</div>
          <button className="btn" disabled={!f.code} onClick={regen}>{t('mfaRegen')}</button></div>)}</Modal>}
    </div>);
}
