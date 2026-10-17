# Robot acting: a character, not a logo

The Agentoon robot takes part in the story. It looks at things, reacts to real software results, points, types, hops, worries and celebrates. It is never parked in a corner. Preserve its original appearance and personality (see `brand-guide.md`). Never swap in Clawd.

## Acting plan (write one per scene before animating)

```
Scene: <name>   Time: <start–end>
Feeling:     <curious / confident / worried / proud …>
Looking at:  <the exact UI element or the viewer>
Doing:       <action: points, types, walks, introduces, waits>
Reaction:    <to the software result: take, hop, shrug, hands on head …>
Anticipation:<small move before the main action>
Hold:        <how long the reaction stays so the viewer reads it>
Stays clear of: <code / text it must not cover>
```

## Action vocabulary (build as reusable functions in the kit)
- **introduce** — enters with a hop or walk, waves, names the tool.
- **walk / hop** — steps on arcs with weight and a settle; stands on real UI edges (card tops, window bars).
- **aimPoint** — points at the exact element the narration names; head turns first, then arm.
- **tap / type** — interacts with a key or button; timing synced to the real typing or click.
- **wait / think** — idle with a clear reason: eyes move, small sway.
- **react** — a quick take when a result appears (eyes wide, lean back, antenna perk).
- **worried** — failure: hands on head, wide eyes, sweat drop, red "!".
- **celebrate** — success: hop, fist pump, happy eyes, green ✓.
- **nod / shrug / wag** — small beats for agreement, uncertainty, friendliness.
- **outro** — the signature ending: glow, wave, centre, single follow CTA.

### Interface interactions (from the reference videos; do these, not only looks and poses)
- **perch:** stands on a card, window or page edge and is carried by the camera with it (feet locked to the edge).
- **peek:** rises behind or over a card, looks at the content, then reacts or ducks.
- **press:** taps a key cap (ENTER), a button or a toggle; the UI responds on contact, not before.
- **climb / ride:** climbs the page edge or rides a scrolling page while looking at the highlighted detail.
- **pull / carry:** holds the cable end, a plug or a card; the carrier line follows the hand.
- **look-at:** eyes and head turn to the exact detail the highlight is drawing around, a beat before the outline appears (the viewer follows the robot's gaze).
- **react to state:** worried at ✗ red, cheering at ✓ green, squint while the progress bar fills, wow at the final number.
A scene must contain at least **one interface interaction** plus one expression change. Standing still next to content is not acting.

## Principles (from character-animation practice; ClaudeAnimationBase, MIT)
- **Anticipation:** a small opposite move before a big one (crouch before hop, lean before point).
- **Slow in, slow out:** ease every move; no constant-speed motion.
- **Squash and stretch:** keep volume; squash on landing, stretch on fast moves.
- **Arcs:** hops, arm swings and head turns follow arcs.
- **Overlap and follow-through:** eyes lead, head follows, body and antenna settle last.
- **Avoid twinning:** left and right arms/eyes do not move identically; offset timing.
- **Show the thought:** eyes move first, so the viewer sees the decision.
- **Exaggerate** enough to read on a phone; hold key poses so they read as stills.
- **One read at a time:** do not stack a reaction on top of the thing it reacts to; cause, then reaction, then hold.
- **Fast actions, slow meanings:** quick moves, held reactions.

## Reading at phone size
- Robot at least ~220–300 px tall when it is the focus; large expressions, not subtle micro-motion.
- Face and gesture readable at 390 px width.
- It never covers code, buttons or key results; move it or change scale instead.

## Moods (map to the story beats)
| Beat | Mood |
|---|---|
| Hook / problem | curious, surprised, or frustrated |
| Discovery | wow, leaning in |
| Solution / explanation | focused, pointing, explaining |
| Real demo | typing, watching, waiting with anticipation |
| Result | celebrate or proud |
| Takeaway / ending | warm wave, glow |

## Review questions
- Does the robot touch the interface (perch, peek, press, climb, pull) at least once per scene?
- Does the robot react to what just happened on screen?
- Is it looking at the right thing in each shot?
- Did any acting beat get too short to read, or too long?
- Would the scene still work if the robot were removed? If yes, give it a purpose or change the scene.
