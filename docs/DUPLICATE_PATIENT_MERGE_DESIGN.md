# Duplicate patient records — design proposal (for approval, nothing implemented)

Status: **proposal.** No code exists for this. It needs your written approval before any build, because it changes how clinical history is linked.

## 1. The problem
Two patient records for one person (different EMR numbers) split visits, sessions, documentation and appointments. Today a duplicate is only *warned about* when a record is created or edited (same phone, or same name and date of birth) and can be confirmed as "different people". Nothing joins two records that were already created.

## 2. Principles (from the project rules)
- Never delete or overwrite patient records or audit records.
- Clinical history is never rewritten: no visit, session, note or event changes its recorded values or its timestamps.
- Every step is reversible by an administrator, and every step is audited.
- Department access rules still apply to whatever the merged record shows.

## 3. Recommended approach: link, do not merge
Instead of copying data into one record and deleting the other, **link the duplicate to a survivor**:

- The **survivor** is the record to keep (normally the older or the more complete one).
- The **duplicate** stays in the database untouched, marked `MERGED_INTO survivor`. Its EMR number stays valid and printable on old paperwork.
- Reading a patient resolves links: opening the duplicate (by EMR number, search or old appointment) shows the survivor with a banner "also known as EMR-000123".
- The survivor's history view lists visits and sessions from **both** records, each labelled with the EMR number it was created under.
- New work (check-in, appointments, queue) is always created on the survivor. Open visits or queue entries on the duplicate must be finished or cancelled first (the system refuses the link until then).

Why not a true merge: a true merge moves rows between patients, which rewrites the meaning of past events and audit entries and cannot be undone cleanly. Linking leaves every original row as it was.

## 4. Data model (additive)
- `patient_links(id, duplicate_id UNIQUE, survivor_id, ts, actor_id, approver_id, reason, undone_at, undone_by)` — append-only apart from the `undone_*` fields.
- No change to `patients`, `visits`, `treatment_sessions`, `events`, `appointments` or `audit_log`.
- A read helper `resolvePatient(id)` follows at most one link (a survivor cannot itself be a duplicate: the link request is refused if it would create a chain or a loop).

## 5. Workflow and permissions
1. **Find candidates** (administrator or clinic manager): a list of likely duplicates (same phone, same name + date of birth, similar names), with both records side by side: demographics, number of visits, last visit, departments touched.
2. **Propose a link** with a written reason (at least 15 characters).
3. **Second person approves.** The proposer cannot approve their own link (same rule as corrections). Two administrators, or an administrator and a clinic manager.
4. **Checks before linking:** neither record has an open visit, queue entry, running session or scheduled appointment unless it is first moved or cancelled; the survivor is not itself linked; demographic conflicts (different date of birth, different sex) must be acknowledged explicitly.
5. **Link is created**, audited (`patient.link`), written to the patient-access log, and an alert is raised to administrators.
6. **Undo** (administrator, with a reason): the link is marked undone; both records are independent again. Anything created on the survivor while linked stays on the survivor.

New permissions: `patients.link.propose` (administrator, clinic manager) and `patients.link.approve` (administrator, clinic manager; never the proposer). Reception can see "possible duplicate" markers but cannot link.

## 6. What it changes for each part of the application
| Area | Behaviour after a link |
|---|---|
| Search / check-in | Searching either EMR number finds the survivor; the duplicate is not offered for new work |
| Daily schedule | Appointments already booked on the duplicate must be moved to the survivor before the link (listed to the administrator) |
| Visits, timelines, documentation | Shown on the survivor's history, labelled with their original EMR number |
| Reports and exports | Count each person once (by survivor); the export keeps both EMR numbers |
| Corrections | Unchanged: they act on the original visit or session |
| Privacy log | Access to a linked pair is logged against **both** patient ids |
| Break-glass | A grant on either id covers both |

## 7. Risks and how they are handled
- **Wrong link (two different people):** undo is available at any time; the proposer/approver split and the demographic-conflict acknowledgement reduce the chance.
- **Hidden clinical information:** history from both records is always shown together, with labels.
- **Department scope:** a clinician only sees history from departments they can already see; the linked history is filtered the same way as any other.
- **Performance:** one extra lookup per patient read; negligible.

## 8. Test plan (when approved)
Backend: link refused for open visits / chains / loops / self-approval; read resolution from both ids; department filtering of combined history; undo restores independence; audit and access-log entries; no row in the existing tables changes. Browser: candidate list, side-by-side review, propose, second-person approve, banner on the duplicate, undo.

## 9. Decisions needed from you
1. Do you want **linking** (recommended) or a **true merge**? A true merge is not recommended and would need a separate, stricter design.
2. Who may propose and who may approve (suggested: administrator and clinic manager, never the same person)?
3. Should reception be able to *flag* a suspected duplicate for review?
4. Is it acceptable that the duplicate EMR number stays valid forever (recommended, because paper and referral letters carry it)?
