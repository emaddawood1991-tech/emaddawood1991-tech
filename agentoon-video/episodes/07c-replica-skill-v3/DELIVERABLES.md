# Ep 07b — Replica Skill v2 (final, real demos only)

Video: `out/agentoon-ep07-replica-skill-v2.mp4` — 1080x1920, 30 fps, H.264 + AAC, 66.0 s, -15.6 LUFS, true peak -1.2 dBTP, ~158 wpm, no silence >= 1 s, no placeholders (`no-placeholders.sh` PASS).
v1 (`../07-replica-skill`) is untouched. Editable source: `src/index.template.html` + `build.py`, `episode.json`, `cues.json`.

## Narration transcript
1. What if Claude Code could rebuild an entire app?
2. Same booking flow. Brand new app. Built by Claude Code.
3. It starts with Replica Skill. Eleven free Claude skills, MIT licensed, on GitHub.
4. They research, design, build, test, and rebrand an app.
5. Install it in two commands: add the marketplace, then install the plugin.
6. Step one, recon. Claude Code studies the app, and maps its screens, flows, and features.
7. Here, four screens, and a nineteen row feature matrix.
8. Step two, build. It writes a fresh app called SlotNest, with its own colors and its own words.
9. Then the real test. We ran nine browser checks, and all nine passed.
10. The parity check scores one hundred out of one hundred, and the brand sweep found nothing from the original.
11. It is not magic. Shared bookings still need a real server, and a perfect clone is never guaranteed.
12. It can read customer reviews too, but it never invents one. Every quote needs a real link.
13. Follow Agentoon dot A I, for real AI tools, skills, and automation.

## What is real (claim -> file in `data/`)
| On screen | Source |
|---|---|
| Repo name/README lines, 11 skills, MIT | cloned repo, commit 77c9436; `real-install-transcript.txt` |
| marketplace add / plugin install / `Skills (11)` output | `real-install-transcript.txt` (isolated profile, verbatim) |
| Original app (MeetNow) screenshots | `original-meetnow.html` served on localhost, Playwright 390x844 |
| Recon run: tool calls, 9 turns, 4 screens, 2 flows, 19 feature rows | real `claude -p "/replica-recon ..." --plugin-dir` run; `recon.md`, `features.csv` |
| Build run: 11 turns, clone/index.html, build-log | real `claude -p "/replica-build ..."` run; `clone-slotnest.html`, `build-log.md` |
| 9/9 browser checks | `clone-test.mjs`, `clone-test-results.txt` |
| Parity 100/100 (10 counted features, must-haves 7/7) | `parity.txt` (real `replica-diff/parity.py`) |
| Brand sweep clean | `sweep.txt` (real `replica-brand/sweep.py --avoid MeetNow`) |
| "Double-booking prevention is partial" | `build-log.md` (written by the build skill) |
| reviews.py refusal | `real-reviews-empty.txt` |

## Honest notes (what a viewer should not over-read)
- The "original" is a **local test app I wrote** (MeetNow). calendly.com, cal.com and github.com are not reachable from this sandbox, so no commercial site and no github.com page were captured. The GitHub scene shows the real README text from the cloned repo, captioned with its file and URL (no fake GitHub UI).
- Recon read the app's HTML/JS source with curl (the app is local and mine); the skill's normal rule is public pages and your own account only.
- The terminal cards are real `claude -p` (headless) tool-call lines and transcripts re-rendered as text, not a screen recording of the interactive TUI. Interactive TUI recording was not done (first-run onboarding would change your profile).
- The first test run was 8/9: the only failure was my test waiting 300 ms for the app's simulated 250 ms+250 ms backend delay (`clone-test-results-run1.txt`); no app bug. Final run 9/9.
- The build skill wrote one CSV row with unquoted commas; parity.py crashed on it. I only fixed the quoting (`features.raw.csv` is the untouched original). Reported as a tool finding.
- replica-design, architect, backend, entrepreneur, launch and deploy were **not** run; the video says Claude "studies, builds, tests", and the reviews scene shows the real refusal, not real reviews.
- Parity 100/100 counts only features the original has (10); 9 gap rows are listed as "not scored".
- Not used: Remotion, Blender (not needed / not connected). Reference video `1000285633.mp4` and the user's original v1 narration were not needed.
- Usage: two nested Claude Code runs (~$0.30 + ~$0.38 reported by the CLI). One earlier build attempt hit the account's usage limit and was repeated after the reset.

## QC
PASS: resolution/codec/pix_fmt/fps, duration 66 s, loudness -15.6, TP -1.2, silence, wpm 158, no placeholders. Motion mean 4.5, 44 bursts (~40/min); longest burst gap is the final CTA hold. Frames reviewed at every scene and seam; two layout issues found and fixed (clipped title, zoom pushing content under captions).
