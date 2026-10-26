# Waiting time and treatment countdown — design note

- **Arrival** is the backend timestamp of check-in. Waiting before room, waiting in room and total waiting are derived from stored timestamps (`visitTiming` in `server/ops.js`), never from a browser stopwatch.
- **Planned duration**: whole minutes entered at Start Treatment (`planned_minutes`). Per service, admins set default / minimum / maximum and whether clinicians may override (Settings → Services).
- **Scheduled end** = start + planned *active* time. Pause stops the clock; resume recalculates the end.
- **Elapsed**: `sweepTimers()` (before reads/actions and every 10 s on the server) records `TIMER_ELAPSED` once. It never completes the treatment and never frees the room.
- **Completion** needs clinician confirmation (`completion_kind`: FULL = confirmed at scheduled end, OVERRUN = confirmed later, EARLY = ended before the end, AUTO = optional admin auto-close, flagged unverified with no `confirmed_at`).
- **Persistence**: all state is in `treatment_sessions`; refresh, re-login, other devices and reconnects read the same timestamps. Clients follow the server clock through the `X-Server-Time` header.
- **Tests**: `tests/timers.test.js` (controllable clock) and `tests/e2e-timers.cjs` (`FMC_TEST_CLOCK=1` enables the admin-only `/api/__test/advance-clock`).
- **Limits**: the standalone demo runs the same logic in the browser (not a secure/production system); auto-close is off by default; the old "Complete" button became End early / Confirm completion.
- **Rollback**: commit `8456a18` (tag `checkpoint/pre-timers-8456a18`, local).
