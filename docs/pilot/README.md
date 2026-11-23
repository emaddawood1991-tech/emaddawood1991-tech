# Pilot rehearsal pack — supervised trial with synthetic patients

Purpose: let the real people who will use FMC Patient Flow try it for one supervised day **before** any real patient data is entered, and collect what confuses them. Nothing here is a compliance claim; the trial system holds **synthetic data only**.

## What is in this folder
| File | Use |
|---|---|
| `guides/<role>-en.html` / `-ar.html` and `pdf/…` | One-page A4 guide per role — reception, clinician, manager, administrator — in English and Arabic (right-to-left). Print and hand out. |
| `guides/feedback-en.html` / `-ar.html` and `pdf/…` | One-page feedback sheet, one per person per day. |
| `TRIAL_DAY_SCRIPT.md` / `_AR.md` | The trial-day script: 16 steps, who does what, and the result you should see. An automated rehearsal of the same script runs in the test suite (`tests/trialday.test.js`). |

Regenerate the printable pages after editing `fmc-flow/pilot/content.json`: `cd fmc-flow && NODE_PATH=$(npm root -g) node tests/e2e-pilot-pack.cjs` (it also checks that every page still fits on one sheet).

## Ground rules
1. **Synthetic data only.** Use made-up names, numbers and dates. Never a real patient, even "just to test".
2. The trial runs on its **own instance and database**, never the production one.
3. Nobody is graded. We want to hear what was slow, confusing, wrong or missing.
4. If you are blocked for more than two minutes: write the step and screen on the feedback sheet and move on.

## Before the day (trial lead, about 30 minutes)
1. On a spare machine or server: `cd fmc-flow && npm ci && npm run build`.
2. Start a **trial instance with demo data** (leave `NODE_ENV` unset; use a fresh file): `FMC_DB=/srv/fmc-trial/trial.db PORT=3000 npm start`. It creates the sample departments, staff and patients automatically.
3. Sign-in names (trial only): `reception`, `pt.one` / `pt.two` (physiotherapists), `dr.ort` (orthopedic doctor), `super` (clinic manager), `admin` (administrator), plus `gm.one`, `nr.one`, `si.one`, `rh.one`. All share the published demo password; give it out on the day, not on paper. Everyone changes nothing unless asked.
4. Print per attendee: the guide for their role (English or Arabic) and one feedback sheet. Print the trial-day script once for the reader.
5. Check the clock and the language buttons work, and that the screen is readable from the back of the room.

## Suggested schedule (half a day)
| Time | What |
|---|---|
| 0:00 | Welcome, ground rules, hand out guides (15 min) |
| 0:15 | Each person signs in and reads their guide (15 min) |
| 0:30 | Trial-day script steps 0–7 (45 min; step 6 needs 5 quiet minutes) |
| 1:15 | Break |
| 1:30 | Steps 8–14 (60 min) |
| 2:30 | Feedback sheets; one group discussion: what was the worst moment? (30 min) |

## After the day: sort the feedback
- Mark every problem **A** (blocks work), **B** (slows down), **C** (annoyance). Merge duplicates; count how many people hit each.
- **Ready to go on to a larger trial when:** all 16 steps passed or have a known fix, **no open A**, most tasks rated Easy/OK, and most people answered “Yes” or “With changes” to daily use.
- **Stop and fix first if:** any A problem, any wrong or missing clinical information, or anyone could see data they should not.
- Real patient data is still not allowed until `fmc-flow/docs/GO_LIVE_RUNBOOK.md` section 8 is complete and the owner has signed off in writing.

## Reset
Stop the trial instance, delete its database file, start it again: you get the original synthetic data. Nothing from the trial reaches production.
