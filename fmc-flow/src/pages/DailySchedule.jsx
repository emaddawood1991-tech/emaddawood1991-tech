import { Fragment, useMemo, useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Empty, useToast } from '../ui.jsx';
import { AddColumnModal, AddRowModal, AppointmentModal, BlockDetailsModal, BlockModal, DetailsModal, LayoutModal, ListItemModal, SetupModal } from './ScheduleModals.jsx';

const addDays = (d, n) => { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); };
const mins = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const TABS = [['WAITING', 'dsWaiting'], ['CANCELLATIONS', 'dsCancellations'], ['FOLLOW_UP', 'dsFollowUp'], ['APPROVAL', 'dsApproval'], ['REJECTION', 'dsRejection'], ['FOR_DOCTOR', 'dsForDoctor'], ['EVALUATION', 'dsEvaluationList']];

function Chip({ a, dim, hit, onOpen }) {
  const { t, loc } = useI18n();
  return (
    <button type="button" className={`sch-appt st-${a.status.toLowerCase()} ${dim ? 'dim' : ''} ${hit ? 'hit' : ''}`} style={{ background: a.category_color || '#e4ebf7' }}
      onClick={(e) => { e.stopPropagation(); onOpen(a); }} aria-label={`${loc(a, 'patient_name') || a.patient_name}, ${a.mrn}, ${a.start_local}, ${t(`dsStatus_${a.status}`)}`}>
      <b className="nm">{loc(a, 'patient_name') || a.patient_name}</b> <span className="mrn">{a.mrn}</span>
      <span className="meta">{a.category ? loc(a, 'category') : ''}{a.category ? ' · ' : ''}{t(`dsStatus_${a.status}`)}</span>
      <span className="meta">{a.start_local}–{a.end_local}{a.recurrence_id ? ' ↻' : ''}</span>
    </button>);
}

function Group({ g, board, q, onSlot, onOpen, onBlock, canBook }) {
  const { t, loc, lang } = useI18n();
  const cols = g.columns;
  const slotOf = (r, i) => {
    const lo = i === 0 ? 0 : mins(cols[i].time); const hi = i + 1 < cols.length ? mins(cols[i + 1].time) : 24 * 60;
    return { appts: r.appointments.filter((a) => { const m = mins(a.start_local); return m >= lo && m < hi; }), blocks: r.blocks.filter((b) => mins(b.start_local) < hi && mins(b.end_local) > (i === 0 ? 0 : mins(cols[i].time))) };
  };
  if (!cols.length) return <div className="card"><h2>{loc(g)}</h2><Empty /></div>;
  return (
    <div className="card sch-card"><h2>{loc(g)} <small className="muted">· {g.interval_minutes} {t('minShort')}{!g.active ? ` · ${t('dsHidden')}` : ''}</small></h2>
      <div className="sch-wrap" tabIndex={0} aria-label={loc(g)}>
        <table className="sch">
          <thead><tr><th className="sch-corner">{loc(g)}</th>{cols.map((c) => <th key={c.id} scope="col" className={`sch-time ${c.active ? '' : 'sch-hidden-row'}`}>{c.label || c.time}{c.label && <small>{c.time}</small>}</th>)}</tr></thead>
          <tbody>{g.rows.map((r) => (
            <tr key={r.id} className={r.active ? '' : 'sch-hidden-row'}>
              <th scope="row" className="sch-staff">{(lang === 'ar' && r.label_ar) || r.label || (lang === 'ar' && r.staff_name_ar) || r.staff_name}{r.capacity > 1 && <small>×{r.capacity}</small>}</th>
              {cols.map((c, i) => {
                const { appts, blocks } = slotOf(r, i); const blocked = blocks[0];
                return (
                  <td key={c.id} className={`sch-cell ${blocked ? 'blocked' : ''} ${appts.length ? 'has' : ''}`} onClick={() => canBook && onSlot(r, c)}>
                    {blocked && <span className="sch-block" title={blocked.note}>{t(`dsBlock_${blocked.kind}`)}{blocked.note ? ` · ${blocked.note}` : ''}{board.me.can_block && <button type="button" className="sch-x" aria-label={t('dsRemoveBlock')} onClick={(e) => { e.stopPropagation(); onBlock(blocked); }}>✕</button>}</span>}
                    {appts.map((a) => <Chip key={a.id} a={a} onOpen={onOpen} dim={!!q && !`${a.patient_name} ${a.patient_name_ar} ${a.mrn} ${a.phone}`.toLowerCase().includes(q)} hit={!!q && `${a.patient_name} ${a.patient_name_ar} ${a.mrn} ${a.phone}`.toLowerCase().includes(q)} />)}
                    {canBook && appts.length > 0 && <button type="button" className="sch-plus" aria-label={t('dsAddAppt')} onClick={(e) => { e.stopPropagation(); onSlot(r, c); }}>＋</button>}
                  </td>);
              })}
            </tr>))}</tbody>
        </table>
      </div>
    </div>);
}

function Lists({ board, config, staff, onBook, canManage, version }) {
  const { t, loc, fmt } = useI18n(); const toast = useToast();
  const [tab, setTab] = useState('WAITING'); const [add, setAdd] = useState(false);
  const path = tab === 'WAITING' ? '/schedule/waiting' : tab === 'CANCELLATIONS' ? '/schedule/cancellations' : `/schedule/tasks?kind=${tab}`;
  const list = usePoll(`${path}${path.includes('?') ? '&' : '?'}v=${version}`, 10000); // version bumps after a booking so the lists refresh at once
  const rows = list.data || [];
  const patch = async (url, body) => { try { await api.patch(url, body); list.reload(); } catch (e) { toast(e.message, true); } };
  return (
    <div className="card"><h2>{t('dailyschedule')} — {t(TABS.find(([k]) => k === tab)[1])}{canManage && tab !== 'CANCELLATIONS' && <button className="btn sm" onClick={() => setAdd(true)}>＋ {tab === 'WAITING' ? t('dsAddWaiting') : t('dsAddTask')}</button>}</h2>
      <div className="tabs" role="tablist">{TABS.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(label)}</button>)}</div>
      {rows.length === 0 ? <Empty /> : <div className="tbl"><table>
        {tab === 'WAITING' && <><thead><tr><th>{t('patient')}</th><th>{t('department')}</th><th>{t('dsPrefClinician')}</th><th>{t('dsPrefDate')}</th><th>{t('dsContact')}</th><th>{t('dsNotes')}</th><th /></tr></thead>
          <tbody>{rows.map((w) => <tr key={w.id}><td><b>{loc(w, 'patient_name') || w.patient_name}</b><div className="small muted">{w.mrn}{w.phone ? ` · ${w.phone}` : ''}</div></td><td>{w.department}</td><td>{w.clinician || '—'}</td><td>{w.preferred_date || '—'} {w.preferred_time || ''}</td>
            <td><select aria-label={t('dsContact')} value={w.contact_status} disabled={!canManage} onChange={(e) => patch(`/schedule/waiting/${w.id}`, { contact_status: e.target.value })}>{['NOT_CONTACTED', 'CONTACTED', 'NO_ANSWER', 'WILL_CALL_BACK', 'CONFIRMED'].map((c) => <option key={c} value={c}>{t(`dsContact_${c}`)}</option>)}</select></td><td className="small">{w.notes}</td>
            <td>{canManage && <div className="row"><button className="btn sm" onClick={() => onBook({ patient: { id: w.patient_id, name: w.patient_name, name_ar: w.patient_name_ar, mrn: w.mrn, phone: w.phone }, department_id: w.department_id, clinician_id: w.clinician_id, date: w.preferred_date || board.date, time: w.preferred_time || '', waiting_id: w.id })}>{t('dsBook')}</button>
              <button className="btn ghost sm" onClick={() => patch(`/schedule/waiting/${w.id}`, { status: 'REMOVED' })}>{t('dsRemove')}</button></div>}</td></tr>)}</tbody></>}
        {tab === 'CANCELLATIONS' && <><thead><tr><th>{t('patient')}</th><th>{t('dsOriginal')}</th><th>{t('dsReason')}</th><th>{t('dsCancelledAt')}</th><th>{t('dsBy')}</th><th>{t('dsResched')}</th><th /></tr></thead>
          <tbody>{rows.map((a) => <tr key={a.id}><td><b>{loc(a, 'patient_name') || a.patient_name}</b><div className="small muted">{a.mrn}</div></td><td>{a.date} {a.start_local}<div className="small muted">{a.clinician || ''}</div></td><td>{a.cancel_reason}</td>
            <td className="small">{fmt(a.cancelled_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>{a.cancelled_by_name || '—'}</td><td>{t(`dsResched_${a.reschedule_status}`)}{a.rebooked_ref ? ` · ${a.rebooked_ref}` : ''}</td>
            <td>{canManage && a.reschedule_status === 'PENDING' && <button className="btn sm" onClick={() => onBook({ patient: { id: a.patient_id, name: a.patient_name, name_ar: a.patient_name_ar, mrn: a.mrn, phone: a.phone }, department_id: a.department_id, service_id: a.service_id, clinician_id: a.clinician_id, category_id: a.category_id, duration_minutes: a.duration_minutes, row_id: a.row_id, date: board.date, time: '', rebooks_id: a.id })}>{t('dsRebook')}</button>}</td></tr>)}</tbody></>}
        {!['WAITING', 'CANCELLATIONS'].includes(tab) && <><thead><tr><th>{t('patient')}</th><th>{t('dsNotes')}</th><th>{t('dsAssignee')}</th><th>{t('dsDue')}</th><th>{t('status')}</th><th /></tr></thead>
          <tbody>{rows.map((k) => <tr key={k.id}><td>{k.patient_name ? <><b>{loc(k, 'patient_name') || k.patient_name}</b><div className="small muted">{k.mrn}</div></> : <b>{k.title}</b>}</td><td className="small">{k.patient_name && k.title ? `${k.title} · ` : ''}{k.notes}</td>
            <td><select aria-label={t('dsAssignee')} value={k.assigned_to || ''} disabled={!canManage} onChange={(e) => patch(`/schedule/tasks/${k.id}`, { assigned_to: e.target.value ? Number(e.target.value) : null })}><option value="">—</option>{staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select></td>
            <td>{k.due_date || '—'}</td>
            <td><select aria-label={t('status')} value={k.status} disabled={!canManage} onChange={(e) => patch(`/schedule/tasks/${k.id}`, { status: e.target.value })}>{['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'].map((s) => <option key={s} value={s}>{t(`dsTaskStatus_${s}`)}</option>)}</select></td>
            <td>{canManage && <button className="btn sm" onClick={() => patch(`/schedule/tasks/${k.id}`, { status: 'DONE' })}>{t('dsMarkDone')}</button>}</td></tr>)}</tbody></>}
      </table></div>}
      {add && <ListItemModal kind={tab} config={config} staff={staff} board={board} onClose={() => setAdd(false)} onDone={list.reload} />}
    </div>);
}

export default function DailySchedule({ user, staff }) {
  const { t, loc } = useI18n();
  const [date, setDate] = useState(null); const [f, setF] = useState({ department_id: '', clinician_id: '', category_id: '', q: '' });
  const [modal, setModal] = useState(null); const [layout, setLayout] = useState(false); const [version, setVersion] = useState(0);
  const cfgP = usePoll('/config', 30000);
  const qs = `date=${date || ''}&department_id=${f.department_id}&clinician_id=${f.clinician_id}&category_id=${f.category_id}&include_hidden=${layout ? 1 : 0}`;
  const boardP = usePoll(`/schedule/board?${qs}`, 6000);
  const board = boardP.data; const config = cfgP.data;
  const q = f.q.trim().toLowerCase();
  const matches = useMemo(() => (board && q ? board.groups.flatMap((g) => g.rows).flatMap((r) => r.appointments).concat(board.unplaced).filter((a) => `${a.patient_name} ${a.patient_name_ar} ${a.mrn} ${a.phone}`.toLowerCase().includes(q)).length : 0), [board, q]);
  if (!board || !config) return <p className="muted">{boardP.error ? t('dsLoadErr') : t('loading')}</p>;
  const day = date || board.date; const me = board.me;
  const reload = () => { boardP.reload(); setVersion((v) => v + 1); };
  const noGroups = board.groups.length === 0;
  const clinicians = staff.filter((s) => s.active && s.role === 'clinician' && (!f.department_id || String(s.department_id) === String(f.department_id)));
  const openSlot = (row, col) => setModal({ k: 'appt', mode: 'add', prefill: { row_id: row.id, department_id: row.department_id ?? row.group?.department_id, clinician_id: row.user_id, time: col.time, date: day } });
  const slotFor = (row, col, g) => openSlot({ ...row, group: g }, col);
  return (
    <>
      <div className="card sch-toolbar">
        <div className="row" style={{ alignItems: 'center' }}>
          <button className="btn ghost sm" aria-label={t('dsPrev')} onClick={() => setDate(addDays(day, -1))}>◀</button>
          <input type="date" aria-label={t('dsDate')} value={day} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: 170 }} />
          <button className="btn ghost sm" aria-label={t('dsNext')} onClick={() => setDate(addDays(day, 1))}>▶</button>
          <button className="btn ghost sm" onClick={() => setDate(null)}>{t('dsToday')}</button>
          <select aria-label={t('department')} value={f.department_id} onChange={(e) => setF({ ...f, department_id: e.target.value, clinician_id: '' })}><option value="">{t('dsAllDepts')}</option>{config.departments.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select>
          <select aria-label={t('clinician')} value={f.clinician_id} onChange={(e) => setF({ ...f, clinician_id: e.target.value })}><option value="">{t('dsAllStaff')}</option>{clinicians.map((s) => <option key={s.id} value={s.id}>{loc(s)}</option>)}</select>
          <select aria-label={t('dsCategory')} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}><option value="">{t('dsAllCats')}</option>{board.categories.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{loc(c)}</option>)}</select>
          <input type="search" aria-label={t('dsSearch')} placeholder={t('dsSearch')} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} style={{ minWidth: 200, flex: 1 }} />
          {q && <span className="small muted" role="status">{t('dsMatches').replace('{n}', matches)}</span>}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          {me.can_manage && <button className="btn" disabled={noGroups} onClick={() => setModal({ k: 'appt', mode: 'add', prefill: { date: day } })}>＋ {t('dsAddAppt')}</button>}
          {me.can_configure && <button className="btn ghost" disabled={noGroups} onClick={() => setModal({ k: 'row' })}>＋ {t('dsAddRow')}</button>}
          {me.can_configure && <button className="btn ghost" disabled={noGroups} onClick={() => setModal({ k: 'col' })}>＋ {t('dsAddCol')}</button>}
          {me.can_block && <button className="btn ghost" disabled={noGroups} onClick={() => setModal({ k: 'block' })}>{t('dsBlock')}</button>}
          {me.can_configure && <button className="btn ghost" onClick={() => setLayout(true)}>{t('dsLayout')}</button>}
          <span className="sp" />
          <span className="sch-legend">{board.categories.filter((c) => c.active).map((c) => <span key={c.id} className="sch-cat" style={{ background: c.color }}>{loc(c)}{c.default_minutes ? ` · ${c.default_minutes}` : ''}</span>)}</span>
        </div>
      </div>
      {noGroups ? <div className="card"><p>{t('dsNoSchedule')}</p>{me.can_configure ? <><p className="small muted">{t('dsSetupHelp')}</p><button className="btn" onClick={() => setModal({ k: 'setup' })}>{t('dsSetup')}</button></> : <p className="muted">{t('dsAskAdmin')}</p>}</div>
        : board.groups.map((g) => <Group key={g.id} g={g} board={board} q={q} canBook={me.can_manage} onSlot={(r, c) => slotFor(r, c, g)} onOpen={(a) => setModal({ k: 'details', a })} onBlock={(b) => setModal({ k: 'blockdetails', b })} />)}
      {board.unplaced.length > 0 && <div className="card"><h2>{t('dsUnplaced')}</h2><div className="row">{board.unplaced.map((a) => <Chip key={a.id} a={a} onOpen={(x) => setModal({ k: 'details', a: x })} dim={false} hit={false} />)}</div></div>}
      <Lists board={board} config={config} staff={staff} canManage={me.can_manage} version={version} onBook={(prefill) => setModal({ k: 'appt', mode: 'add', prefill })} />
      {modal?.k === 'appt' && <AppointmentModal mode={modal.mode} appt={modal.appt} prefill={modal.prefill} board={board} config={config} staff={staff} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'details' && <DetailsModal appt={modal.a} board={board} onClose={() => setModal(null)} onDone={reload} onAction={(mode, a) => setModal({ k: 'appt', mode, appt: a, prefill: mode === 'copy' ? { date: day, time: '' } : {} })} />}
      {modal?.k === 'row' && <AddRowModal board={board} config={config} staff={staff} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'col' && <AddColumnModal board={board} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'block' && <BlockModal board={board} config={config} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'blockdetails' && <BlockDetailsModal block={modal.b} onClose={() => setModal(null)} onDone={reload} />}
      {modal?.k === 'setup' && <SetupModal onClose={() => setModal(null)} onDone={reload} />}
      {layout && <LayoutModal board={board} config={config} onClose={() => setLayout(false)} onChanged={async () => { await boardP.reload(); }} />}
    </>
  );
}
