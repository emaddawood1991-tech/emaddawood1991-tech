// Duplicate patient records (stage S11): link a duplicate to the record that is kept. Nothing is merged, moved or deleted.
// See docs/DUPLICATE_PATIENT_MERGE_DESIGN.md. Proposal and approval are two different people; an administrator can undo a link.
import { deptScope } from './perms.js';

const MIN_REASON = 15;

export function makeLinks({ db, ops, HttpError }) {
  const { q, one, run, audit, now } = ops;
  const bad = (fields, message = 'Please correct the highlighted fields.') => { throw new HttpError(400, 'VALIDATION', message, { fields }); };

  const activeLinkOfDuplicate = (id) => one("SELECT * FROM patient_links WHERE duplicate_id=? AND status='ACTIVE'", id) || null;
  /** The record that stands for this person: the survivor when `id` is a linked duplicate, otherwise `id` itself. */
  const survivorOf = (id) => activeLinkOfDuplicate(id)?.survivor_id ?? id;
  /** Every record id of one person: the survivor and all duplicates linked to it. */
  function familyIds(id) {
    const s = survivorOf(id);
    return [s, ...q("SELECT duplicate_id FROM patient_links WHERE survivor_id=? AND status='ACTIVE' ORDER BY duplicate_id", s).map((r) => r.duplicate_id)];
  }
  const brief = (id) => one('SELECT id,mrn,name,name_ar,dob,sex,phone FROM patients WHERE id=?', id) || null;

  /** Throws when the record is a linked duplicate: new work (check-in, bookings) must go on the surviving record. */
  function refuseIfLinked(patientId) {
    const l = activeLinkOfDuplicate(Number(patientId)); if (!l) return;
    const s = brief(l.survivor_id);
    throw new HttpError(409, 'PATIENT_LINKED', `This record (${brief(Number(patientId))?.mrn}) was linked to ${s.mrn}. Use ${s.mrn} for new work.`, { survivor: s });
  }

  function summary(id) {
    const p = brief(id); if (!p) return null;
    const visits = one('SELECT COUNT(*) c, MAX(arrived_at) last FROM visits WHERE patient_id=?', id);
    return { ...p, visit_count: visits.c, last_visit: visits.last,
      departments: q('SELECT DISTINCT d.name FROM queue_entries qe JOIN visits v ON v.id=qe.visit_id JOIN departments d ON d.id=qe.department_id WHERE v.patient_id=? ORDER BY d.name', id).map((x) => x.name),
      open: openActivity(id), linked_to: activeLinkOfDuplicate(id)?.survivor_id ?? null };
  }
  /** Things that must be finished or moved before a record can become a duplicate. */
  function openActivity(id) {
    return {
      open_visits: one("SELECT COUNT(*) c FROM visits WHERE patient_id=? AND status='OPEN'", id).c,
      queue_entries: one("SELECT COUNT(*) c FROM queue_entries qe JOIN visits v ON v.id=qe.visit_id WHERE v.patient_id=? AND qe.status IN ('WAITING','CALLED','IN_ROOM')", id).c,
      running_sessions: one("SELECT COUNT(*) c FROM treatment_sessions WHERE patient_id=? AND status IN ('ACTIVE','PAUSED')", id).c,
      appointments: one("SELECT COUNT(*) c FROM appointments WHERE patient_id=? AND status IN ('SCHEDULED','ARRIVED')", id).c,
      waiting_list: one("SELECT COUNT(*) c FROM waiting_list WHERE patient_id=? AND status='WAITING'", id).c,
    };
  }
  const isBusy = (o) => Object.values(o).some((n) => n > 0);

  /** Rules shared by proposing and approving. `ack` acknowledges demographic differences. */
  function check(dupId, survId, ack) {
    if (!dupId || !survId || dupId === survId) bad({ duplicate_id: 'Choose two different patient records.' });
    const d = brief(dupId), s = brief(survId); if (!d || !s) throw new HttpError(404, 'NOT_FOUND', 'Patient record not found.');
    if (activeLinkOfDuplicate(survId)) bad({ survivor_id: `${s.mrn} is itself a linked duplicate. Choose the record it was linked to.` });
    if (one("SELECT 1 x FROM patient_links WHERE survivor_id=? AND status='ACTIVE'", dupId)) bad({ duplicate_id: `${d.mrn} already has duplicates linked to it, so it must stay the surviving record.` });
    const o = openActivity(dupId);
    if (isBusy(o)) throw new HttpError(409, 'OPEN_ACTIVITY', `${d.mrn} still has open work (open visit, queue entry, running session, booked appointment or waiting-list entry). Finish, cancel or move it first.`, { open: o });
    const conflicts = [];
    if (d.dob && s.dob && d.dob !== s.dob) conflicts.push('dob');
    if (d.sex && s.sex && d.sex !== s.sex) conflicts.push('sex');
    if (conflicts.length && !ack) throw new HttpError(409, 'DEMOGRAPHIC_CONFLICT', 'The two records have different date of birth or sex. Confirm only if you are sure they are the same person.', { conflicts, duplicate: d, survivor: s });
    return { d, s, conflicts };
  }

  const view = (l) => ({ ...l, duplicate: brief(l.duplicate_id), survivor: brief(l.survivor_id),
    proposer: one('SELECT name FROM users WHERE id=?', l.proposed_by)?.name ?? null, approver: l.approved_by ? one('SELECT name FROM users WHERE id=?', l.approved_by)?.name ?? null : null,
    undone_by_name: l.undone_by ? one('SELECT name FROM users WHERE id=?', l.undone_by)?.name ?? null : null, conflicts: JSON.parse(l.conflicts || '[]') });

  function register(app, { guard }) {
    app.get('/api/patients/duplicate-candidates', guard('patients.link.propose'), (req, res) => {
      const pairs = q(`SELECT a.id a_id, b.id b_id, 'PHONE' why FROM patients a JOIN patients b ON b.phone=a.phone AND b.id>a.id WHERE COALESCE(a.phone,'')<>''
        UNION SELECT a.id, b.id, 'NAME_DOB' FROM patients a JOIN patients b ON b.dob=a.dob AND lower(b.name)=lower(a.name) AND b.id>a.id WHERE COALESCE(a.dob,'')<>'' LIMIT 400`);
      const seen = new Set(); const out = [];
      for (const p of pairs) {
        const k = `${p.a_id}-${p.b_id}`; if (seen.has(k)) continue; seen.add(k);
        if (activeLinkOfDuplicate(p.a_id) || activeLinkOfDuplicate(p.b_id)) continue;
        if (one("SELECT 1 x FROM patient_links WHERE status IN ('PROPOSED','ACTIVE') AND ((duplicate_id=? AND survivor_id=?) OR (duplicate_id=? AND survivor_id=?))", p.a_id, p.b_id, p.b_id, p.a_id)) continue;
        if (one("SELECT 1 x FROM duplicate_flags WHERE status='DISMISSED' AND ((patient_a=? AND patient_b=?) OR (patient_a=? AND patient_b=?))", p.a_id, p.b_id, p.b_id, p.a_id)) continue;
        out.push({ why: p.why, a: summary(p.a_id), b: summary(p.b_id) }); if (out.length >= 50) break;
      }
      ops.logAccess(req.user, out.flatMap((x) => [x.a.id, x.b.id]), 'PATIENT_LINK');
      res.json(out);
    });
    app.get('/api/patients/links', guard('patients.link.propose'), (req, res) => {
      const rows = q("SELECT * FROM patient_links ORDER BY CASE status WHEN 'PROPOSED' THEN 0 WHEN 'ACTIVE' THEN 1 ELSE 2 END, id DESC LIMIT 200").map(view);
      res.json({ me: req.user.id, links: rows, flags: q("SELECT f.*, u.name flagged_by_name FROM duplicate_flags f LEFT JOIN users u ON u.id=f.flagged_by WHERE f.status='OPEN' ORDER BY f.id DESC LIMIT 100").map((f) => ({ ...f, a: brief(f.patient_a), b: brief(f.patient_b) })) });
    });
    app.post('/api/patients/links', guard('patients.link.propose'), (req, res) => {
      const b = req.body || {}; const dupId = Number(b.duplicate_id), survId = Number(b.survivor_id); const reason = String(b.reason || '').trim();
      if (reason.length < MIN_REASON) bad({ reason: `Write why they are the same person (at least ${MIN_REASON} characters).` });
      if (reason.length > 500) bad({ reason: 'Up to 500 characters.' });
      if (one("SELECT 1 x FROM patient_links WHERE duplicate_id=? AND status IN ('PROPOSED','ACTIVE')", dupId)) throw new HttpError(409, 'ALREADY_LINKED', 'That record already has a link proposed or active.');
      const { d, s, conflicts } = check(dupId, survId, !!b.acknowledge_conflicts);
      const id = Number(run("INSERT INTO patient_links(duplicate_id,survivor_id,status,reason,proposed_by,proposed_at,conflicts) VALUES (?,?, 'PROPOSED', ?,?,?,?)", dupId, survId, reason, req.user.id, now(), JSON.stringify(conflicts)).lastInsertRowid);
      audit(req.user, 'patient.link.propose', 'patient', survId, { link: id, duplicate: d.mrn, survivor: s.mrn, conflicts });
      for (const f of q("SELECT id FROM duplicate_flags WHERE status='OPEN' AND ((patient_a=? AND patient_b=?) OR (patient_a=? AND patient_b=?))", dupId, survId, survId, dupId)) run("UPDATE duplicate_flags SET status='LINKED', handled_by=?, handled_at=? WHERE id=?", req.user.id, now(), f.id);
      res.status(201).json(view(one('SELECT * FROM patient_links WHERE id=?', id)));
    });
    app.post('/api/patients/links/:id/approve', guard('patients.link.approve'), (req, res) => {
      const l = one('SELECT * FROM patient_links WHERE id=?', Number(req.params.id)); if (!l) throw new HttpError(404, 'NOT_FOUND', 'Link not found.');
      if (l.status !== 'PROPOSED') throw new HttpError(409, 'NOT_PENDING', 'This link is not waiting for approval.');
      if (l.proposed_by === req.user.id) throw new HttpError(403, 'SAME_PERSON', 'A link must be approved by a different person than the one who proposed it.');
      const { d, s, conflicts } = check(l.duplicate_id, l.survivor_id, JSON.parse(l.conflicts || '[]').length > 0);
      run("UPDATE patient_links SET status='ACTIVE', approved_by=?, approved_at=?, decision_note=? WHERE id=?", req.user.id, now(), String(req.body?.note || '').slice(0, 300), l.id);
      audit(req.user, 'patient.link', 'patient', l.survivor_id, { link: l.id, duplicate: d.mrn, survivor: s.mrn, conflicts, proposed_by: l.proposed_by });
      ops.logAccess(req.user, [l.duplicate_id, l.survivor_id], 'PATIENT_LINK', { dedupe: false, detail: { link: l.id } });
      run('INSERT INTO security_alerts(ts,kind,severity,user_id,detail) VALUES (?,?,?,?,?)', now(), 'PATIENT_LINKED', 'WARNING', req.user.id, JSON.stringify({ link: l.id, duplicate: d.mrn, survivor: s.mrn }));
      res.json(view(one('SELECT * FROM patient_links WHERE id=?', l.id)));
    });
    app.post('/api/patients/links/:id/reject', guard('patients.link.propose'), (req, res) => {
      const l = one('SELECT * FROM patient_links WHERE id=?', Number(req.params.id)); if (!l) throw new HttpError(404, 'NOT_FOUND', 'Link not found.');
      if (l.status !== 'PROPOSED') throw new HttpError(409, 'NOT_PENDING', 'This link is not waiting for approval.');
      const note = String(req.body?.note || '').trim(); if (note.length < 3) bad({ note: 'Add a short note.' });
      run("UPDATE patient_links SET status='REJECTED', approved_by=?, approved_at=?, decision_note=? WHERE id=?", req.user.id, now(), note.slice(0, 300), l.id);
      audit(req.user, l.proposed_by === req.user.id ? 'patient.link.withdraw' : 'patient.link.reject', 'patient', l.survivor_id, { link: l.id });
      res.json(view(one('SELECT * FROM patient_links WHERE id=?', l.id)));
    });
    app.post('/api/patients/links/:id/undo', guard('patients.link.undo'), (req, res) => {
      const l = one('SELECT * FROM patient_links WHERE id=?', Number(req.params.id)); if (!l) throw new HttpError(404, 'NOT_FOUND', 'Link not found.');
      if (l.status !== 'ACTIVE') throw new HttpError(409, 'NOT_ACTIVE', 'Only an active link can be undone.');
      const why = String(req.body?.reason || '').trim(); if (why.length < 10) bad({ reason: 'Write why the link is being undone (at least 10 characters).' });
      run("UPDATE patient_links SET status='UNDONE', undone_by=?, undone_at=?, undo_reason=? WHERE id=?", req.user.id, now(), why.slice(0, 300), l.id);
      audit(req.user, 'patient.link.undo', 'patient', l.survivor_id, { link: l.id, duplicate: brief(l.duplicate_id)?.mrn, survivor: brief(l.survivor_id)?.mrn });
      ops.logAccess(req.user, [l.duplicate_id, l.survivor_id], 'PATIENT_LINK', { dedupe: false, detail: { link: l.id, undone: true } });
      run('INSERT INTO security_alerts(ts,kind,severity,user_id,detail) VALUES (?,?,?,?,?)', now(), 'PATIENT_LINK_UNDONE', 'WARNING', req.user.id, JSON.stringify({ link: l.id }));
      res.json(view(one('SELECT * FROM patient_links WHERE id=?', l.id)));
    });
    // reception (and managers) can report a suspected duplicate; they cannot link
    app.post('/api/patients/flag-duplicate', guard('patients.link.flag'), (req, res) => {
      const a = Number(req.body?.patient_id), b = Number(req.body?.other_patient_id); const reason = String(req.body?.reason || '').trim();
      if (!a || !b || a === b) bad({ other_patient_id: 'Choose two different patients.' });
      if (!brief(a) || !brief(b)) throw new HttpError(404, 'NOT_FOUND', 'Patient not found.');
      if (reason.length < 5) bad({ reason: 'Say why you think they are the same person.' });
      if (one("SELECT 1 x FROM duplicate_flags WHERE status='OPEN' AND ((patient_a=? AND patient_b=?) OR (patient_a=? AND patient_b=?))", a, b, b, a)) throw new HttpError(409, 'ALREADY_FLAGGED', 'This pair is already waiting for review.');
      const id = Number(run('INSERT INTO duplicate_flags(patient_a,patient_b,reason,flagged_by,ts) VALUES (?,?,?,?,?)', a, b, reason.slice(0, 300), req.user.id, now()).lastInsertRowid);
      audit(req.user, 'patient.duplicate.flag', 'patient', a, { flag: id, other: brief(b).mrn });
      res.status(201).json({ id });
    });
    app.post('/api/patients/flags/:id/dismiss', guard('patients.link.propose'), (req, res) => {
      const f = one('SELECT * FROM duplicate_flags WHERE id=?', Number(req.params.id)); if (!f) throw new HttpError(404, 'NOT_FOUND', 'Flag not found.');
      if (f.status !== 'OPEN') throw new HttpError(409, 'NOT_OPEN', 'Already handled.');
      run("UPDATE duplicate_flags SET status='DISMISSED', handled_by=?, handled_at=? WHERE id=?", req.user.id, now(), f.id);
      audit(req.user, 'patient.duplicate.dismiss', 'patient', f.patient_a, { flag: f.id });
      res.json({ ok: true });
    });
    // one person's history across the surviving record and every linked duplicate, limited to what the signed-in person may see
    app.get('/api/patients/:id/history', guard('patients.read'), (req, res) => {
      const id = Number(req.params.id); const p = brief(id); if (!p) throw new HttpError(404, 'NOT_FOUND', 'Patient not found.');
      const ids = familyIds(id); const scoped = deptScope(req.user) != null;
      const visits = q(`SELECT v.id, v.patient_id, v.arrived_at, v.departed_at, v.status, p.mrn FROM visits v JOIN patients p ON p.id=v.patient_id WHERE v.patient_id IN (SELECT value FROM json_each(?)) ORDER BY v.arrived_at DESC LIMIT 200`, JSON.stringify(ids))
        .filter((v) => !scoped || ops.visitVisible(req.user, v.id))
        .map((v) => ({ ...v, departments: q('SELECT DISTINCT d.name FROM queue_entries qe JOIN departments d ON d.id=qe.department_id WHERE qe.visit_id=? ORDER BY d.name', v.id).map((x) => x.name),
          sessions: one('SELECT COUNT(*) c FROM treatment_sessions WHERE visit_id=?', v.id).c, from_linked_record: v.patient_id !== ids[0] }));
      if (scoped && !visits.length) throw new HttpError(403, 'OUT_OF_SCOPE', 'This patient has no visits in your departments.');
      ops.logAccess(req.user, ids, 'VISITS');
      const survivor = brief(ids[0]);
      res.json({ patient: survivor, also_known_as: ids.slice(1).map((x) => brief(x).mrn), requested: p.mrn, visits });
    });
  }
  return { register, refuseIfLinked, familyIds, survivorOf, activeLinkOfDuplicate };
}
