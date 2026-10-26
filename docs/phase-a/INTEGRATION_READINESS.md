# Integration-readiness assessment (Phase A — nothing activated)

## 1. Existing integration capabilities
- An internal JSON/REST API (47 routes) used only by the FMC web interface; browser-session cookie authentication + `X-Requested-With` CSRF header. **No machine-to-machine authentication.**
- Idempotency keys for patient registration/check-in and treatment start (`idempotency_keys`, `treatment_sessions.idem_key`).
- Append-only audit log and event timeline (internal events only).
- CSV export of treatment sessions.
- Encrypted database backup/restore.
**Not present:** FHIR, HL7, webhooks, import services, external-identifier tables, outbound queue/retry, API keys, service accounts, rate limits per client, integration audit, conflict handling, any outbound network call.

## 2. Missing components
1. **Patient identity:** the `patients` table has an integer primary key and a `mrn` unique within FMC. No immutable external-safe identifier (add `patient_uid` UUID), no cross-system identifier mapping.
2. `external_systems` (name, type, base URL, auth method, status, approved-by, approved-on, data-sharing agreement reference, enabled=false by default).
3. `external_identifiers` (system, resource type [patient|appointment|visit|practitioner|location|service], internal id, external id, assigner, valid-from; unique per system+type+external id).
4. `integration_outbox` / `integration_inbox` (idempotency key, direction, payload hash, status, attempts, next_retry_at, last_error, correlation id) with dead-letter state.
5. `integration_audit` (who/what/when, system, resource ids, outcome — never full payloads by default).
6. Service accounts and scoped API credentials (separate from staff users), per-system secrets in a secret manager, rotation.
7. Conflict detection and reconciliation queue (same person/different MRN, differing demographics, appointment mismatches) with a human review screen.
8. Terminology mapping (services ↔ billing/insurance codes; departments ↔ clinic codes) — configurable, not hard-coded.
9. Consent/data-sharing flags per patient and per system.

## 3. Recommended architecture (for approval)
- **Keep one source of truth for each fact.** FMC owns patient flow (queue, rooms, treatment times). The EMR/clinic-management system owns the clinical record unless FMC is told otherwise. No second copy of demographics without a documented identity strategy.
- **Integration module inside the existing server** (not a new application): adapters per external system behind a common interface; adapters disabled until approved.
- **Inbound:** REST endpoints under `/integration/v1/*` for service accounts only (OAuth2 client-credentials or mTLS-bound API keys), HMAC-signed webhooks, idempotency header required, strict JSON-schema validation, per-client rate limits.
- **Outbound:** transactional outbox → worker with exponential back-off, circuit breaker, dead-letter queue, replay by administrators.
- **Standards:** FHIR R4 façade (Patient, Appointment, Encounter, Location, Practitioner, Schedule/Slot as supported) — read-first, write only after verification; HL7 v2 (ADT^A04/A01/A03, SIU) through a certified interface engine if a counterpart requires it; flat-file/CSV import-export for systems without APIs.
- **Identity:** `patient_uid` immutable; `mrn` stays FMC-scoped; every external MRN/Emirates-ID-style number stored as a mapped identifier with its assigning authority; matching rules configurable; ambiguous matches go to a review queue, never auto-merge.
- **Privacy:** data minimisation per system; field-level allow-lists; integration traffic only over TLS 1.2+ (mutual TLS where supported); all exchanges audited; no PHI to unapproved hosting or AI services.
- **Healthcare information exchange:** Abu Dhabi's Malaffi is reported as mandatory for DoH-licensed facilities (secondary source; confirm). Treat it as an approved-integration project with DoH onboarding, not an ad-hoc connector.

## 4. Security requirements
Service-account authentication (not staff cookies) · least-privilege scopes per client · secrets only in a secret manager · signed + replay-protected webhooks · request size/time limits · full integration audit · UAE-resident hosting for any component that stores or processes health data (see compliance classification) · incident response and 24 h breach-notification path (reported DoH requirement, confirm) · penetration test before go-live · kill switch per integration.

## 5. External information needed from FMC (nothing is assumed)
For each system (clinic management software, EMR, appointments, billing, insurance, reporting, Malaffi): product name/version/vendor; whether it exposes an API (FHIR/HL7/REST/SOAP/file) **with vendor documentation**; sandbox/test environment; authentication method; who is the system of record for patients, appointments and clinical notes; patient-identifier format and assigning authority; the data FMC may send and receive; legal basis and data-sharing agreement; hosting location; vendor security contact; timeline and DoH approvals.

## 6. Changes requiring approval
Database additions (new tables above) and the `patient_uid` migration · any decision between SQLite and PostgreSQL (decision E-2) · hosting/data residency (E-1) · authentication provider and service-account model (E-3) · integration module scope and order · enabling any external connection · sharing any patient data · real patient data in test environments.

**Status: no integration is active, none will be activated automatically, and no external endpoint has been invented.**
