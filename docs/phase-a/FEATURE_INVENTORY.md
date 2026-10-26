# Feature inventory — existing FMC application (source `a7eddcf`, inspected 26 Oct 2026, nothing modified)

Legend: **Exists** = implemented and covered by a passing baseline test. **Gap** = missing or incomplete. Risk ratings refer to `docs/audit/` finding IDs.

| Module | Existing functionality | Missing / broken | Database dependencies | Security risks | Recommended improvement |
|---|---|---|---|---|---|
| Login | Username + password, scrypt hash, HttpOnly/SameSite/Secure cookie, 12 h idle expiry, rate limit | No MFA, no password change, no reset flow, no forced change; default demo password seeded (F-01, F-04–F-06, F-13) | `users`, `auth_sessions` | High | Phase C: first-run setup, My Account, MFA, async Argon2id/scrypt |
| Dashboard | KPIs, queue per department with Call next, live sessions, room map with beds, staff availability | "Rooms free" ignores partly-used halls (F-20) | read-only views | Low | Show free beds |
| Reception / registration | New-patient form: MRN manual/auto, EN+AR names, DOB, gender, UAE/international phone, department + service, Save, Save & check in; duplicate-MRN and possible-duplicate protection; idempotent | Cannot edit or merge patients (F-21) | `patients`, `idempotency_keys`, `queue_entries`, `visits` | Medium (stores a copy of patient JSON in idempotency table, F-10) | Edit with approval, merge workflow |
| Patient search | MRN, EN name, AR name, phone, ID | Not department-scoped; `%` dumps directory; no per-patient read log (F-03, F-09) | `patients` | **High** | Scope by role/department, min length, access logging, break-glass |
| Appointments | API create/list; check-in links an appointment | No screen to create/cancel/reschedule (F-21) | `appointments` | Low | Appointment screen |
| Visits | Open visits table, check-in/out, timeline with actor + server time | No warning on check-out while queued elsewhere (F-23) | `visits`, `events` | Low | Confirm dialog |
| Queues | Per-department numbering (prefix, start, daily reset), call next, manual priority with reason | No cancel / no-show (F-21) | `queue_entries`, `queue_counters` | Low | Cancel with reason |
| Departments | Dynamic CRUD; deactivate (never delete); six active FMC departments | Can deactivate with open visits (F-19) | `departments` | Medium | Dependency checks |
| Services | Dynamic CRUD, department-scoped, default minutes, per-service authorized clinicians view | — | `services`, `staff_services` | Low | Keep |
| Rooms | Dynamic CRUD; status AVAILABLE/CLEANING/MAINTENANCE/OUT_OF_SERVICE with reasons and history; cleaning after use | Hall shows "Occupied" at 1/6 (F-20) | `rooms`, `room_status_history` | Low | Partly-used state |
| Treatment stations | Beds per room, unique per open occupancy, independent timers per patient | — | `stations`, `occupancy` | Low | Keep |
| Treatment sessions | Start (department + authorization checks), pause/resume/complete, multiple per visit, union-of-intervals duration, idempotent start, on-behalf start | — | `treatment_sessions`, `session_pauses` | Low | Keep; review on-behalf rule (decision E-7) |
| Room transfers / multiple rooms | Transfer with reason, separate occupancy rows, history kept | — | `occupancy` | Low | Keep |
| Corrections | Request → different approver; originals preserved | — | `corrections` | Low | Keep |
| Staff management | Create/edit staff, role, one department, authorized services, schedules, availability statuses | One department only; no username change; weak password rules; no lifecycle (F-04, F-08, F-15) | `users`, `staff_services`, `staff_schedules`, `staff_availability` | High | Phase C |
| User management / My Account | **Does not exist** beyond the basic Staff form | Everything requested in section 7 | — | High | Phase C |
| Reports | KPIs, by service, by room, CSV export, date range | No scheduling/report settings | read-only aggregates | Low | Report settings later |
| Settings | Departments, Rooms, Services, Staff, Policy (corrections approval, transfer reason, registration rules, gender options) | No workflow/alert settings UI | `settings` | Medium | Add operational alerts |
| Security | CSRF header + SameSite, CSP and basic headers, parameterised SQL, append-only triggers | MFA, HSTS, absolute session lifetime, session list (F-05, F-16, F-17) | `audit_log`, `auth_sessions` | **High** | Phase B/C |
| Audit log | Login, failed login, check-in/out, room, session, corrections, config, timeline views | No read logging, no tamper evidence, no distinct security events (F-09) | `audit_log` | High | Hash chain + access log |
| Database | SQLite file, WAL, FK, unique indexes, append-only triggers; encrypted backup/restore (tested) | No migrations framework, unencrypted at rest, file mode 644, no scheduler (F-10, F-22) | whole system | High for real data | Decision E-2 |
| API endpoints | 47 JSON routes under `/api` (list below) | No API keys/service accounts, no versioning, no OpenAPI | — | Medium | Phase F design |
| External integrations | **None.** No outbound calls, webhooks, FHIR or HL7 | Everything (see `INTEGRATION_READINESS.md`) | — | n/a | Phase F |
| System health | Admin page: DB, errors, sync issues, backup status | No alerting | `system_errors`, `backup_log` | Low | Monitoring |
| Localisation | Arabic/English, RTL, Dubai/Abu Dhabi timezone setting | Arabic date formats follow browser | — | Low | Review |
| Demo builds (`fmc-demo.html`, `FMC-*.html`) | Same code with in-browser database and demo hash | Not secure by design (F-02) | browser localStorage | **Critical if misused** | Keep as reference only |

Existing / broken: nothing is currently broken in the baseline suites. The previously reported empty Start Treatment dropdown was reproduced and fixed in `a7eddcf` (root cause in `docs/audit/`).

## API endpoints (47)
POST /login, /logout · GET /me, /time, /config, /staff · POST /config/{departments|rooms|stations|services}, PATCH /config/{…}/:id, PATCH /config/settings, POST /config/staff, PATCH /config/staff/:id · GET/PUT /staff/:id/schedule, PUT /staff/:id/availability · GET/POST /patients, POST /registrations · GET/POST /appointments · POST /visits/checkin, /visits/:id/checkout, GET /visits/open, /visits/:id/timeline, /visits/:id/treatment-options · GET /queue, POST /queue/call-next, PATCH /queue/:id/priority · POST /visits/:id/room, /room/enter, /room/exit, /room/transfer · PUT /rooms/:id/status, GET /rooms/:id/history · GET /sessions/active, POST /visits/:id/sessions, /sessions/:id/{pause|resume|complete} · GET/POST /corrections, POST /corrections/:id/decision · GET /search, /reports, /reports/sessions.csv, /audit, /health · POST /client-sync-issue
