# Reference analysis: what makes the approved Agentoon motion feel alive

Analysed 2026-10-17 by watching the frames and motion of three 15 s references (1080×1920, 24 fps, audio −16 LUFS, peaks −4.3 to −4.4 dBFS):
- **FreeLLMAPI opener** (approved, never modify): `$200` hero type → terminal → cable → dashboard → failover → iris → ending.
- **Engine Test02** ("HTML → MP4"): phone collage → iris → code card → whip → terminal → GitHub tour → iris → ending.
- **Engine Test01** ("New engine"): GitHub page scroll → terminal → perspective collapse into paper collage → iris → ending.

These are our own earlier productions. Use them as a **quality bar and a technique library**, never as a template. A new episode may reuse a technique, not the whole combination (see "Choosing a fresh direction").

## Measured benchmark (`scripts/motion-profile.sh`)
| | Test02 | Test01 | FreeLLMAPI | **Our ep01 (79 s, before this update)** |
|---|---|---|---|---|
| Mean motion energy | 6.3 | 4.4 | 5.5 | **1.6** |
| Alive time (≥ 2.0 per 0.5 s) | 57 % | 63 % | 83 % | **18 %** |
| Motion bursts per minute (≥ 8.0) | 36 | 20 | 24 | **6** |
| Longest gap between bursts | 4.0 s | 3.5 s | 2.5 s | **15.5 s** |
| Static stretches ≥ 2.5 s | none | 4.5–7.5 s | none | **4 stretches of 3–4.5 s** |

Target for new episodes: mean ≥ 4, alive ≥ 55 %, a burst (transition, camera move, transform, big reveal) at least every ~3 s, no static stretch ≥ 2.5 s before the final 3 s. Holds are good (reads need time); **dead** holds are not: during a hold something must still move (slow push-in, parallax drift, typing, a wire drawing, a robot action, a highlight sweeping).

## The five most valuable techniques

### 1. Continuous camera through a physical carrier, with motion blur
What: no cut. A cable, a scroll, a zoom-through or a whip carries the viewer from one real interface to the next; fast moves smear (vertical or horizontal blur, sometimes a chromatic streak at the seam).
Seen: FreeLLMAPI 4.5–5.7 s (blue cable with a "localhost:3001 · Anthropic Messages API" chip pulls the camera from terminal to dashboard); Test02 3.9–4.6 s (card whips left into the terminal) and 8.0–8.7 s (text zooms into blur, flash, GitHub); Test01 0–4 s (page scrolls like a camera dolly).
Use when: the story is a flow (A feeds B), a request route, a pipeline, or "from the CLI to the dashboard".
Build with: `Cam.fly` (add velocity-based blur), `Cam.whip`, `Cam.push`; a carrier element that exists in both scenes (line, cable, card). HyperFrames catalog: `zoom-through-transition`, `whip-pan`, `cinematic-zoom`.

### 2. Zoom-to-detail tours with drawn-on highlights
What: real UI at phone-readable size. The camera pushes into the line being narrated, a hand-drawn outline draws on around it (red/blue, slightly wobbly), then the camera travels to the next detail and finally pulls back. Page sits in a tilted device frame on a gradient backdrop.
Seen: Test02 8.7–12.4 s (About text → Apache-2.0 license → pull back with "local render · no credits"); FreeLLMAPI 6–11.5 s (routing table rows, failover, real request-log rows boxed blue/red/green).
Use when: showing GitHub pages, dashboards, logs, docs, anything with small text. Never show a whole desktop.
Build with: a `Callout` component (wobbled rounded rectangle that draws on, optional label chip), `Cam.fly` zooms 1.6–3×, a device/browser stage. Catalog: `hw-box-label`, `browser-device-stage`, `device-frame-stage`.
Rule: each zoom lands on the narrated word (±0.1 s), holds ≥ 1 s so it can be read on a phone, then moves on.

### 3. Typography as scenery
What: giant words and numbers are objects, not captions. They sit behind or beside the subject (ghost "WRITTEN" behind the phone), get struck through (red line draws across `$200`), scroll away with the camera, or swap (`HTML` → `MP4`).
Seen: FreeLLMAPI 0–2.5 s; Test02 0–2.7 s; Test01 title blocks; all three use a small kicker line above the hero word.
Use when: the hook is a number, a price, a claim, a before/after, or a one-word idea.
Build with: a `HeroType` component (slam-in, strike-draw, ghost watermark with parallax, replace). Catalog: `strikethrough-replace`, `caption-kinetic-slam`, `mk-callout-highlight`.

### 4. Progressive construction
What: nothing appears fully formed. Collage pieces assemble one by one (circle, rectangle, triangle, film strip, labels), diagrams draw node by node with wires and chips, states flip (✗ red → ✓ green), tables highlight row by row.
Seen: Test01 8–12 s (paper collage built piece by piece while the terminal tilts away); FreeLLMAPI 6–11.5 s (green wires from the routing table to "34 free LLM providers", failover branches).
Use when: any diagram, architecture, comparison, or list. Time each piece to its word.
Build with: `BP.line/BP.box` draw-on, `Collage.stopIn`, stagger helpers. Catalog: `hw-pipeline`, `svg-line-draw-loader`.

### 5. Shape-grow match cuts, depth and changing light
What: a circle (phone screen, robot dot) grows into the next scene (iris); a card tilts in 3D and collapses; environments change between scenes (dark stage, cream paper, teal-purple gradient, yellow collage, navy ending), so the eye resets and depth is felt through layers (shadow, tilt, parallax).
Seen: Test02 2.5–3.2 s and 12.4 s; Test01 12.3 s; FreeLLMAPI 12.3–13 s; terminal perspective collapse in Test01 at 8 s.
Use when: changing topic or environment, and for the ending.
Build with: `Cam.iris` (to build), `Cam.cardGrow`, `Cam.sheetDrop`, 3D `transformPerspective`. Catalog: `sdf-iris`, `transitions-mechanical`.

## Supporting techniques seen in all three
- **Karaoke pill subtitles:** dark rounded pill, bold uppercase, the current word sits in a filled colour block that hops word to word. Always below the UI, never over code. Keep the word-block mechanic; vary colour, shape and font per episode. Catalog: `caption-pill-karaoke`.
- **Authenticity chips:** small pills that label the footage ("REAL SESSION · excerpt", "REAL REPO · Apache-2.0", "real file · excerpt", "40× time-lapse", "no cloud · no credits", "from the real request log"). They make real demos credible; use them on every real capture and always label sped-up or trimmed footage.
- **Robot on the interface:** it perches on card edges, peeks over terminals, climbs the GitHub page, stands beside the ENTER key cap, looks at what is highlighted, and changes expression at results. It is small (≈ 150–220 px) but always tied to the action. Our acting must go further (see `robot-acting.md`).
- **Typed terminals with cursor and key caps:** command typed progressively, `ENTER` key cap that presses, progress bar, output lines appearing, then the result line highlighted.
- **Audio:** continuous, no gap > 0.5 s at −40 dB, loudness about −16 LUFS, peaks about −4 dBFS (more headroom than our −1.2 dBTP; fine either way).
- **Rhythm:** a transition or camera move about every 2–2.5 s, holds of 1.5–2.5 s between, each hold busy but quiet.
- **Ending:** wordmark, robot with halo, ONE "+ Follow Agentoon.ai" pill. (Engine Test01 still shows the older LIKE · FOLLOW · SHARE trio. Do **not** use it; the approved ending is the single follow pill.)

## What our style was missing (evidence from ep01 and the test episode)
1. **Dead holds:** long stretches where only a line draws or text types (15.5 s between bursts, mean energy 1.6).
2. **Flat sheets:** one background per scene, no depth layers, no tilt, no gradient or lighting change.
3. **Camera only flies between figures:** no push-in, drift, zoom-to-detail or motion blur inside a figure.
4. **No hero typography:** headlines were small kickers; the hook had no giant word or number moment.
5. **Synthetic UI:** terminal cards typed real text, but there were no real screenshots (GitHub, dashboards) with drawn-on highlights and zooms.
6. **Robot parked at the bottom:** acting beats were short and mostly beside the content, rarely on it.
7. **Empty areas:** lower third and margins left blank next to small diagrams.
8. **No shape match-cuts or carrier objects:** transitions were scene swaps (whip, drop, push) rather than something on screen becoming the next scene.
9. **Subtitles without a word block:** active word was only a colour change.

## How to apply (every future episode)
1. **Energy line before design.** In the beat sheet add an energy mark per beat (burst / hold-busy). A burst every ~3 s; plan what moves during every hold.
2. **Pick one hero technique, one carrier, one transition family, one environment arc** for this topic (table below). Do not reuse the previous episode's combination (check the ledger in `creative-direction.md`).
3. **Real UI first.** Capture real pages and sessions (see `technical-validation.md` for phone-size capture). Crop to the readable detail, zoom to it on the narrated word, draw a highlight on, hold, move on.
4. **Build progressively.** Every diagram draws in; every list reveals item by item on its word; wires connect as they are mentioned.
5. **Fill the frame.** Layer: background environment, mid-ground UI card in a tilted frame with shadow, foreground robot and chips, hero type behind or beside. No large empty zone beside small content.
6. **Robot works.** At least one UI interaction per scene (perch, peek, press, pull the cable, climb, point, react to a highlight) in addition to looks and expressions.
7. **Gate it.** Run `scripts/motion-profile.sh` on the render; fix dead holds before delivery.

### Choosing a fresh direction (technique ↔ topic)
| Topic shape | Hero technique | Carrier | Transition family | Environment arc (examples) |
|---|---|---|---|---|
| Cost / price / claim | giant number with strike-draw | none or a coin/line | scroll + whip | cream paper → dark terminal → gradient dashboard |
| Routing / pipeline / API flow | thin hero type | cable between UIs | zoom-through, vertical blur | dark stage → light dashboard → node diagram |
| Open-source repo | repo name as ghost type | page scroll | iris + whip | gradient stage → tilted GitHub → terminal |
| Concept / architecture (MCP, agents) | one-word type, collage or blueprint assembly | the connection itself drawn | sheet drop, iris, perspective collapse | blueprint blue → whiteprint → ink |
| Tool tutorial (commands) | command as hero text | keystroke / ENTER key cap | push-through, card grow | terminal-first, light result page |
| Before / after | split or swap typography | slider / wipe | card grow, iris | two contrasting environments |
Pick from Lemo Opuscar styles (`Living Screencast`, `Dark Tech Keynote`, `Satellite Briefing`, `Blueprint`, `Halftone Dossier`, `Swiss Motion Graphics`) for the visual grammar of the chosen row. Never imitate another creator's branding; keep our robot, wordmark and single-CTA ending.

## Tools that deliver these techniques (all free, local)
| Need | Use |
|---|---|
| Camera, zoom, parallax, 3D tilt, push-ins | `hyperframes-keyframes`, `hyperframes-animation` skills; kit `Cam.*` |
| Ready-made blocks | HyperFrames catalog: `zoom-through-transition`, `whip-pan`, `cinematic-zoom`, `sdf-iris`, `transitions-mechanical`, `device-frame-stage`, `browser-device-stage`, `hw-box-label`, `hw-pipeline`, `strikethrough-replace`, `svg-line-draw-loader`, `caption-pill-karaoke`, `caption-kinetic-slam`. Search with `npx hyperframes catalog --query "<move>"`, install with `npx hyperframes add <name>`; **check each item's licence before first use** (registry entries are not covered by what we verified for the CLI). |
| Direction / style grammar | `lemo-opuscar` skill, `creative-direction.md` |
| Robot acting | kit `robot.js` actions + `robot-acting.md` |
| Diagrams, collage, terminals | kit `blueprint.js`, `collage.js`, `term.js` |
| Real UI capture | Playwright or puppeteer-core with the installed Chromium at phone viewport, 2–3× scale (github.com is blocked in the cloud sandbox; capture on the user's machine or use the user's own recordings) |
| Word timing for subtitles | local TTS timing; `media-use` transcription if whisper is installed |
| Quality gates | `scripts/validate-render.sh`, `scripts/motion-profile.sh`, phone-size contact sheet |

## Kit backlog (build when the next real episode needs it, not speculatively)
`Cam.fly` with velocity-based blur · `Cam.iris` (circle grow match-cut) · `Cam.tilt` (3D perspective collapse) · `HeroType` (slam, strike-draw, ghost parallax, replace) · `Callout` (wobbled outline draw-on + chip) · `Cable` (carrier line that spans two scenes) · `Device` (tilted frame on gradient stage with shadow) · pill-karaoke caption style · `capture-ui.mjs` (Playwright phone-size capture with crop boxes) · robot actions: `perch`, `peek`, `press`, `climb`, `pullCable`.
