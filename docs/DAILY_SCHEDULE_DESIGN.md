# Daily Schedule — design, migrations, limits

**Pages:** `Daily Schedule` (new, after Queue) and `Treatment Board` (the earlier "Schedule" page, renamed, unchanged otherwise).

## Model (all additive; nothing existing is altered or deleted)
- `schedule_groups` (a timetable block with its own interval) → `schedule_columns` (start times, any times, ordered by time) and `schedule_rows` (a staff member or a resource, with capacity). Rows are created from existing active staff (`POST /api/schedule/setup`, "Add missing active staff"); administrators add, rename, reorder, hide and safely remove rows and columns. Removing a row that has appointments or blocks is refused (hide it). Staff records are never changed.
- `appointment_categories` (name, Arabic name, colour, default minutes, active) — Settings → Appointment categories. Seeded names and colours only; no durations are hardcoded.
- `appointments` gains: `duration_minutes, ends_at, category_id, notes, row_id, recurrence_id, cancel_reason, cancelled_at, cancelled_by, rebooks_id, created_by, updated_at`. The old table, API and check-in link are untouched; appointments without a row appear on the board by clinician.
- `appointment_history` (append-only), `schedule_blocks` (breaks/leave/meetings/maintenance; deactivated, never deleted), `waiting_list`, `schedule_tasks` (follow-up, approval, rejection, for-doctor, evaluation), `users.schedule_override`.
- Settings: `schedule_default_minutes` (30).

## Rules
- Times are entered and shown in the clinic time zone (Asia/Dubai) and stored in UTC.
- Overlaps are refused for the same patient, the same clinician and the same exclusive row; a row with capacity N allows N at once. A booking that starts when another ends is allowed.
- Blocked periods refuse ordinary booking. Only an administrator, or a supervisor an administrator marked "may override blocked periods", can override, with a reason; it is audited and kept in the appointment history.
- Recurrence: daily or weekly, end date or count, at most 52. All-or-nothing, or "skip conflicting dates".
- Creating an appointment never starts a treatment timer. "Mark arrived" calls the existing check-in (visit + queue) and is allowed only on the appointment day.
- Permissions: view = all roles (department-scoped); book/edit/cancel/waiting/tasks = administrator, supervisor, reception; breaks = administrator, supervisor; layout/categories = administrator.

## Limits
- Editing or cancelling affects one occurrence of a recurring series.
- The five call-list types are fixed in code (labels are translated).
- The standalone demo keeps data in the browser only.
- Rollback: tag `checkpoint/pre-daily-schedule-9ef49c5`.
