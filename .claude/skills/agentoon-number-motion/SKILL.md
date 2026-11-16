---
name: agentoon-number-motion
description: >-
  Agentoon.ai Remotion number animation for static statistics: counter 0 to 1,000, rolling odometer 0% to 95%, animated progress ring, moving bar chart and spring-based
  numeric transitions, all frame-driven with exact end values. Type /agentoon-number-motion <stats>. (Components shared with /agentoon-data-motion.)
argument-hint: <numbers to animate, e.g. "1000, 95%, bars 32 48 66 95">
allowed-tools: Read Write Edit Bash(npx remotion *) Bash(bash *) Bash(node --test *)
---

# /agentoon-number-motion

Code: `remotion-fx/src/fx/data.tsx` (`AnimatedCounter`, `RollingDigits`, `CircularProgress`, `BarChart`, `SpringNumber`) + `math.ts` (unit-tested: `npm test`). Demo `D05`.

## Do this when invoked
1. Take numbers only from the user's data or the episode's `data/` (never invent; label demo data).
2. Build a composition from the components; set `start` to the narrated cue frame and `dur` 45-70.
3. `npm test` (counter 0 to 1,000 lands exactly, 0 to 95 percent), render with `render-fx.sh`, and check frames: values must differ between early and late frames and end on the exact numbers.
`SpringNumber from to` overshoots and settles (spring), counters ease out.
