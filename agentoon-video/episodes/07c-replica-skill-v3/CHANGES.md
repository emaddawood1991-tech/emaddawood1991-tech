# Ep 07c — Replica Skill v3 (visual upgrade of v2) — exact changes

New video: `out/agentoon-ep07-replica-skill-v3.mp4` (1080x1920, 30 fps, H.264+AAC, 66.0 s, -15.6 LUFS, TP -1.5 dBTP). v2 (`../07b-replica-skill-v2`) is untouched.
Assumption: `1000286064.mp4` and `1000286159.mp4` are not in the sandbox; I treated 1000286064 as the latest Replica Skill video (v2, Claude Code + app comparison) and used the Git-vs-GitHub reference only as a presentation principle (apps shown inside computers, camera moving to the screen).

## Before-edit inspection
1. Moving light: the loop `for (let t = 0.9; ...; t += 1.25)` that created `#bm0…#bmN` — full-height 420 px gradient bars with `mix-blend-mode:screen`, added to the `#fx` overlay and swept across the frame every ~1.25 s (copied from the Ep 05 template). Not Remotion/Blender (none were used in v2).
2. Too-small/unclear software: S1/S2/S5/S6/S7 showed phone-shaped screenshots 250–360 px wide; S3 README and S4 terminal were flat panels.
3. Where a computer presentation helps: both app scenes (S1, S2, S5, S6, S7), the README (S3) and the Claude Code terminal (S4, S5, S6).
4. Kept untouched: robot + all acting, narration, music, SFX cues, subtitle style/colours, whip/push/iris transitions, chips, active-chip glows, callouts, scene order and every on-screen fact.

## Changes
- REMOVED the sweeping light-beam loop entirely (`mix-blend-mode` no longer appears in the built HTML). Also removed the random jump-cut camera snaps that were timed with it; replaced by small eased camera punches (max 1.07x) that never touch the light.
- NEW real desktop captures (Playwright, 720x500 @2x): original MeetNow (3 states), SlotNest (5 states), README.md of the cloned repo (`assets/desk-*.png`, `data/shoot-desktop.mjs`). Same apps/code as before, only a desktop-sized capture.
- Laptop illustration with the real screen inside (`laptop()` helper, saved as `kit/snippets/laptop-screen.js`):
  S1 two laptops (original -> rebuilt) with an arrow; S2 two laptops side by side with step chips 1-2-3 following the narration and camera zooms to each screen; S3 README.md inside a laptop (camera starts zoomed on the text, then pulls back as the 11 skills build); S4 the install terminal (verbatim) inside a laptop; S5 laptop that shows the original app, then turns into the real `claude -p /replica-recon` output, with the features table below; S6 build output on top and ONE laptop where the real `:root` code becomes the running SlotNest (code -> browser); S7 laptop with the real "slot taken" screen next to the Playwright results.
- Purposeful zooms toward screens (S2, S3, S4, S5, S6) with the text kept inside the frame; layout kept above y~1450 so subtitles never cover content.
- Audio, narration, SFX cues, subtitles, colours, ending: unchanged (same `audio/` files and `cues.json`).

## Verification (old v2 vs new v3)
- Moving light: a column-brightness band detector found 118 of 396 sampled frames with a strong vertical band in v2 (max strength 146) vs 18 in v3 (max 52); the remaining 18 are the bright laptop screens at 0.5-2.7 s and two stat-tile moments, not a sweeping band; visual frame comparison at 8 timestamps confirms no sweeping light.
- Real software is larger and framed: laptop screens 456-956 px wide plus camera zooms (was 250-360 px phones). 
- Facts unchanged (same texts and numbers). Transitions, SFX and robot present. 1080x1920, 30 fps, 66.0 s. `validate-render.sh`: 0 fail. `no-placeholders.sh`: PASS.
- Motion profile: mean energy fell from 4.5 to 2.1 because the beam sweeps are gone (they supplied most frame-to-frame change); no static stretch >= 2.5 s remains. The skill's old "mean energy >= 4" bar was updated accordingly.

## Not done / honest limits
- Real GitHub web UI and a screen recording of the interactive Claude Code window cannot be captured here (github.com blocked; first-run onboarding would modify your profile). The README is shown as real text from the cloned repo; Claude Code shows real `claude -p` output as text, labelled.
- Blender, Pexels, Shotcut: not available in this sandbox, not used. Remotion: not used for this edit (the changes are layout/camera in HyperFrames; Remotion's only use so far is the Ep 08 timeline).
- Ep 08 (Git vs GitHub, `08-git-vs-github`) still contains the same beam loop; I did not re-render it. Say the word and I'll make a beam-free 08b.
