# FMC Patient Flow — API reference

Generated from the running router by `npm run docs:api` — do not edit by hand (`tests/apidoc.test.js` fails if this file is out of date).

**133 routes: 129 require sign-in, 4 are public.** All permissions are enforced on the server; the interface only hides what a role cannot use.

Conventions: JSON in and out; every request that is not a GET must send the header `x-requested-with: fmc` (cross-site request protection); the session is an HTTP-only cookie; errors are `{ "error": { "code": "CODE", "message": "…" } }` with the status codes 400 validation or malformed JSON, 401 not signed in, 403 not allowed (including a missing header), 404 not found, 409 conflict, 429 too many attempts.

Roles: `admin`, `supervisor`, `reception`, `clinician`. Role templates (see Security & Access) map onto these four enforced roles. Department access and clinical service authorization are separate checks made on top of the role.

## /api/account

| Method | Path | Access |
|---|---|---|
| GET | `/api/account` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/account/password` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/account/sessions/:sid/revoke` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/account/sessions/revoke-others` | Any signed-in user (finer rules are checked inside the operation) |

## /api/appointments

| Method | Path | Access |
|---|---|---|
| GET | `/api/appointments` | `patients.read` — admin, supervisor, reception, clinician |
| POST | `/api/appointments` | `patients.write` — admin, reception |

## /api/audit

| Method | Path | Access |
|---|---|---|
| GET | `/api/audit` | `audit.view` — admin, supervisor |

## /api/break-glass

| Method | Path | Access |
|---|---|---|
| POST | `/api/break-glass` | `breakglass.use` — supervisor, clinician |
| POST | `/api/break-glass/:id/end` | `breakglass.use` — supervisor, clinician |
| GET | `/api/break-glass/:id/visits` | `breakglass.use` — supervisor, clinician |
| GET | `/api/break-glass/mine` | `breakglass.use` — supervisor, clinician |

## /api/client-sync-issue

| Method | Path | Access |
|---|---|---|
| POST | `/api/client-sync-issue` | Any signed-in user (finer rules are checked inside the operation) |

## /api/config

| Method | Path | Access |
|---|---|---|
| GET | `/api/config` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/config/appointment_categories` | `config.manage` — admin |
| PATCH | `/api/config/appointment_categories/:id` | `config.manage` — admin |
| POST | `/api/config/cpt_codes` | `config.manage` — admin |
| PATCH | `/api/config/cpt_codes/:id` | `config.manage` — admin |
| POST | `/api/config/departments` | `config.manage` — admin |
| PATCH | `/api/config/departments/:id` | `config.manage` — admin |
| POST | `/api/config/rooms` | `config.manage` — admin |
| PATCH | `/api/config/rooms/:id` | `config.manage` — admin |
| POST | `/api/config/schedule_columns` | `config.manage` — admin |
| PATCH | `/api/config/schedule_columns/:id` | `config.manage` — admin |
| POST | `/api/config/schedule_groups` | `config.manage` — admin |
| PATCH | `/api/config/schedule_groups/:id` | `config.manage` — admin |
| POST | `/api/config/schedule_rows` | `config.manage` — admin |
| PATCH | `/api/config/schedule_rows/:id` | `config.manage` — admin |
| POST | `/api/config/services` | `config.manage` — admin |
| PATCH | `/api/config/services/:id` | `config.manage` — admin |
| PATCH | `/api/config/settings` | `config.manage` — admin |
| POST | `/api/config/staff` | `config.manage` — admin |
| PATCH | `/api/config/staff/:id` | `config.manage` — admin |
| POST | `/api/config/stations` | `config.manage` — admin |
| PATCH | `/api/config/stations/:id` | `config.manage` — admin |

## /api/corrections

| Method | Path | Access |
|---|---|---|
| GET | `/api/corrections` | `corrections.request` — admin, supervisor, reception, clinician |
| POST | `/api/corrections` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/corrections/:id/decision` | Any signed-in user (finer rules are checked inside the operation) |

## /api/health

| Method | Path | Access |
|---|---|---|
| GET | `/api/health` | `health.view` — admin |

## /api/login

| Method | Path | Access |
|---|---|---|
| POST | `/api/login` | Public (no sign-in) |
| POST | `/api/login/mfa` | Public (no sign-in) |

## /api/logout

| Method | Path | Access |
|---|---|---|
| POST | `/api/logout` | Any signed-in user (finer rules are checked inside the operation) |

## /api/me

| Method | Path | Access |
|---|---|---|
| GET | `/api/me` | Any signed-in user (finer rules are checked inside the operation) |

## /api/mfa

| Method | Path | Access |
|---|---|---|
| POST | `/api/mfa/confirm` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/mfa/disable` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/mfa/recovery-codes` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/mfa/setup` | Any signed-in user (finer rules are checked inside the operation) |
| GET | `/api/mfa/status` | Any signed-in user (finer rules are checked inside the operation) |

## /api/patients

| Method | Path | Access |
|---|---|---|
| GET | `/api/patients` | `patients.read` — admin, supervisor, reception, clinician |
| POST | `/api/patients` | `patients.write` — admin, reception |
| PATCH | `/api/patients/:id` | `patients.write` — admin, reception |
| GET | `/api/patients/:id/changes` | `patients.write` — admin, reception |
| GET | `/api/patients/:id/history` | `patients.read` — admin, supervisor, reception, clinician |
| POST | `/api/patients/:id/move-bookings` | `patients.link.propose` — admin, supervisor |
| GET | `/api/patients/duplicate-candidates` | `patients.link.propose` — admin, supervisor |
| POST | `/api/patients/flag-duplicate` | `patients.link.flag` — admin, supervisor, reception |
| POST | `/api/patients/flags/:id/dismiss` | `patients.link.propose` — admin, supervisor |
| GET | `/api/patients/links` | `patients.link.propose` — admin, supervisor |
| POST | `/api/patients/links` | `patients.link.propose` — admin, supervisor |
| POST | `/api/patients/links/:id/approve` | `patients.link.approve` — admin, supervisor |
| POST | `/api/patients/links/:id/reject` | `patients.link.propose` — admin, supervisor |
| POST | `/api/patients/links/:id/undo` | `patients.link.undo` — admin |

## /api/queue

| Method | Path | Access |
|---|---|---|
| GET | `/api/queue` | `queue.view` — admin, supervisor, reception, clinician |
| POST | `/api/queue/:id/cancel` | `queue.cancel` — admin, supervisor, reception |
| PATCH | `/api/queue/:id/priority` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/queue/call-next` | Any signed-in user (finer rules are checked inside the operation) |

## /api/recovery-request

| Method | Path | Access |
|---|---|---|
| POST | `/api/recovery-request` | Public (no sign-in) |

## /api/registrations

| Method | Path | Access |
|---|---|---|
| POST | `/api/registrations` | `patients.write` — admin, reception |

## /api/reports

| Method | Path | Access |
|---|---|---|
| GET | `/api/reports` | `reports.view` — admin, supervisor |
| GET | `/api/reports/sessions.csv` | `reports.view` — admin, supervisor |

## /api/rooms

| Method | Path | Access |
|---|---|---|
| GET | `/api/rooms/:id/history` | `room.maintenance` — admin, supervisor |
| PUT | `/api/rooms/:id/status` | Any signed-in user (finer rules are checked inside the operation) |

## /api/schedule

| Method | Path | Access |
|---|---|---|
| GET | `/api/schedule` | `patients.read` — admin, supervisor, reception, clinician |
| POST | `/api/schedule/appointments` | `schedule.manage` — admin, supervisor, reception |
| PATCH | `/api/schedule/appointments/:id` | `schedule.manage` — admin, supervisor, reception |
| POST | `/api/schedule/appointments/:id/arrive` | `visit.manage` — admin, supervisor, reception |
| POST | `/api/schedule/appointments/:id/cancel` | `schedule.manage` — admin, supervisor, reception |
| GET | `/api/schedule/appointments/:id/history` | `schedule.view` — admin, supervisor, reception, clinician |
| POST | `/api/schedule/blocks` | `schedule.block` — admin, supervisor |
| POST | `/api/schedule/blocks/:id/remove` | `schedule.block` — admin, supervisor |
| GET | `/api/schedule/board` | `schedule.view` — admin, supervisor, reception, clinician |
| GET | `/api/schedule/cancellations` | `schedule.view` — admin, supervisor, reception, clinician |
| POST | `/api/schedule/columns/:id/remove` | `config.manage` — admin |
| POST | `/api/schedule/columns/bulk` | `config.manage` — admin |
| POST | `/api/schedule/groups/:id/sync-staff` | `config.manage` — admin |
| POST | `/api/schedule/print` | `schedule.view` — admin, supervisor, reception, clinician |
| POST | `/api/schedule/rows/:id/remove` | `config.manage` — admin |
| POST | `/api/schedule/rows/reorder` | `config.manage` — admin |
| POST | `/api/schedule/setup` | `config.manage` — admin |
| GET | `/api/schedule/tasks` | `schedule.view` — admin, supervisor, reception, clinician |
| POST | `/api/schedule/tasks` | `schedule.manage` — admin, supervisor, reception |
| PATCH | `/api/schedule/tasks/:id` | `schedule.manage` — admin, supervisor, reception |
| GET | `/api/schedule/waiting` | `schedule.view` — admin, supervisor, reception, clinician |
| POST | `/api/schedule/waiting` | `schedule.manage` — admin, supervisor, reception |
| PATCH | `/api/schedule/waiting/:id` | `schedule.manage` — admin, supervisor, reception |

## /api/search

| Method | Path | Access |
|---|---|---|
| GET | `/api/search` | `patients.read` — admin, supervisor, reception, clinician |

## /api/security

| Method | Path | Access |
|---|---|---|
| GET | `/api/security/access-log` | `config.manage` — admin |
| GET | `/api/security/accounts` | `config.manage` — admin |
| GET | `/api/security/alerts` | `config.manage` — admin |
| POST | `/api/security/alerts/:id/ack` | `config.manage` — admin |
| GET | `/api/security/alerts/summary` | `config.manage` — admin |
| GET | `/api/security/audit-chain` | `audit.view` — admin, supervisor |
| GET | `/api/security/break-glass` | `breakglass.review` — admin |
| POST | `/api/security/break-glass/:id/review` | `breakglass.review` — admin |
| GET | `/api/security/login-activity` | `config.manage` — admin |
| GET | `/api/security/permissions` | `config.manage` — admin |
| GET | `/api/security/readiness` | `config.manage` — admin |
| GET | `/api/security/recovery-requests` | `config.manage` — admin |
| POST | `/api/security/recovery-requests/:id/resolve` | `config.manage` — admin |
| POST | `/api/security/users/:id/reset-mfa` | `config.manage` — admin |
| POST | `/api/security/users/:id/reset-password` | `config.manage` — admin |
| POST | `/api/security/users/:id/revoke-sessions` | `config.manage` — admin |
| POST | `/api/security/users/:id/username` | `config.manage` — admin |

## /api/sessions

| Method | Path | Access |
|---|---|---|
| POST | `/api/sessions/:id/complete` | Any signed-in user (finer rules are checked inside the operation) |
| GET | `/api/sessions/:id/documentation` | `patients.read` — admin, supervisor, reception, clinician |
| PUT | `/api/sessions/:id/documentation` | `session.run` — admin, supervisor, clinician |
| POST | `/api/sessions/:id/pause` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/sessions/:id/resume` | Any signed-in user (finer rules are checked inside the operation) |
| GET | `/api/sessions/active` | `patients.read` — admin, supervisor, reception, clinician |

## /api/staff

| Method | Path | Access |
|---|---|---|
| GET | `/api/staff` | Any signed-in user (finer rules are checked inside the operation) |
| PUT | `/api/staff/:id/availability` | Any signed-in user (finer rules are checked inside the operation) |
| GET | `/api/staff/:id/schedule` | Any signed-in user (finer rules are checked inside the operation) |
| PUT | `/api/staff/:id/schedule` | `config.manage` — admin |

## /api/time

| Method | Path | Access |
|---|---|---|
| GET | `/api/time` | Public (no sign-in) |

## /api/visits

| Method | Path | Access |
|---|---|---|
| POST | `/api/visits/:id/checkout` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/visits/:id/room` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/visits/:id/room/enter` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/visits/:id/room/exit` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/visits/:id/room/transfer` | Any signed-in user (finer rules are checked inside the operation) |
| POST | `/api/visits/:id/sessions` | Any signed-in user (finer rules are checked inside the operation) |
| GET | `/api/visits/:id/timeline` | `patients.read` — admin, supervisor, reception, clinician |
| GET | `/api/visits/:id/treatment-options` | `session.run` — admin, supervisor, clinician |
| POST | `/api/visits/checkin` | Any signed-in user (finer rules are checked inside the operation) |
| GET | `/api/visits/open` | `patients.read` — admin, supervisor, reception, clinician |
