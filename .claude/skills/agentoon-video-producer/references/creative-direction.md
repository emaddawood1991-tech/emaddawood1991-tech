# Creative direction: a new look for every episode

**SAME BRAND. DIFFERENT VISUAL EXPERIENCE. EVERY VIDEO.**

## Fresh direction per episode (reference-informed)
Before choosing a look, pick **one hero technique, one carrier, one transition family and one environment arc** from the technique↔topic table in `reference-analysis.md`. The set must differ from the previous episode's. The look (palette, type, texture) then follows from that set and the topic's physical metaphor. Take grammar from Lemo Opuscar styles; never imitate another creator's branding, and keep the robot, wordmark and single-CTA ending.

## Procedure (do this before any code)

1. **Read the style ledger below.** The new episode must differ from the previous one in background, typography treatment, motion language and camera grammar, not only in colour.
2. **Find the subject's physical metaphor.** What does the tool do, as an object or place? (routing cable, control room, blueprint, switchboard, mail sorting, assembly line, library.) The metaphor, not a template, picks the look.
3. **Pick the base style** from the shortlist below or from a Lemo Opuscar `STYLE.md` (read the style's grammar, then adapt; never copy a film).
4. **Choose the carrying device:** one visual element the camera follows from hook to result (a cable, a line, a card that grows into the next scene).
5. **Decide the five dimensions** and write them in the episode brief:
   - Background and palette arc (light ↔ dark, alternating by topic)
   - Typography treatment (display face, code face, how text enters)
   - Motion language (snappy/mechanical, soft/organic, stop-motion, drafting)
   - Camera grammar (push-through, whip, orbit, track, locked-off)
   - Subtitle style (must fit the look; never over code)
6. **Log it** in the ledger. Do not repeat a look until at least three other looks have passed.

## Rules
- Light editorial backgrounds for explanations; dark backgrounds for technical demos. Alternate within a video.
- Not a slideshow: one continuous camera through one world, layered depth, masked reveals, parallax, highlight boxes that draw on, motion blur only on fast moves, subtle handheld drift, light grain.
- Transitions grow out of the previous beat (something on screen survives and becomes the next beat). Do not default to cuts or the same transition twice in a row.
- Every motion must support the explanation. No meaningless movement.
- Keep palettes legible at phone size; check contrast on bright and dark.

## Starter looks (shortlist, kit `looks.json` if present)

| Look | Feels like | Good for | Typical device |
|---|---|---|---|
| paper-collage | cream editorial paper, cut shapes, stop-motion pops | routing, comparisons, "free" tools | one coloured cable or ribbon |
| swiss-grid | strict grid, big type, red/black | rules, config, step-by-step | grid lines that become panels |
| dark-keynote | near-black, soft glow, product-launch polish | new releases, big claims | a cursor or light bar |
| blueprint | cyanotype sheet, white line work | architecture, MCP, system design | drafting lines and callouts |
| risograph | two misregistered inks, grainy | playful, beginner-friendly | ink layers sliding into register |
| terminal-crt | phosphor, scanlines | CLI-heavy tools | a prompt that opens into UI |

Lemo Opuscar styles worth adapting (grammar only): Blueprint, Halftone Dossier, Swiss Motion Graphics, Dark Tech Keynote, Risograph Print, Isometric Infographic, ASCII / CRT Terminal, Data Storytelling, Living Screencast (never its Clawd character), Papercut / Paper-cut Lightbox, Exploded Teardown. Lemo styles are tuned for Opus 5.5, so expect to simplify them.

## Original paper-collage B-roll (local, free)
Built with HTML, CSS, SVG, canvas and GSAP: flat colour paper fields, halftone-dot textures (CSS radial-gradient or SVG pattern), cut-out shapes with torn edges (SVG filter or clip-path), elements sliding in with stop-motion steps (`steps()` or quantised GSAP), small drop shadows. Do not use the paid Gemini video workflow.

## Style ledger (append one row per finished episode)

| Episode | Concept | Background | Typography | Motion / camera | Subtitles | Date |
|---|---|---|---|---|---|---|
| FreeLLMAPI (approved, do not modify) | Cream editorial paper plus one blue routing cable the camera follows | light cream, navy ending | editorial headline + mono | continuous track along cable, 3D tilt into ending | per-episode paper style | done |
| 00-quality-test (tooling test, not published) | "Paper Switchboard": ink terminal hook, cream collage paper diagram, cut-paper tool cards | ink / cream / ink / navy | Fraunces display + JetBrains Mono | cardGrow, whip, push; stop-motion pops; slow push-ins | white paper tag, coral active word | 2026-10-17 |
| 01 How MCP servers work | "The Blueprint Sheet": drawing that draws itself; one continuous camera down four figures; ink terminals for the real demo; one red stamp | ink / cyanotype blue / white sheet / ink / white / navy | Fraunces italic notes + JetBrains Mono | whip, sheet drop, push-through, card grow; camera flies between figures | double-rule drawing notes on navy | 2026-10-17 |
| Engine Test02 "HTML → MP4" (reference, do not modify) | Phone collage → iris → code card → whip → terminal → tilted GitHub tour with drawn highlights → iris | dark stage / cream / dark / teal-purple gradient / navy | ghost hero word, mono terminal | iris match-cut, whip with chroma streak, zoom-to-detail | karaoke pill, blue word block | reference |
| Engine Test01 "New engine" (reference, do not modify) | GitHub scroll → terminal → perspective collapse into yellow paper collage → iris | cream / dark / yellow / navy | bold sans titles | scroll dolly, 3D collapse, stop-motion assembly | karaoke pill | reference (old LIKE·FOLLOW·SHARE ending, retired) |
| _next episode_ | | | | | | |

## Anti-patterns
- Reusing the previous layout with a new colour.
- A sequence of cards that fade in and out.
- A decorative robot in the corner.
- Effects chosen because they are available (glitch, whoosh, zoom) rather than because they explain something.
