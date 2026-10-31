---
name: agentoon-typography
description: >-
  Premium animated text for Agentoon.ai videos: kinetic typography, word-by-word captions synced to narration, phrase highlighting, masked reveals, tracking, animated numbers, title cards and emphasis. Use for hooks, step labels, numbers, key phrases and all subtitles.
argument-hint: <titles, captions or numbers to design>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-typography

Type carries the takeaway; it never fights the narration or covers real UI.

## System
- **Display:** Fraunces (800) for titles/numbers; **body:** Inter (700-800); **code/labels:** JetBrains Mono. Fonts are in `agentoon-video/kit/fonts` (loaded by `kit/agentoon.css`). One display treatment per video (caps serif, italic serif, heavy sans...).
- **Sizes (phone-proof):** captions 56-64 px; labels/chips >= 28 px; code >= 32 px; hero titles 90-150 px. HyperFrames `text_below_floor` warns under 28 px.
- **Safe areas (1080x1920):** keep key text out of the top 180 px, bottom 320 px (except the caption band), right 120 px. Captions bottom offset 300 (band about y 1450-1620). Contrast >= 3:1 on both light and dark scenes (`contrast_aa_failure`).

## Captions (word-timed)
`Captions.build(tl, host, words, {style:'pill'|'tag'|'bar'|'plain'|'note', bottom:300, active:'#FFF', block:'#1F7FB8', maxWords:4, maxChars:24})` with `words = EP.words` from `timeline.js` (written by `kit/py/build_audio.py tts` or the episode's `tts_seq.py`). Word timings are **estimates** from phrase length (Kokoro has no alignment): spot-check three captions against the audio. Choose `pill` (active word in a filled block) for tutorials, `note` for editorial/serif looks, `tag` for playful reels. Robot never covers the caption band: place it above y 1440 or at x >= 860.

## Techniques
- **Masked reveal:** wrapper `overflow:hidden`; text `y:100% -> 0`, or `clip-path: inset(0 100% 0 0) -> inset(0 0% 0 0)` with `steps(n)` easing for typed text (n = character count).
- **Kinetic title:** each line enters on its word (`back.out(1.6)`, 0.4 s), 120-ms stagger; hold >= 1.0 s + 0.3 s per word before leaving (HyperFrames `line_unread`).
- **Phrase highlight:** underline `scaleX 0 -> 1` or a background block behind the exact narrated word (use `PW(phrase, word)` timings).
- **Animated numbers without callbacks:** a vertical strip of numbers moved with `y` inside `overflow:hidden` (odometer), or a pre-rendered count in `NO.count` (`kit/nightops.js`). Never rely on `onUpdate`.
- **Tracking:** `letter-spacing` is layout; animate `scale`/`x` instead, or fade between two settings.
- **Synchronized emphasis:** the emphasised word in a caption and the big on-screen word land on the same frame (cue SFX there via `/agentoon-audio`).
- **Step labels:** "STEP 3 · ADD THE CONNECTOR" chip at y 236, enters on the scene's first word; one per scene.
- **Honesty labels** (`VERBATIM`, `NOT RUN`, `CONCEPT VISUAL`, `PROJECT PHOTOS · NOT MY TV`, `NOT RECORDED YET`) are typography too: >= 28 px, bordered chip, shown for >= 1.5 s.

## Remotion mapping
`<AnimatedText>` (existing `remotion-studio/src/components/AnimatedText.tsx`), `@remotion/captions` for word-synced captions, `spring()` for pops, `interpolate` for masks; load fonts with `@remotion/google-fonts` or local `staticFile()`.

## Do not
Use more than two typefaces, animate every word the same way, place text on busy footage without a scrim, or write a number that is not traced to a source in `data/`.
