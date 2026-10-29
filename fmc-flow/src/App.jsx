import { useEffect, useState } from 'react';
import { api, useNet, usePoll, useTicker, serverNow } from './api.js';
import { useI18n } from './i18n.jsx';
import { Icon, useAction } from './ui.jsx';
import logo from './assets/logo.webp';
import Dashboard from './pages/Dashboard.jsx';
import Visits from './pages/Visits.jsx';
import Queue from './pages/Queue.jsx';
import Rooms from './pages/Rooms.jsx';
import Sessions from './pages/Sessions.jsx';
import TreatmentBoard from './pages/TreatmentBoard.jsx';
import DailySchedule from './pages/DailySchedule.jsx';
import Corrections from './pages/Corrections.jsx';
import Search from './pages/Search.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import System from './pages/System.jsx';

const ALL = ['admin', 'supervisor', 'reception', 'clinician'];
const PAGES = [
  ['dashboard', Dashboard, ALL], ['visits', Visits, ALL], ['queue', Queue, ALL], ['dailyschedule', DailySchedule, ALL], ['rooms', Rooms, ALL], ['sessions', Sessions, ['admin', 'supervisor', 'clinician']], ['treatmentboard', TreatmentBoard, ALL],
  ['corrections', Corrections, ALL], ['search', Search, ALL], ['reports', Reports, ['admin', 'supervisor']], ['settings', Settings, ['admin']], ['system', System, ['admin', 'supervisor']],
];

function Login({ onDone }) {
  const { t, lang, setLang } = useI18n();
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { const r = await api.post('/login', f); onDone(r.user); } catch (x) { setErr(x.code === 'NETWORK' ? t('offline') : x.message); }
  };
  return (
    <div className="login">
      <div className="glass box" role="form" onKeyDown={(e) => e.key === 'Enter' && f.username && f.password && submit(e)}>
        <img src={logo} alt="FMC Ideal Care" />
        <h1>{t('appName')}</h1>
        <label>{t('username')}<input autoFocus autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></label>
        <label>{t('password')}<input type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <div className="err" role="alert">{err}</div>}
        <button type="button" className="btn" disabled={!f.username || !f.password} onClick={submit}>{t('signIn')}</button>
        <button type="button" className="btn ghost sm" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t('lang')}</button>
        <small className="muted">{t('demoNote')}</small>
        {window.__FMC_DEMO__ && <button type="button" className="btn ghost sm" onClick={() => window.__resetDemo()}>Reset demo data</button>}
      </div>
    </div>
  );
}

function Clock() {
  const { fmt } = useI18n(); useTicker(1000);
  return <span className="clock" title="server time">{fmt(new Date(serverNow()).toISOString())}</span>;
}

export default function App() {
  const { t, lang, setLang, loc } = useI18n();
  const net = useNet();
  const [user, setUser] = useState(undefined);
  const [page, setPage] = useState(() => { try { return location.hash.slice(2) || 'dashboard'; } catch { return 'dashboard'; } });
  const [staffTick, setStaffTick] = useState(0);
  const { run } = useAction();
  useEffect(() => { api.get('/me').then((r) => { window.__tz = r.timezone; setUser(r.user); }).catch((e) => setUser(e.status === 401 ? null : undefined)); }, []);
  useEffect(() => { const on = () => setPage(location.hash.slice(2) || 'dashboard'); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  const staff = usePoll('/staff', 8000, !!user);
  if (user === undefined) return <div className="login"><p className="muted">{net.offline ? t('offline') : t('loading')}</p></div>;
  if (!user) return <Login onDone={(u) => setUser(u)} />;
  const mine = staff.data?.find((s) => s.id === user.id);
  const allowed = PAGES.filter(([, , roles]) => roles.includes(user.role));
  const [, Page] = allowed.find(([k]) => k === page) || allowed[0];
  const go = (k) => { setPage(k); try { location.hash = `/${k}`; } catch { /* hash unavailable in sandboxed frames; state already updated */ } };
  const signOut = async () => { await run(() => api.post('/logout')); setUser(null); };
  return (
    <div className="shell">
      <aside className="glass side">
        <div className="brand"><img src={logo} alt="" /><div><b>{t('appName')}</b><small>{t('tagline')}</small></div></div>
        <nav className="nav" aria-label="Main">
          {allowed.map(([k]) => <a key={k} className={(page || 'dashboard') === k ? 'on' : ''} onClick={() => go(k)} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && go(k)}><Icon n={k} />{t(k)}</a>)}
        </nav>
        <div className="foot">
          <label>{t('myStatus')}
            <select value={mine?.availability || 'OFF_DUTY'} onChange={async (e) => { await run(() => api.put(`/staff/${user.id}/availability`, { status: e.target.value })); staff.reload(); setStaffTick(staffTick + 1); }}>
              {['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFF_DUTY', 'UNAVAILABLE'].map((s) => <option key={s} value={s}>{t(s)}</option>)}
            </select>
          </label>
          <div className="small muted">{loc(user)} · {user.role}</div>
          <div className="row"><button className="btn ghost sm" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t('lang')}</button><button className="btn ghost sm" onClick={signOut}>{t('signOut')}</button></div>
        </div>
      </aside>
      <main className="main">
        <div className="glass top"><h1>{t(allowed.find(([k]) => k === page) ? page : 'dashboard')}</h1><span className="sp" />{window.__FMC_DEMO__ && <span className="chip warn">DEMO</span>}<span className="chip ok">{t('serverTime')}</span><Clock /></div>
        {net.offline && <div className="banner bad" role="alert">{t('offline')} {net.lastSync && <small>({t('stale')}: {new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', { timeStyle: 'medium' }).format(net.lastSync)})</small>}</div>}
        <Page user={user} staff={staff.data || []} reloadStaff={staff.reload} go={go} />
      </main>
    </div>
  );
}
