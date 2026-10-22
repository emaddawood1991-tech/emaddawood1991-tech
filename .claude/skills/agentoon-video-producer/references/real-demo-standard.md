# Real-demo standard (added after Ep 07b)

Lesson from Ep 07 v1: a "preview" with placeholder ribbons is not a deliverable. A final Agentoon.ai video contains **only** footage that is real or clearly a re-rendering of real text. Plan this in pre-production, not after the render.

## 1. Get the real material first (before any scene is designed)
Order of preference for every demo slot:
1. **Run it for real, locally.** Install the tool, run the command, keep the verbatim transcript (`data/real-*.txt`) and any generated files. A nested headless Claude Code run is allowed when the user has asked for the tool to be shown: `claude -p "<skill prompt>" --plugin-dir <local clone> --allowedTools "Read" "Write" "Edit" "Bash(<narrow>:*)" --output-format stream-json`. Never use `--permission-mode bypassPermissions` (the harness refuses it) and never exceed what the task needs; it spends the user's Claude usage, so keep prompts small, `--max-turns` low, and say so in the report. If the usage limit is hit, wait for the reset and re-run; do not fake the output.
2. **Use a local stand-in for the "original" app** when the real site is unreachable (the sandbox blocks many sites; check with `curl` first). Build it small, serve it on localhost, say "LOCAL TEST APP" on screen. Never imply it is a named commercial product.
3. **Screenshots with Playwright** from `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, `createRequire("/tmp/pw/")`) at 390x844, deviceScaleFactor 3, for every state shown.
4. If a thing cannot be obtained (github.com UI, a paywalled site, the user's own account), **do not draw it as if real**. Show the real text from the cloned repo (README, SKILL.md, transcripts) in an Agentoon card captioned with its file name and URL, or leave the scene out and say in the report exactly what is missing.

Never ship: `PLACEHOLDER`, `PREVIEW`, hazard-stripe ribbons, "REBUILT FROM" disclaimers standing in for footage, invented outputs, README example numbers presented as results, invented reviews or counts.

## 2. Truth labels (small, honest, not "placeholder")
Real captures carry a short chip: `VERBATIM TERMINAL OUTPUT`, `ORIGINAL · LOCAL TEST APP`, `RUN ON MY BUILD`, `README.md · <url>`. Anything shortened says so. A run that failed first and passed after a fix is shown honestly (or the first failure is mentioned in the report).

## 3. Claims
Every number on screen must be traceable to a file in `data/`. Write the trace in the delivery report (claim -> file). Score/parity/test numbers belong to the thing that was actually tested (say "my build", not the original). Where a tool's own output exposes a defect in the pipeline (e.g. a malformed CSV row), fix only the mechanical issue, keep the raw file, and report it.

## 4. Hook and structure (60-90 s when material supports it)
0-3 s: the real result (original vs rebuilt, real screenshots) with kinetic title; 3-12 s what/why; 12-30 s install + real workflow; 30-55 s real run; 55-75 s real result and honest limits; last 5-8 s CTA. Do not pad to hit the length; 60-70 s with real material beats 90 s of filler.

## 5. Ending (current standard)
Existing Outro animation with `Outro.build(..., {cta: "Follow @agentoon.ai", tag: "Real AI Tools • Skills • Automation"})` (kit/outro.js options; defaults still "+ Follow Agentoon.ai"). Only one follow CTA.

## 6. Automatic checks before delivery
- `scripts/no-placeholders.sh <episode-dir>` must pass (no placeholder/preview strings in the built `index.html`, no unverified slots, preview_banner false).
- `validate-render.sh` + `motion-profile.sh` (the final-hold gap at the CTA is expected).
- Read the final MP4 frames at every scene and seam; captions must not cover text or UI; zoom moves must keep content inside the frame (zoom about the content: `y = cy*(1-s)`, not toward the screen centre).
- Environment gotchas (this sandbox): Kokoro TTS and the mix need `/tmp/kokoro/venv/bin/python` with `KOKORO_MODEL`/`KOKORO_VOICES` set; `soundfile`/`scipy` may need `pip install`; `type` SFX cues need `dur` and `cps`.
