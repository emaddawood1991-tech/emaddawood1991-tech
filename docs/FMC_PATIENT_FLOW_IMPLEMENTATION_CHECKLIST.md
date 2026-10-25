# FMC Patient Flow & Room Management — Consolidated Implementation Checklist

Scope: original master spec (feature list preserved in the addendum) + Final Functional Requirements Addendum.
Rules: synthetic data only · no hardcoded departments/rooms/services · no compliance claims without verification · Premium Healthcare Glassmorphism · AR/EN (RTL/LTR).

> Note: the original master prompt was not available in this session. Items marked **[ORIG]** come from the preserved-feature list in the addendum; verify against the original text before Phase 1 sign-off.

---

## 1. Duplicates merged & inconsistencies resolved

| # | Issue | Resolution |
|---|---|---|
| D1 | "Room assignment / entry / exit / transfer" (§1, §2, §6, §9) describe one concept | One **RoomOccupancy** record per patient per location (room or station). Timeline events reference it. |
| D2 | "Treatment timers" [ORIG] vs. "Treatment sessions" (§3) vs. "Session recovery" (§8) | One **TreatmentSession** entity; timer = derived from server timestamps (never a client counter). |
| D3 | "Room capacity" (§6) vs. "Room availability" (§9) vs. "Room transfer capacity conflicts" (§2) | Single **availability engine**: room status + capacity + station state evaluated server-side for every assignment/transfer. |
| D4 | Audit log [ORIG] vs. timeline (§1) vs. corrections (§7) | Three views over one **append-only event store**. Timeline = clinical-flow events; audit = all actions incl. admin/config; corrections = linked events. |
| D5 | Roles [ORIG] vs. staff availability (§5) | Availability ≠ authorization. Permissions come only from role + service authorization; availability is informational/scheduling. |
| D6 | Queue "priority" (§4) | Priority is a **manually set, permissioned, reason-logged** field. Never derived from arrival time. Ordering shown is by arrival; priority is a separate flag. |
| D7 | Check-in/out [ORIG] vs. "final clinic departure" (§1) | Check-out = final clinic departure event; session end ≠ visit end. |
| D8 | Search (§10) vs. role-based permissions | All queries pass through one authorization layer (department/role scoped); no raw search endpoints. |
| D9 | "Unavailable" statuses: staff UNAVAILABLE vs. room OUT OF SERVICE | Separate enums per entity; no shared string constants. |
| D10 | Offline behavior (§8) vs. "no fabricated timestamps" | Offline actions are **blocked or queued as "pending, unsynced"** with the client-claimed time stored separately and flagged; server time is only assigned on receipt. |

Open decisions for FMC (need owner answer, defaults noted):
- Correction approval: which roles approve, and which corrections need approval (default: all post-checkout corrections need supervisor approval).
- Retention periods: from verified DoH/UAE requirements + FMC policy (default: configurable, none hardcoded; research task R1).
- Transfer reason: required or optional (default: optional, required config per department).
- Overlap rule for session duration: union of intervals per patient (default).

---

## 2. Core data model (all configurable, no hardcoded values)

- [ ] Department (name AR/EN, queue prefix, queue numbering config)
- [ ] Service (department, default duration, authorized roles)
- [ ] Room (department, type, capacity, status)
- [ ] TreatmentStation (room, identifier e.g. BED-01, availability)
- [ ] Staff (role, authorized services, schedule)
- [ ] StaffAvailability (status enum: AVAILABLE, BUSY, ON_BREAK, OFF_DUTY, UNAVAILABLE; source: manual/schedule)
- [ ] Patient (synthetic IDs, MRN) · Appointment (reference)
- [ ] Visit (patient, appointment, status)
- [ ] QueueEntry (visit, department, number, clinician, priority, status)
- [ ] TreatmentSession (id, patient, visit, service, clinician, location, start, end, status)
- [ ] RoomOccupancy (patient, visit, session, room/station, in, out)
- [ ] VisitEvent — **append-only** (type, server_ts, actor, payload, supersedes_id?)
- [ ] TimestampCorrection (event, original_ts, corrected_ts, reason, requester, approver, status)
- [ ] RoomStatusHistory (room, status, reason, actor, from, to)
- [ ] AuditLog — append-only
- [ ] Backup/health records (status only, no PHI)

DB-level guarantees:
- [ ] No UPDATE/DELETE grants on VisitEvent and AuditLog (corrections are new rows)
- [ ] Unique constraint: one open RoomOccupancy per station; per-room open count ≤ capacity
- [ ] Unique constraint: one open session per (patient, location); idempotency key on all write actions
- [ ] Server-assigned timestamps only (DB `now()`/server clock)

---

## 3. Implementation phases

### Phase 0 — Foundation
- [ ] Stack decision, repo structure, environments, CI (lint, typecheck, tests)
- [ ] Design system tokens: Premium Healthcare Glassmorphism (light/dark, AR RTL / EN LTR), FMC brand palette (blue/red/steel from logo)
- [ ] i18n framework (AR/EN), date/time formatting (clinic timezone, stored UTC)
- [ ] Auth, session mgmt, RBAC framework, permission matrix
- [ ] Append-only event store + audit logging pipeline
- [ ] Synthetic data generator (patients, staff, appointments)

### Phase 1 — Dynamic configuration [ORIG]
- [ ] Department CRUD · queue numbering config per department (§4)
- [ ] Room CRUD · capacity, beds, stations, identifiers (§6)
- [ ] Service CRUD · authorized roles
- [ ] Staff CRUD · roles · schedules (§5)
- [ ] Settings screens; zero seeded hardcoded values in app code

### Phase 2 — Visit lifecycle & queue
- [ ] Appointment → arrival → check-in [ORIG]
- [ ] Queue entry, queue numbers, waiting duration, priority flag (manual, logged), status (§4)
- [ ] "Call next" (authorized staff; no auto-priority)
- [ ] Reception dashboard (live queue, rooms, staff availability)
- [ ] Final check-out [ORIG]

### Phase 3 — Rooms, stations, sessions
- [ ] Room/station assignment with availability engine (§6, §9)
- [ ] Room statuses: AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE, OUT OF SERVICE; block assignment when unavailable (§9)
- [ ] Maintenance reason + restore + history (§9)
- [ ] TreatmentSession start / pause / resume / complete (§1, §3)
- [ ] Multiple sessions per visit; independent duration; union-of-intervals total (§3)
- [ ] Shared rooms: independent occupancy + session per patient; station double-booking prevented (§6)
- [ ] Room transfer (PT-01 → PT-03): validation, capacity check, reason, original session history preserved, separate occupancy records (§2)

### Phase 4 — Timeline, corrections, recovery
- [ ] Visit timeline view (all 13 event types in §1; server timestamp + actor) with permission-gated access
- [ ] Immutable events; edits expressed as superseding events
- [ ] Correction workflow: request → reason → original/corrected ts → approval (policy-driven) → linked event (§7)
- [ ] Session recovery: state rebuilt from server on refresh/navigation/reconnect; idempotent start/stop; no duplicate sessions (§8)
- [ ] Offline handling: clear sync-error UI; no fabricated timestamps (D10)

### Phase 5 — Staff availability, search, reporting
- [ ] Availability statuses + schedule config; shown on authorized dashboards; never gates authorization (§5, D5)
- [ ] Advanced search: patient ID, MRN, appointment ref, department, service, clinician, room, visit date, session status — authorization-filtered (§10)
- [ ] Reporting [ORIG]: wait times, session durations, room utilization, transfers, corrections, maintenance; export with permission + audit

### Phase 6 — Operations & security
- [ ] Admin-only system health page: app availability, DB connectivity, failed jobs, sync problems, recent errors, backup status (§12); no secrets/PHI in logs
- [ ] Backup/recovery plan document: schedule, encryption at rest, access control, restore runbook, restore test cadence, monitoring (§11)
- [ ] Retention periods: set from verified requirements + FMC policy (R1)
- [ ] Security review: authN/Z, input validation, rate limiting, encryption in transit/at rest, log redaction
- [ ] DoH compliance research [ORIG] (R1) — report findings; no compliance claims until verified

### Phase 7 — Integration pass & hardening (§13)
- [ ] Every new feature wired into: patient management, reception dashboard, room management, treatment sessions, dynamic settings, reporting, audit logs, staff permissions
- [ ] Hardcode scan: no department/room/service literals in code
- [ ] Glassmorphism/RTL visual QA across all screens
- [ ] Accessibility pass (contrast on glass surfaces, keyboard, screen reader)

---

## 4. Test plan (critical paths)

**Timestamps**
- [ ] All event times come from server; client clock skew ±10 min changes nothing
- [ ] Pause/resume totals match event math; DST/timezone boundary cases

**Concurrency**
- [ ] Two clerks assign same station simultaneously → exactly one succeeds
- [ ] Two "call next" clicks → one patient called once
- [ ] Transfer into a room that fills mid-request → rejected cleanly
- [ ] Double-submit / retry with same idempotency key → one session

**Data integrity**
- [ ] UPDATE/DELETE on events/audit rejected at DB level
- [ ] Transfer preserves original session and creates new occupancy
- [ ] Overlapping sessions: total duration = union, not sum
- [ ] Correction keeps original + corrected + approver; timeline shows both

**Permissions**
- [ ] Each role × each action matrix test (allow and deny)
- [ ] Search/timeline/report leaks across departments blocked
- [ ] Available staff without service authorization cannot start that service

**Recovery**
- [ ] Refresh, navigate away/back, network drop 30 s, second-device login: session continues, no duplicate
- [ ] Offline action shown as unsynced, never silently timestamped

**Rooms**
- [ ] No assignment to CLEANING / MAINTENANCE / OUT OF SERVICE
- [ ] Capacity 6 hall accepts 6, rejects 7th
- [ ] Maintenance history complete after disable/restore

**Ops**
- [ ] Backup restore drill into clean environment passes
- [ ] Health page hides secrets/PHI; non-admin gets 403

---

## 5. Acceptance criteria (definition of done)

1. Every item in sections 1–13 of the addendum and every [ORIG] feature maps to a passing test or a documented, owner-approved deviation.
2. No hardcoded departments, rooms, or services anywhere in code or UI.
3. Event/audit stores are demonstrably immutable; all corrections traceable.
4. Concurrency, recovery, and permission test suites green in CI.
5. Backup restore tested and documented.
6. Compliance statements limited to what research R1 verified.
7. AR/EN and RTL/LTR verified on all screens; Glassmorphism applied consistently.
8. Owner sign-off on the four open decisions in section 1.

## Research tasks
- **R1** — Verify DoH Abu Dhabi / UAE requirements: health-data retention, data residency, access logging, backup/encryption, patient record correction rules. Cite sources; tag each as "verified" or "needs confirmation".

---

## Implementation status (updated)

Built in `fmc-flow/` (see its README). Verified by 23 backend tests + a browser smoke test.

| Phase | Status |
|---|---|
| 0 Foundation (auth, RBAC, append-only events/audit, glass design system, AR/EN RTL, synthetic seed) | Done |
| 1 Dynamic configuration (departments, rooms, stations, services, staff, schedules, queue numbering, policies) | Done |
| 2 Visit lifecycle & queue (check-in, queue numbers, call next, manual priority, check-out) | Done |
| 3 Rooms, stations, sessions, transfers, maintenance/cleaning | Done |
| 4 Timeline, corrections (request → approve), session recovery, offline handling | Done |
| 5 Staff availability, advanced search, reports + CSV | Done |
| 6 Health page, encrypted backup/restore, audit view | Done (mechanism); **policy values and R1 DoH research pending** |
| 7 Integration pass | Done for implemented features; hardcode scan: names only in `server/seed.js` |

Decisions taken (defaults, change in Settings → Policy): corrections need approval by a different supervisor/admin; transfer reason optional; total duration = union of active intervals; offline actions are blocked, not queued.

Not yet done / needs input: R1 regulatory research and retention values · production hosting (HTTPS, reverse proxy, secret management) · formal security review · accessibility audit · real (non-synthetic) data handling procedures · MFA / SSO.
