# FMC Patient Flow & Room Management

Web application (installable-style SPA + API) for Al-Faisal Medical Centre: patient queue, room/station occupancy, treatment sessions, timeline, corrections, staff availability, reports, audit, system health. Arabic/English with RTL. **Development build — synthetic data only. No regulatory compliance is claimed; see `docs/BACKUP_AND_RECOVERY.md` and the checklist in `/docs`.**

## Run
```bash
cd fmc-flow
npm install
npm run build        # builds the React app into dist/
npm start            # API + app on http://localhost:3000 (seeds synthetic data on first run)
npm test             # 23 backend tests (workflows, permissions, concurrency, integrity, backup)
```
**Easiest:** Windows double-click `run-local.bat`; Mac/Linux run `./run-local.sh` (needs Node 22+). It installs, builds and opens http://localhost:3000.

Dev with hot reload: `npm run dev:api` and `npm run dev:web` (Vite proxies `/api`).
Browser smoke test (server running): `NODE_PATH=$(npm root -g) node tests/e2e-smoke.cjs http://localhost:3000 ./shots`.

Synthetic logins (password from `SEED_PASSWORD`, default `Demo-Passw0rd!` — **dev only**): `admin`, `super`, `reception`, `dr.ort`, `pt.one`, `pt.two`, `gm.one`, `nr.one`, `si.one`, `rh.one`.
Use `FMC_INSECURE_COOKIES=1` only when serving over plain http on a non-localhost host (cookies are `Secure` by default).

## Architecture
- **Server**: Node 22 + Express + `node:sqlite` (WAL). One authoritative clock: every event timestamp is generated server-side; client-supplied times are ignored.
- **Integrity in the database**: `events`, `audit_log`, `room_status_history` are append-only (UPDATE/DELETE blocked by triggers). Unique partial indexes prevent station double-booking, two open rooms per visit, duplicate open sessions and duplicate queue entries. Every write runs in an `IMMEDIATE` transaction.
- **Corrections** never overwrite: the original timestamp stays; an approved correction stores `*_corrected`, reports use the corrected value, and the timeline shows both. Approver must differ from requester.
- **Recovery**: the UI holds no authoritative state. Timers derive from server timestamps; session start uses an idempotency key. Offline → banner, actions refused, nothing queued or timestamped locally.
- **Dynamic config**: departments, rooms, stations, services, staff, queue numbering and policies live in the database and are edited under Settings. No department/room/service names exist in application code (only in `server/seed.js` synthetic data).
- **Permissions**: role matrix in `server/perms.js` + department scoping on every visit/queue/search/report read. Service authorization (`staff_services`) is independent of availability status.

## Layout
`server/` API, rules, seed, backup · `src/` React app · `tests/` backend + browser tests · `docs/` operations notes.

## Reception registration
Visits → **New patient**: MRN (manual, uniqueness-checked and never overwritten, or auto-generated), English/Arabic full name, date of birth (stored as a plain date), gender (configurable), contact number (UAE formats and international `+` numbers normalised to E.164), department and service (dynamic, filtered). **Save & check in** creates patient + visit + department queue entry atomically; a per-form idempotency key makes double-clicks safe. Search by MRN, English/Arabic name or phone. Requirements (Arabic name, phone, service at check-in) and gender options are set under Settings → Policy. Departments are never stored on the patient — they belong to the visit/queue entry/appointment. Discontinued OT and Speech Therapy are deactivated (not deleted) by a one-time catalog migration (`server/seed.js`).
Tests: `npm test` (40) · `node tests/e2e-registration.cjs http://localhost:3000` (browser).

## Start treatment
The window loads `GET /api/visits/:id/treatment-options`: the visit's department(s), their **active** services only, and for each service the clinicians explicitly authorized for it. Clinicians start as themselves (unauthorized services are labelled and explained). Supervisors and administrators have **no** clinical authorization of their own; they can only start treatment *on behalf of* an explicitly authorized clinician, and the audit log and timeline record who acted. The server enforces everything again (department match, authorization, room entry) with actionable messages. Authorizations are managed under Settings → Staff (grouped by department); Settings → Services shows who is authorized per service and flags services nobody can deliver. Changes are audited as `config.staff.authorization`.
Tests: `npm test` (48) · `node tests/e2e-treatment.cjs http://localhost:3100` on a fresh database.
