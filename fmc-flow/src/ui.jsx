import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from './i18n.jsx';
import { useNet } from './api.js';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, bad = false) => { setToast({ msg, bad, id: Date.now() }); setTimeout(() => setToast((x) => (x && Date.now() - x.id >= 3900 ? null : x)), 4000); }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <AnimatePresence>{toast && <motion.div key={toast.id} className={`toast ${toast.bad ? 'bad' : ''}`} role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{toast.msg}</motion.div>}</AnimatePresence>
    </ToastCtx.Provider>
  );
}

/** Wrap an async action: shows server errors clearly, blocks while offline, never invents data. */
export function useAction() {
  const toast = useToast(); const { t } = useI18n(); const net = useNet();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, ok) => {
    if (net.offline) { toast(t('offline'), true); return null; }
    setBusy(true);
    try { const r = await fn(); if (ok) toast(ok); return r ?? true; }
    catch (e) { toast(e.code === 'NETWORK' ? t('offline') : (e.message || 'Error'), true); return null; }
    finally { setBusy(false); }
  }, [net.offline, toast, t]);
  return { run, busy, offline: net.offline };
}

export function Modal({ title, onClose, children, wide }) {
  const { t } = useI18n();
  // Portal: a fixed overlay inside a backdrop-filter card would be positioned and clipped by that card.
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <motion.div className={`glass modal ${wide ? 'wide' : ''}`} initial={{ opacity: 0, scale: .96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label={t('close')}>✕</button>
        </div>
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}

const TONE = { AVAILABLE: 'ok', OCCUPIED: '', CLEANING: 'warn', MAINTENANCE: 'bad', OUT_OF_SERVICE: 'bad', BUSY: 'warn', ON_BREAK: 'mute', OFF_DUTY: 'mute', UNAVAILABLE: 'bad',
  WAITING: 'warn', CALLED: '', IN_ROOM: '', DONE: 'mute', ACTIVE: 'ok', PAUSED: 'warn', COMPLETED: 'mute', OPEN: 'ok', CHECKED_OUT: 'mute', PENDING: 'warn', APPROVED: 'ok', REJECTED: 'bad' };
export function Chip({ s, label }) {
  const { t } = useI18n();
  return <span className={`chip ${TONE[s] ?? ''}`}>{label ?? t(s)}</span>;
}
export const Empty = () => { const { t } = useI18n(); return <p className="muted">{t('noData')}</p>; };

const P = { dashboard: 'M3 12l9-9 9 9M5 10v10h14V10', visits: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0', queue: 'M4 6h16M4 12h16M4 18h10', rooms: 'M3 21V5a2 2 0 012-2h9a2 2 0 012 2v16M3 21h18M16 9h3a2 2 0 012 2v10M8 9h4M8 13h4',
  dailyschedule: 'M3 4h18v16H3zM3 10h18M9 4v16M15 4v16',
  treatmentboard: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  sessions: 'M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z', corrections: 'M4 20h4L19 9l-4-4L4 16v4z', search: 'M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z', reports: 'M5 21V10M12 21V3M19 21v-7', settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2 1-2 3-2-1a7 7 0 01-2 1l-.5 2h-3L11 16a7 7 0 01-2-1l-2 1-2-3 2-1a7 7 0 010-2L5 9l2-3 2 1a7 7 0 012-1l.5-2h3L15 6a7 7 0 012 1l2-1 2 3-2 1a7 7 0 010 2z', system: 'M4 4h16v12H4zM8 20h8M12 16v4' };
export const Icon = ({ n }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>;
