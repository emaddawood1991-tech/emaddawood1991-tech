# Build log: SlotNest

| ID | date | status | missing | harder than expected |
| --- | --- | --- | --- | --- |
| S01 Day picker | 2026-10-22 | done | none | none |
| S02 Slot picker | 2026-10-22 | done | none | none |
| S03 Details form | 2026-10-22 | done | none | none |
| S04 Result message | 2026-10-22 | done | none | none |

Whole app is one file: `clone/index.html` (plain HTML/CSS/JS, no external requests). Colours, radii and spacing are tokens on `:root`; components use only `var(--...)`.

## Not done / partial
- **Double-booking prevention is partial.** Bookings live in this browser's localStorage, so two different guests can still book the same slot. A real fix needs a server. The `store` object (`listDays`, `listSlots`, `listBookings`, `createBooking`) is async and shaped like a backend client, so replica-backend can replace it without touching screen code. This was bigger than it looks and is not done.
- Time zone is displayed, not applied (same as the original, and a `should` gap).
- Calendar dates, email, and cancel/reschedule were not built (`could`).

## Checks
- Not run: screenshots in `replica/clone-screens/`, console check, 390px and 1440px viewport check. No browser was available or approved in this session, and the original has no reference screenshots either. Keyboard flow is built (radio groups, labelled inputs, visible focus) but not exercised by a test.
- Must-haves: 7 of 8 done, 1 partial (shared persistence).
