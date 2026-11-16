---
name: agentoon-kinetic-type
description: >-
  Agentoon.ai Remotion kinetic typography: spring word reveals, character-by-character flip-up reveals, text morphing between two strings, marker word
  highlighting, extruded 3D titles, and word-timed animated subtitles. Use for key points, hooks, quotes, "before/after" wording, captions.
  Type /agentoon-kinetic-type.
---

# /agentoon-kinetic-type

Code: `agentoon-video/remotion-fx/src/fx/kinetic.tsx`. Demo: showcase S06 (all six) + S08 (TextMorph inside the comparison).

| Component | Props | Effect |
|---|---|---|
| `KineticWords` | `text,start,size,stagger,highlight[idx]` | each word springs up with rotation + blur-in; highlighted words get a marker sweep |
| `LetterReveal` | `text,start,stagger,size` | per-character 3D flip-up with blur |
| `TextMorph` | `a,b,start,dur` | characters scramble through random glyphs and settle into text B (monospace) |
| `WordHighlight` | `words[{w,hl,at}]` | marker highlight drawn behind chosen words at cue frames |
| `Title3D` | `text,start,depth,rotate` | stacked-shadow extrusion, spring rotation, moving glint |
| `AnimatedSubtitles` | `words[{w,s,e}],perChunk` | 4-word chunks, active word block + spring pop; feed it TTS word frames |

Rules: ≥ 60 px for titles on phones; captions near the top unless the footage needs it; no more than 2 kinetic styles per scene; word timings come from the episode's `audio/timing.json` (× 30).

Input/output demo: composition `D07` (agentoon-video/remotion-fx/src/nine/demos.tsx): plain static captions become KineticWords + LetterReveal + TextMorph + AnimatedSubtitles timed to the real narration audio (`public/audio/kinetic.wav` + `.json` made by `scripts/make_words.py`).
