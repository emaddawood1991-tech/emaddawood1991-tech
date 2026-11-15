---
name: agentoon-data-motion
description: >-
  Agentoon.ai Remotion data-motion components: animated counters (0 to 1,000), rolling digits / odometer, percentage roll (0 to 95%), progress bars,
  circular progress, countdown timers, animated bar and line charts, all frame-based so numbers land on narrated cues. Use for statistics, results,
  comparisons of numbers, "N tools / N% / N seconds" beats. Type /agentoon-data-motion.
---

# /agentoon-data-motion

Code: `agentoon-video/remotion-fx/src/fx/data.tsx` (+ pure math `math.ts`, unit-tested: `node --test test/math.test.ts`). Demo: showcase scenes S01-S03 (`proof/showcase/`).

| Component | Key props | What animates |
|---|---|---|
| `AnimatedCounter` | `from,to,start,dur,decimals,prefix,suffix,size,label` | number interpolated per frame (ease-out), lands exactly on `to`, small pop on landing |
| `RollingDigits` | `to,digits,start,dur,suffix` | odometer columns roll (0-9 strips), higher columns roll when lower wraps; `to=95,suffix="%"` = rolling percentage |
| `ProgressBar` / `CircularProgress` | `to,start,dur,label` | fill eased; ring via stroke-dashoffset + glow |
| `Countdown` | `from(seconds),start,dur` | ring depletes, mm:ss text, pulse each tick |
| `BarChart` | `bars[{label,value,color}],stagger,max,unit` | bars grow staggered with value labels counting up; max bar highlighted |
| `LineChart` | `points[],start,dur` | line draws on (pathLength), area fades in, dots appear |

## Use
1. Set `start` to the frame of the narrated cue (word time × 30). `dur` = frames to land (45-70 typical).
2. Compose inside a `<Composition>` (1080x1920) or a scene; wrap values in labelled cards. Charts built from invented numbers must say DEMO DATA.
3. `bash .claude/skills/agentoon-director/scripts/render-fx.sh <CompId> <out.mp4>`; view the frames.
Rules: numbers must come from `data/` of the episode (never invented); keep ≥ 28 px text; one hero number per scene.
