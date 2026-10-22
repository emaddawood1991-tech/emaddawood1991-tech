# Recon map: MeetNow (web, single static page)

Scope: the whole app. A one-page guest booking widget: pick a weekday, pick a 30 min slot, enter name and email, confirm.
For: the user's own test app (owner-supplied, local), used as a test target for the replica pipeline.
Date: 2026-10-22

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | the app itself, HTML/CSS/JS read via curl | http://localhost:8123/index.html | user owns it and asked for source reading. Python SimpleHTTP, 3225 bytes, one inline script, no other requests |
| 2 | help center, pricing, changelog, API docs | none | do not exist for a local test app |

No screenshots were taken, so `replica/screens/` is empty. Layout was inferred from the CSS (single 420px card, 5-column day grid, 3-column slot grid). Capture the states there before replica-diff if a visual comparison is needed.

## Core loop

A guest picks a time from a fixed weekly grid and confirms it with a name and email.

## Screens

One page. S02 to S04 are states of that page, listed separately so flows can refer to them.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Booking page, day picker | `/index.html` | choose a weekday | title "MeetNow", subtitle with detected time zone, 5 day buttons (Mon-Fri) | initial (no day, no slots shown), day selected |
| S02 | Slot picker | same page, after a day is clicked | choose a time | 9 slot buttons in a 3-column grid (09:00-11:30, 14:00-15:00) | filled, some slots disabled (booked), one slot selected |
| S03 | Details form | same page, after a slot is clicked | enter guest details | name input, email input, "Confirm booking" button | shown, hidden |
| S04 | Result message | same page, below the form | feedback | `.msg` line | validation error (red), slot-taken error (red), success (green) |

Not present: empty state, loading state, server error, permission denied, host view, confirmation page, cancel or reschedule view. Mobile uses the same layout (max-width 420px, centred, viewport meta set).

## Flows

```
F01 Guest books a meeting
    S01 pick day -> S02 pick slot -> S03 fill name + email, Confirm -> S04 success
    happy path clicks: 3 (day, slot, Confirm) plus typing in two fields
    edge: empty name or bad email -> red message, form stays
    edge: slot already in the taken list at submit -> "That time was just taken. Pick another."
    edge: choosing another day after picking a slot clears the slot and hides the form
    edge: after success the form hides, the grid redraws with the booked slot disabled, the day stays selected

F02 Guest books a second slot in the same session
    S04 -> S02 (same day still selected) -> S03 -> S04
    note: the success message stays until the next submit; name and email stay filled
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button (outline blue) | day button, slot button | default, `on` (filled blue), disabled (35% opacity, not-allowed cursor). No custom hover or focus styling | S01, S02 |
| Button (primary) `.go` | full width | default | S03 |
| Text input | name, email | default only; placeholder instead of label; no focus or error styling | S03 |
| Card | one | n/a | whole page |
| Inline message `.msg` | `.err` red, `.ok` green | empty, error, success | S04 |
| Grid | days 5 cols, slots 3 cols | n/a | S01, S02 |

Design tokens: ink #0f172a, bg #f1f5f9, card #fff, blue #2563eb, muted #64748b, 16px card radius, 10px control radius, system-ui font.

## Inferred data model

```
Slot     day (Mon..Fri), time (one of 9 fixed values), duration 30 min (from the title)
         evidence: JS constants D and T, page title
         confidence: high
         note: no calendar dates. "Mon" means every Monday.

Booking  key "<day> <time>", guest_name, guest_email
         evidence: S03 form, S04 success text
         confidence: medium
         note: the app stores only the key string in localStorage["mn"]. Name and email are validated, then discarded. The clone must decide whether to persist them.
```

Relationships: Slot 1-0..1 Booking. There is no User, EventType, Host or Availability entity; availability is hard-coded.

## Feature matrix

See `features.csv`. Must: 8, should: 5, could: 3, skip: 3. Rows with original=no are gaps in the original, listed so the clone can choose whether to add them.

## Quirks in the original (do not copy blindly)

- The first `f.onsubmit` assignment references `e0`, which does not exist. It is overwritten by the second assignment straight away, so it is dead code.
- Booked state lives in the guest's own localStorage. Two browsers can book the same slot. The "just taken" check reads an in-memory copy loaded at page load, so a booking made in another tab is not seen until reload.
- The time zone is displayed but not applied. Slot times are fixed strings.
- The email check is a loose `x@y` regex.
- Error and success messages are not cleared when the guest picks another day or slot.
- Days are weekday names only, with no dates and no past-slot logic.

## Out of scope (cannot or should not be cloned)

- Nothing is licensed or network-dependent. Host login, calendar sync and payments are not in the original, so they are `skip` rows in the matrix.

## Size

Screens 4 (one page), flows 2, entities 2. Hard parts: (1) a shared store so double-booking is actually prevented, (2) real time zone conversion, (3) confirmation email. Size: S for a faithful copy (a weekend or less); M if the missing server features are added.
