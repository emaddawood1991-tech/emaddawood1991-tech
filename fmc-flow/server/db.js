import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const DB_PATH = process.env.FMC_DB || new URL('../data/fmc.db', import.meta.url).pathname;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, name_ar TEXT NOT NULL DEFAULT '',
  queue_prefix TEXT NOT NULL, queue_start INTEGER NOT NULL DEFAULT 1,
  queue_reset_daily INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(name)
);
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY, department_id INTEGER NOT NULL REFERENCES departments(id),
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, name_ar TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE','CLEANING','MAINTENANCE','OUT_OF_SERVICE')),
  status_reason TEXT, cleaning_after_use INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES rooms(id),
  code TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, UNIQUE(room_id, code)
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY, department_id INTEGER NOT NULL REFERENCES departments(id),
  name TEXT NOT NULL, name_ar TEXT NOT NULL DEFAULT '',
  default_minutes INTEGER NOT NULL DEFAULT 30, active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, name_ar TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('admin','supervisor','reception','clinician')),
  department_id INTEGER REFERENCES departments(id), pass_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS staff_services (
  user_id INTEGER NOT NULL REFERENCES users(id), service_id INTEGER NOT NULL REFERENCES services(id),
  PRIMARY KEY (user_id, service_id)
);
CREATE TABLE IF NOT EXISTS staff_schedules (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6), start_time TEXT NOT NULL, end_time TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS staff_availability (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'OFF_DUTY'
    CHECK (status IN ('AVAILABLE','BUSY','ON_BREAK','OFF_DUTY','UNAVAILABLE')),
  updated_at TEXT NOT NULL, updated_by INTEGER
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL, last_seen TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY, mrn TEXT NOT NULL UNIQUE, name TEXT NOT NULL, name_ar TEXT NOT NULL DEFAULT '',
  dob TEXT, sex TEXT, phone TEXT, synthetic INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY, ref TEXT NOT NULL UNIQUE, patient_id INTEGER NOT NULL REFERENCES patients(id),
  department_id INTEGER NOT NULL REFERENCES departments(id), service_id INTEGER REFERENCES services(id),
  clinician_id INTEGER REFERENCES users(id), scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','ARRIVED','CANCELLED','NO_SHOW')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id),
  appointment_id INTEGER REFERENCES appointments(id),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CHECKED_OUT')),
  arrived_at TEXT NOT NULL, departed_at TEXT, departed_at_corrected TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_visit_per_patient ON visits(patient_id) WHERE status='OPEN';

CREATE TABLE IF NOT EXISTS queue_counters (
  department_id INTEGER NOT NULL, day TEXT NOT NULL, last INTEGER NOT NULL, PRIMARY KEY (department_id, day)
);
CREATE TABLE IF NOT EXISTS queue_entries (
  id INTEGER PRIMARY KEY, visit_id INTEGER NOT NULL REFERENCES visits(id),
  department_id INTEGER NOT NULL REFERENCES departments(id), number INTEGER NOT NULL, display TEXT NOT NULL,
  clinician_id INTEGER REFERENCES users(id), service_id INTEGER REFERENCES services(id),
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority IN (0,1,2)), priority_reason TEXT,
  status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING','CALLED','IN_ROOM','DONE','CANCELLED')),
  created_at TEXT NOT NULL, called_at TEXT, closed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_queue_per_visit_dept
  ON queue_entries(visit_id, department_id) WHERE status IN ('WAITING','CALLED','IN_ROOM');

CREATE TABLE IF NOT EXISTS occupancy (
  id INTEGER PRIMARY KEY, visit_id INTEGER NOT NULL REFERENCES visits(id),
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id), station_id INTEGER REFERENCES stations(id),
  assigned_at TEXT NOT NULL, assigned_by INTEGER, entered_at TEXT,
  exited_at TEXT, exited_at_corrected TEXT, exit_reason TEXT CHECK (exit_reason IN ('EXIT','TRANSFER')),
  transferred_from INTEGER REFERENCES occupancy(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_occupancy_per_visit ON occupancy(visit_id) WHERE exited_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS one_open_occupancy_per_station ON occupancy(station_id)
  WHERE station_id IS NOT NULL AND exited_at IS NULL;

CREATE TABLE IF NOT EXISTS treatment_sessions (
  id INTEGER PRIMARY KEY, idem_key TEXT UNIQUE,
  visit_id INTEGER NOT NULL REFERENCES visits(id), patient_id INTEGER NOT NULL REFERENCES patients(id),
  service_id INTEGER NOT NULL REFERENCES services(id), clinician_id INTEGER NOT NULL REFERENCES users(id),
  room_id INTEGER REFERENCES rooms(id), station_id INTEGER REFERENCES stations(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','COMPLETED')),
  started_at TEXT NOT NULL, ended_at TEXT, ended_at_corrected TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_session_per_service ON treatment_sessions(visit_id, service_id, clinician_id)
  WHERE status IN ('ACTIVE','PAUSED');
-- Approved procedure (CPT) codes. Entered and maintained by an administrator; the application ships no code list.
CREATE TABLE IF NOT EXISTS cpt_codes (
  id INTEGER PRIMARY KEY, code TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  department_id INTEGER REFERENCES departments(id), default_minutes INTEGER NOT NULL DEFAULT 30, active INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS cpt_code_upper ON cpt_codes(upper(code));
-- Clinical documentation for a treatment session. Only saved rows exist here, so an unsaved draft can never count.
CREATE TABLE IF NOT EXISTS session_documentation (
  session_id INTEGER PRIMARY KEY REFERENCES treatment_sessions(id),
  chief_complaint TEXT NOT NULL DEFAULT '', diagnosis TEXT NOT NULL DEFAULT '', cpt_code_id INTEGER REFERENCES cpt_codes(id), progress_note TEXT NOT NULL DEFAULT '',
  saved_by INTEGER REFERENCES users(id), saved_at TEXT NOT NULL, complete_since TEXT
);
CREATE TABLE IF NOT EXISTS session_pauses (
  id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES treatment_sessions(id),
  paused_at TEXT NOT NULL, resumed_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY, visit_id INTEGER NOT NULL, patient_id INTEGER NOT NULL,
  type TEXT NOT NULL, ts TEXT NOT NULL, actor_id INTEGER, session_id INTEGER, occupancy_id INTEGER,
  data TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS events_visit ON events(visit_id, id);

CREATE TABLE IF NOT EXISTS corrections (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('SESSION_END','ROOM_EXIT','CLINIC_DEPARTURE')),
  entity_id INTEGER NOT NULL, visit_id INTEGER NOT NULL,
  original_ts TEXT NOT NULL, corrected_ts TEXT NOT NULL, reason TEXT NOT NULL,
  requested_by INTEGER NOT NULL, requested_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  decided_by INTEGER, decided_at TEXT, decision_note TEXT
);
CREATE TABLE IF NOT EXISTS room_status_history (
  id INTEGER PRIMARY KEY, room_id INTEGER NOT NULL, from_status TEXT, to_status TEXT NOT NULL,
  reason TEXT, actor_id INTEGER, ts TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY, ts TEXT NOT NULL, actor_id INTEGER, action TEXT NOT NULL,
  entity TEXT, entity_id TEXT, detail TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS system_errors (
  id INTEGER PRIMARY KEY, ts TEXT NOT NULL, source TEXT NOT NULL, code TEXT, message TEXT
);
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY, scope TEXT NOT NULL, response TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS patients_mrn_upper ON patients(upper(mrn));
CREATE TABLE IF NOT EXISTS backup_log (
  id INTEGER PRIMARY KEY, ts TEXT NOT NULL, file TEXT, bytes INTEGER, ok INTEGER NOT NULL, note TEXT
);

-- Append-only guarantees (enforced in the database, not just the API)
CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events
  BEGIN SELECT RAISE(ABORT, 'events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events
  BEGIN SELECT RAISE(ABORT, 'events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_log
  BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_log
  BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS room_hist_no_update BEFORE UPDATE ON room_status_history
  BEGIN SELECT RAISE(ABORT, 'room history is append-only'); END;
CREATE TRIGGER IF NOT EXISTS room_hist_no_delete BEFORE DELETE ON room_status_history
  BEGIN SELECT RAISE(ABORT, 'room history is append-only'); END;
`;

export const DEFAULT_SETTINGS = {
  timezone: 'Asia/Dubai',
  correction_requires_approval: '1',
  transfer_reason_required: '0',
  session_idle_hours: '12',
  registration_require_name_ar: '0',
  registration_require_phone: '0',
  require_service_at_checkin: '0',
  timer_auto_close: '1',
  doc_min_chars: '3',
  diagnosis_pattern: '',
  resource_gap_minutes: '1',
  gender_options: JSON.stringify([{ code: 'M', en: 'Male', ar: 'ذكر' }, { code: 'F', en: 'Female', ar: 'أنثى' }]),
};

// Additive, non-destructive column upgrades (safe on existing databases; no data is touched).
const ADDED_COLUMNS = {
  services: { min_minutes: 'INTEGER NOT NULL DEFAULT 5', max_minutes: 'INTEGER NOT NULL DEFAULT 180', allow_override: 'INTEGER NOT NULL DEFAULT 1' },
  treatment_sessions: { planned_minutes: 'INTEGER', scheduled_end_at: 'TEXT', timer_elapsed_at: 'TEXT', confirmed_at: 'TEXT', completion_kind: 'TEXT', planned_cpt_id: 'INTEGER', operational_checkout_at: 'TEXT', operational_checkout_kind: 'TEXT' },
};
function ensureColumns(db) {
  for (const [table, cols] of Object.entries(ADDED_COLUMNS)) {
    const have = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
    for (const [name, def] of Object.entries(cols)) if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
  }
}

export function openDb(path = DB_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  ensureColumns(db);
  const ins = db.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES (?,?)');
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) ins.run(k, v);
  // One-time: automatic stop + check-out at the scheduled end is now the default. Databases created earlier hold the old default ('0');
  // switch them over only if no administrator ever changed that setting, so a deliberate choice is never overwritten.
  if (!db.prepare("SELECT 1 x FROM settings WHERE key='timer_auto_close_default_v2'").get()) {
    const chosen = db.prepare("SELECT 1 x FROM audit_log WHERE action='config.settings' AND entity_id='timer_auto_close'").get();
    if (!chosen) db.prepare("UPDATE settings SET value='1' WHERE key='timer_auto_close'").run();
    db.prepare("INSERT INTO settings(key,value) VALUES ('timer_auto_close_default_v2','1')").run();
  }
  return db;
}

const depth = new WeakMap();
/** Run fn inside an IMMEDIATE transaction (nested calls become savepoints); rolls back on any throw. */
export function tx(db, fn) {
  const d = depth.get(db) || 0;
  const sp = `sp${d}`;
  db.exec(d === 0 ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${sp}`);
  depth.set(db, d + 1);
  try {
    const r = fn();
    db.exec(d === 0 ? 'COMMIT' : `RELEASE ${sp}`);
    return r;
  } catch (e) {
    try { db.exec(d === 0 ? 'ROLLBACK' : `ROLLBACK TO ${sp}; RELEASE ${sp}`); } catch { /* already rolled back */ }
    throw e;
  } finally { depth.set(db, d); }
}
