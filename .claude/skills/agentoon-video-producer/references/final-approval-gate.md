# FINAL approval gate (PREVIEW vs FINAL)

A video is **FINAL / production-ready** only if ALL of these are true. Otherwise it is a **PREVIEW**: name the file `<name>-PREVIEW.mp4`, say so in the report, and list the exact blockers. Never call an unfinished video "final", "ready" or "production-ready".

## Blockers (any one => PREVIEW)
1. Required real footage missing (real Windows UI for Windows tools, real github.com for GitHub, real Claude Code activity, real site/UI for AI apps, real command output) or any slot not `verified`.
2. Any placeholder or missing-footage label on screen (RECORDING SLOT, REAL ... PENDING, PLACEHOLDER, PREVIEW banner, lorem, TODO).
3. Commands/key text unreadable at 360x640 (mobile-check).
4. A demonstration that is fabricated or simulated without a truthful label; a number not traceable to `data/`.
5. Narration and visuals mismatch (each narrated command/claim appears on screen at that moment).
6. Unfinished scenes (empty areas, dead holds > 2.5 s, missing outro "Follow @agentoon.ai" + "Real AI Tools • Skills • Automation").
7. Visible artifacts (glitches, clipped text, caption overlap, flicker, audio clipping).
8. Exported MP4 not inspected frame-by-frame (scene starts/ends, seams) and by audio check.
9. `data/OFFICIAL-SOURCES.md` missing or contains `needs-recording`.

## Procedure
1. `bash scripts/final-gate.sh <episode-dir> [video.mp4]` (automated: placeholders, slots, sources file, QC report, filename vs status; exit 1 = PREVIEW).
2. Complete `data/QC-REPORT.md` from the checklist in `quality-checklist.md` section "Final QC" (visual, technical, audio, mobile, storytelling) with PASS/FAIL per line and the frames/commands used.
3. If anything fails: report the exact issues, fix what can be fixed locally, re-render to a new filename, re-run the gate.
4. If real footage is unobtainable here: deliver PREVIEW, plus a **recording list** in this format and keep building every other asset:
```
MUST RECORD (exact):
- Scene sN · <app/site> · <exact action/command> · <what must be visible> · <length> · save as episodes/<ep>/footage/<name>.mp4 · slot id <id>
```
5. Only after the gate passes, rename/export as FINAL and state what was inspected.
