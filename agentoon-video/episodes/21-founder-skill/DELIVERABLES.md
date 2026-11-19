# Episode 21 — Founder Skill (11 free Claude skills) — PREVIEW package

Status: **PREVIEW** (not the final export; waiting for approval). Engine: Remotion, composition `FounderSkill` (`agentoon-video/remotion-fx/src/nine/FounderSkill.tsx`). Output: `agentoon-video/remotion-fx/out/FOUNDER-SKILL-PREVIEW.mp4` (1080×1920, 30 fps, 83.8 s).

## 1. Source (verified 2026-11-19; raw copies in `data/raw/`)
Repository https://github.com/Jakeschincariol/founder-skill (MIT, v1.0.0, one commit `fd9385b`). README, `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`, all 11 `skills/*/SKILL.md` and the Python tools were read. 29 repo tests ran: `OK`.

The eleven skills (from the repo and from a real Claude Code session listing the installed plugin): `founder-board`, `founder-competitors`, `founder-consumer`, `founder-pricing`, `founder-offer`, `founder-cfo`, `founder-marketing`, `founder-brand`, `founder-ops`, `founder-launch`, `founder-plan`. As a plugin they appear as `/founder-skill:founder-board` etc.

## 2. Verified installation commands
README (Claude Code):
```
/plugin marketplace add Jakeschincariol/founder-skill
/plugin install founder-skill@founder-skill
```
Executed for real (isolated Claude config dir, so the user's own config was not touched) with the equivalent CLI form, output recorded in `data/term/`:
```
claude plugin marketplace add Jakeschincariol/founder-skill   ->  ✔ Added marketplace: founder-skill
claude plugin install founder-skill@founder-skill             ->  ✔ Installed plugin: founder-skill@founder-skill (scope: user)
claude plugin list                                            ->  founder-skill@founder-skill, Version 1.0.0, ✔ enabled
```
Alternative from the README (not shown): copy `skills/founder-*` into `~/.claude/skills/` for plain `/founder-board`.

## 3. Real material used in the video
* Terminal recordings (pty captures, idle waits shortened): marketplace add, plugin install, plugin list, and the repo's own `python3 skills/founder-cfo/unit_economics.py skills/founder-cfo/example.json`.
* All numbers in the pricing/CFO and result scenes are the tool's output for the repo's example café (price $6.50, $4.76 left per cup, break-even 186 cups/day, 38% margin at 383/day, year 1 $93,926 on $563,160, startup $25,280, payback month 8, cash needed $34,092, 12-month cash bars). They are EXAMPLE inputs, not your business.
* The 100 buyer cards: dealt by the repo's `panel.py init` on its example customer (seed 571998); names/ages/incomes/objections shown are the real cards. Always labelled SIMULATED. No buy rates are shown (those need the sub-agent panel run).
* A real headless Claude Code run of `/founder-skill:founder-cfo` on the example inputs produced `founder/cfo.md` with the same figures (`data/raw/claude-p-founder-cfo.jsonl`).
* Slash list: from the init event of a real Claude Code session.

## 4. Honest limitations
* **Reference video `1000290426.mp4` was not available in this session** (no such upload exists on disk), so the pixel-art look follows your written description, not frames of the reference.
* **The real GitHub page is not shown styled.** github.com's stylesheet host was not allowed in this sandbox (you declined the network change), so the repo scene shows the README as raw text with the real repo name/URL.
* **The Claude Code window itself is not shown** (the interactive TUI needs a folder-trust approval that I do not accept on your behalf). The install is shown through the same commands via the `claude` CLI, labelled on screen.
* Blender: not used; the robot is the approved 2D SVG rig (no Blender robot asset exists in the repo).
* No unrelated tools, no invented features. The board scene labels the three advisors as frameworks, not people (per the repo's rule). No results of a board vote are shown.

## 5. Voice
New voice: Kokoro `am_adam` at speed 0.99 (previous episodes used `am_michael` / earlier). Chosen from 9 male American candidates by objective metrics: lowest low-frequency energy (no boomy bass), high 2–6 kHz consonant energy, lowest word-error rate in an offline recognizer proxy (0.08, best of the set), natural pace without speeding up (158 wpm). Light clean-up only: high-pass 85 Hz, +1.5 dB at 3.2 kHz, mild compression; final mix −15 LUFS, peak −1.5 dBFS, music ducked 16 dB under the voice, only keyboard/click SFX. **I can measure audio but not hear it**: the 10-second sample was sent for your listening; if you dislike it, the pipeline swaps the voice (one config line) and re-renders. A cloud voice (e.g. ElevenLabs) would sound more natural but spends your credits, so it needs your approval.

## 6. Agentoon skills (all exist)
`/agentoon-director` (select-skills + plan), `/agentoon-motion` (staggered card/spring motion), `/agentoon-data-motion` (counting numbers, bars, progress), `/agentoon-kinetic-type` (word-timed captions), `/agentoon-camera` (scene transitions/wipes), `/agentoon-transitions`, `/agentoon-robot` (rig, blinking, gestures, lip-sync), `/agentoon-audio` (TTS timing, ducked music, SFX), `/agentoon-qc` (checks below). Pixel-art sprites/buildings are procedural SVG in the Remotion composition.

## 7. Narration script (83.8 s, 158 wpm)
See `data/NARRATION-SCRIPT.txt`.

## 8. QC log
Render: 2515 frames, 83.83 s, 1080x1920 @30, H.264+AAC; -15.1 LUFS, peak -1.5 dBFS; narration 158 wpm.
Checked: all 11 skill names appear (intro chips + slash list; verified against a real Claude Code session); repo URL on screen; real install commands run; scan of 168 frames (every 0.5 s) found no blank frames; narration covers the whole timeline; simulated buyers are labelled; no buy rates or vote results are shown.
Weak spots (honest): the motion-profile tool reports low energy (mean 0.8, 1 burst): the pixel characters, counters and bars move, but the movement is small and many scenes hold a fixed layout; small terminal/README text is hard to read on a phone; no listening test of the voice was possible; reference footage and a styled GitHub page were unavailable.
