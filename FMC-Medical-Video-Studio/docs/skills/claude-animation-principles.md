# Character animation principles (project guidance — "Claude Animation Base" capability)

**Source & status:** technique adapted from the MIT-licensed `JohnHeibel/ClaudeAnimationBase` `ANIMATION_GUIDE.md` (commit `0ac8bf2b3194`). It is a 2D p5.js starter with no installable Claude Code skill, so **nothing is installed**: this file + `src/components/Doctor/actingPrinciples.ts` are the FMC capability. Its sample character ("Clawd"), code and assets are NOT used. FMC's presenter stays the 3D clean-shaven doctor.

| Principle | FMC implementation / rule |
|---|---|
| Anticipation | `GESTURE_ACTING.anticipate` (−5 % dip) on every pointing/explaining clip (`Clip.acting`) |
| Follow-through / overshoot | `GESTURE_ACTING.overshoot` (+4.5 %) then settle to exactly 1; never > 7 % (professional, not cartoonish) |
| Slow-in / slow-out | smoothstep weights, camera PCHIP; never linear |
| Weight | `hips.x` weight shift, world-planted feet, two-step settle after walking |
| Arcs | arm IK targets move along arcs; head leads, eyes follow (look-at) |
| Overlapping action | head/eyes lead 6–10 frames before the arm; fingers lag; blend `inF/outF` differ per limb |
| Avoid twinning | give one arm the action, the other a smaller idle; blink/saccade timings seeded and offset per eye |
| Show the thought | glance at the structure, then gesture; `lookAtAnatomy` before `pointAtAnatomy` |
| Strong key poses | pain = turn ~25° + hand flat on the lumbar region; check the pose as a still |
| Secondary action | finger micro-motion, breathing, speaking nod — never competing with the main gesture |
| Exaggeration | **restrained**: medical credibility beats comedy |
| Faces act, never snap | `react()` clips blend smile/brow/furrow; lip-sync from narration loudness/spectrum |

**Gesture rules (checked by `standards:qc`):** gestures carry meaning (name the part → show the part); never repeat the same gesture family within 5 s (vary side/shape); max 2 waves (open/close); pointing gestures must have `acting`; no static PNG presenters; no robot.
**Verification:** `npm run anim:qc` (0 snaps, planted feet), still-frame review of key poses, human review of motion.
**Known gaps:** `explain` gesture needs variants; phoneme-accurate Arabic lip-sync and finger articulation upgrades not done.
