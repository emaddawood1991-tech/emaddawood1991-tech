import { useState } from 'react';
import { api, usePoll } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Chip, Modal, useAction } from '../ui.jsx';

function Table({ title, endpoint, rows, fields, reload, extra }) {
  const { t } = useI18n(); const { run } = useAction(); const [edit, setEdit] = useState(null);
  const save = async () => {
    const body = Object.fromEntries(fields.map((f) => [f.k, f.type === 'bool' ? (edit[f.k] ? 1 : 0) : f.type === 'num' || f.type === 'ref' ? (edit[f.k] === '' || edit[f.k] == null ? undefined : Number(edit[f.k])) : edit[f.k]]).filter(([, v]) => v !== undefined));
    const r = await run(() => (edit.id ? api.patch(`/config/${endpoint}/${edit.id}`, body) : api.post(`/config/${endpoint}`, body)), t('save'));
    if (r) { setEdit(null); reload(); }
  };
  const blank = Object.fromEntries(fields.map((f) => [f.k, f.def ?? '']));
  return (
    <div className="card"><h2>{title}<button className="btn sm" onClick={() => setEdit({ ...blank })}>＋ {t('add')}</button></h2>
      <div className="tbl"><table><thead><tr>{fields.map((f) => <th key={f.k}>{f.label}</th>)}<th /></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>{fields.map((f) => <td key={f.k}>{f.type === 'bool' ? (r[f.k] ? '✓' : '—') : f.type === 'ref' ? f.opts.find(([v]) => v === r[f.k])?.[1] : r[f.k]}</td>)}
          <td><button className="btn ghost sm" onClick={() => setEdit({ ...r })}>{t('edit')}</button>{extra?.(r)}</td></tr>)}</tbody></table></div>
      {edit && <Modal title={title} onClose={() => setEdit(null)}><div className="stack">
        {fields.map((f) => f.type === 'bool' ? <label key={f.k} className="chk"><input type="checkbox" checked={!!edit[f.k]} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.checked })} />{f.label}</label>
          : f.type === 'ref' ? <label key={f.k}>{f.label}<select value={edit[f.k] ?? ''} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} disabled={!!edit.id && f.lock}><option value="">—</option>{f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          : <label key={f.k}>{f.label}<input type={f.type === 'num' ? 'number' : 'text'} value={edit[f.k] ?? ''} dir={f.k.endsWith('_ar') ? 'rtl' : undefined} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} /></label>)}
        <button className="btn" onClick={save}>{t('save')}</button></div></Modal>}
    </div>
  );
}

function StaffAdmin({ staff, config, reload }) {
  const { t, loc } = useI18n(); const { run } = useAction(); const [e, setE] = useState(null); const [sch, setSch] = useState(null);
  const save = async () => {
    const body = { name: e.name, name_ar: e.name_ar, role: e.role, department_id: e.department_id ? Number(e.department_id) : null, service_ids: e.service_ids || [] };
    const r = await run(() => (e.id ? api.patch(`/config/staff/${e.id}`, { ...body, ...(e.password ? { password: e.password } : {}), active: e.active ? 1 : 0 }) : api.post('/config/staff', { ...body, username: e.username, password: e.password })), t('save'));
    if (r) { setE(null); reload(); }
  };
  const openSch = async (u) => setSch({ u, rows: await api.get(`/staff/${u.id}/schedule`) });
  const saveSch = async () => { const r = await run(() => api.put(`/staff/${sch.u.id}/schedule`, sch.rows), t('save')); if (r) setSch(null); };
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="card"><h2>{t('staff')}<button className="btn sm" onClick={() => setE({ username: '', name: '', name_ar: '', role: 'clinician', department_id: '', password: '', service_ids: [], active: 1 })}>＋ {t('add')}</button></h2>
      <div className="tbl"><table><thead><tr><th>{t('name')}</th><th>{t('role')}</th><th>{t('department')}</th><th>{t('status')}</th><th>{t('authorizedServices')}</th><th /></tr></thead>
        <tbody>{staff.map((s) => <tr key={s.id}><td>{loc(s)}<div className="small muted">{s.username}</div></td><td>{s.role}</td><td>{loc(config.departments.find((d) => d.id === s.department_id) || {}) || '—'}</td><td>{s.active ? <Chip s={s.availability} /> : <Chip s="REJECTED" label="inactive" />}</td>
          <td className="small">{s.service_ids.map((id) => config.services.find((x) => x.id === id)?.name).filter(Boolean).join(', ') || '—'}</td>
          <td><div className="row"><button className="btn ghost sm" onClick={() => setE({ ...s })}>{t('edit')}</button><button className="btn ghost sm" onClick={() => openSch(s)}>{t('schedule')}</button></div></td></tr>)}</tbody></table></div>
      {e && <Modal title={t('staff')} onClose={() => setE(null)}><div className="stack">
        {!e.id && <label>{t('username')}<input value={e.username} onChange={(x) => setE({ ...e, username: x.target.value })} /></label>}
        <label>{t('name')}<input value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} /></label>
        <label>{t('nameAr')}<input dir="rtl" value={e.name_ar} onChange={(x) => setE({ ...e, name_ar: x.target.value })} /></label>
        <div className="form-grid"><label>{t('role')}<select value={e.role} onChange={(x) => setE({ ...e, role: x.target.value })}>{['admin', 'supervisor', 'reception', 'clinician'].map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>{t('department')}<select value={e.department_id ?? ''} onChange={(x) => setE({ ...e, department_id: x.target.value })}><option value="">—</option>{config.departments.map((d) => <option key={d.id} value={d.id}>{loc(d)}</option>)}</select></label></div>
        <label>{t('password')} {e.id && '(leave blank to keep)'}<input type="password" autoComplete="new-password" value={e.password || ''} onChange={(x) => setE({ ...e, password: x.target.value })} /></label>
        <fieldset style={{ border: '1px solid rgba(46,85,178,.2)', borderRadius: 12 }}><legend className="small">{t('authorizedServices')}</legend>
          {config.services.map((s) => <label key={s.id} className="chk"><input type="checkbox" checked={(e.service_ids || []).includes(s.id)} onChange={(x) => setE({ ...e, service_ids: x.target.checked ? [...(e.service_ids || []), s.id] : e.service_ids.filter((i) => i !== s.id) })} />{loc(s)}</label>)}</fieldset>
        {e.id && <label className="chk"><input type="checkbox" checked={!!e.active} onChange={(x) => setE({ ...e, active: x.target.checked })} />{t('active')}</label>}
        <button className="btn" onClick={save}>{t('save')}</button></div></Modal>}
      {sch && <Modal title={`${t('schedule')} — ${loc(sch.u)}`} onClose={() => setSch(null)}><div className="stack">
        {sch.rows.map((r, i) => <div key={i} className="row"><select value={r.weekday} onChange={(x) => setSch({ ...sch, rows: sch.rows.map((q, j) => (j === i ? { ...q, weekday: Number(x.target.value) } : q)) })} style={{ width: 90 }}>{days.map((d, n) => <option key={d} value={n}>{d}</option>)}</select>
          <input type="time" value={r.start_time} onChange={(x) => setSch({ ...sch, rows: sch.rows.map((q, j) => (j === i ? { ...q, start_time: x.target.value } : q)) })} />
          <input type="time" value={r.end_time} onChange={(x) => setSch({ ...sch, rows: sch.rows.map((q, j) => (j === i ? { ...q, end_time: x.target.value } : q)) })} />
          <button className="btn ghost sm" onClick={() => setSch({ ...sch, rows: sch.rows.filter((_, j) => j !== i) })}>✕</button></div>)}
        <button className="btn ghost" onClick={() => setSch({ ...sch, rows: [...sch.rows, { weekday: 1, start_time: '08:00', end_time: '16:00' }] })}>＋ {t('add')}</button>
        <button className="btn" onClick={saveSch}>{t('save')}</button></div></Modal>}
    </div>
  );
}

export default function Settings({ staff, reloadStaff }) {
  const { t, loc } = useI18n(); const { run } = useAction();
  const cfg = usePoll('/config', 0); const [tab, setTab] = useState('departments');
  const config = cfg.data; if (!config) return <p className="muted">{t('loading')}</p>;
  const depOpts = config.departments.map((d) => [d.id, d.name]);
  const reload = () => { cfg.reload(); reloadStaff(); };
  const setPol = async (k, v) => { await run(() => api.patch('/config/settings', { [k]: v ? '1' : '0' }), t('save')); cfg.reload(); };
  return (
    <>
      <div className="tabs">{['departments', 'rooms', 'services', 'staff', 'policy'].map((k) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(k === 'rooms' ? 'rooms' : k)}</button>)}</div>
      {tab === 'departments' && <Table title={t('departments')} endpoint="departments" rows={config.departments} reload={reload} fields={[{ k: 'name', label: t('name') }, { k: 'name_ar', label: t('nameAr') }, { k: 'queue_prefix', label: t('prefix') }, { k: 'queue_start', label: t('startNo'), type: 'num', def: 1 }, { k: 'queue_reset_daily', label: t('resetDaily'), type: 'bool', def: 1 }, { k: 'active', label: t('active'), type: 'bool', def: 1 }]} />}
      {tab === 'rooms' && <>
        <Table title={t('rooms')} endpoint="rooms" rows={config.rooms} reload={reload} fields={[{ k: 'department_id', label: t('department'), type: 'ref', opts: depOpts }, { k: 'code', label: 'Code' }, { k: 'name', label: t('name') }, { k: 'name_ar', label: t('nameAr') }, { k: 'capacity', label: t('capacity'), type: 'num', def: 1 }, { k: 'cleaning_after_use', label: t('cleaningAfter'), type: 'bool' }, { k: 'active', label: t('active'), type: 'bool', def: 1 }]} />
        <Table title={t('stations')} endpoint="stations" rows={config.rooms.flatMap((r) => r.stations.map((s) => ({ ...s, room_code: r.code })))} reload={reload} fields={[{ k: 'room_id', label: t('room'), type: 'ref', lock: true, opts: config.rooms.map((r) => [r.id, r.code]) }, { k: 'code', label: t('station') }, { k: 'active', label: t('active'), type: 'bool', def: 1 }]} />
      </>}
      {tab === 'services' && <Table title={t('services')} endpoint="services" rows={config.services} reload={reload} fields={[{ k: 'department_id', label: t('department'), type: 'ref', opts: depOpts }, { k: 'name', label: t('name') }, { k: 'name_ar', label: t('nameAr') }, { k: 'default_minutes', label: t('minutes'), type: 'num', def: 30 }, { k: 'active', label: t('active'), type: 'bool', def: 1 }]} />}
      {tab === 'staff' && <StaffAdmin staff={staff} config={config} reload={reload} />}
      {tab === 'policy' && <div className="card stack"><h2>{t('policy')}</h2>
        <label className="chk"><input type="checkbox" checked={config.settings.correction_requires_approval === '1'} onChange={(e) => setPol('correction_requires_approval', e.target.checked)} />{t('policyApproval')}</label>
        <label className="chk"><input type="checkbox" checked={config.settings.transfer_reason_required === '1'} onChange={(e) => setPol('transfer_reason_required', e.target.checked)} />{t('policyTransfer')}</label>
        <p className="small muted">Retention periods and backup schedule are set from verified requirements and FMC policy — see docs/BACKUP_AND_RECOVERY.md.</p></div>}
    </>
  );
}
