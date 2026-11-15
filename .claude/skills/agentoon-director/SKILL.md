---
name: agentoon-director
description: >-
  Master creative director for Agentoon.ai videos. Use FIRST on any new reel, tutorial, explainer or transformation video, e.g. `/agentoon-director How to connect Claude to Bland with MCP`. Analyses the topic, footage and narration, picks only the specialist skills (motion, camera, typography, robot, ui, 3d, morph, diagrams, audio, transitions, qc) that serve the story, and writes a scene-by-scene plan with a visual identity that differs from earlier episodes.
when_to_use: >-
  User asks to plan, direct, storyboard or choose effects for an Agentoon.ai video; or starts a new episode and no plan exists in data/PLAN.md.
argument-hint: <topic or brief, optionally a reference video path>
allowed-tools: Read Grep Glob Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/*) Bash(bash ${CLAUDE_SKILL_DIR}/scripts/*)
---

# /agentoon-director: choose, plan, hand off

**Brief:** `$ARGUMENTS` (if empty, ask for the topic in one short question).
One brand, a different visual experience every video. You plan and choose; the specialist skills execute. Never apply every effect: every effect must serve a narrated beat.

## 1. Read the standing rules (do not restate them to the user)
- Repo `CLAUDE.md` and `/agentoon-video-producer` (the production standard: real demos only, hook in 2 s, robot in every scene, ending, no placeholders, never edit a finished episode).
- `${CLAUDE_SKILL_DIR}/reference/engines-and-assets.md`: what is installed and verified, and where the robot, kit and scripts live.
- The style ledger in `.claude/skills/agentoon-video-producer/references/creative-direction.md` (+ `reference/variety-ledger.md` here): the look, hero technique, carrier and transition family used by earlier episodes.

## 2. Intake (answer from the brief; ask only what blocks)
Topic and the one-sentence takeaway; audience; real material available (recordings, repos, files, TV/phone, accounts); reference video; duration (default 65-90 s, 1080x1920); what cannot be shown for real (list it now: it becomes the MUST RECORD list).

## 3. Choose skills
Run `python3 ${CLAUDE_SKILL_DIR}/scripts/select-skills.py "<brief text>"` for a scored starting point, then apply judgement with `reference/selection-matrix.md`. Rules:
1. Always: `/agentoon-robot`, `/agentoon-audio`, `/agentoon-qc`. Add `/agentoon-typography` unless the video is captionless by design.
2. Add a specialist only when a signal in the matrix is present AND you can name the scene it serves. Typical total: 6-8 skills; never more than 9.
3. Software or tool tutorial: `/agentoon-ui` (+ `/agentoon-diagrams` when two systems connect). Before/after of real results: `/agentoon-morph`. A place, object or product that is the subject: `/agentoon-3d`. Camera language beyond zooms: `/agentoon-camera`. Scene changes: `/agentoon-transitions` (pick 1-2 families). Everything moves: `/agentoon-motion`.
4. Two different briefs must not end with the same plan. If the plan equals the previous episode's, change the hero technique, carrier, transition family and environment.

## 4. Variety budget (per video)
One **hero technique** (the signature, e.g. a ruler that climbs, a D-pad focus ring, a patch cable), one **carrier** (what physically moves scenes on), at most **two transition families**, one **palette pair**, one **display typeface treatment**. Register them in the ledger. A motion burst about every 3 s; every hold keeps moving; but no effect repeats more than three times.

## 5. Write the plan
Create `<episode>/data/PLAN.md` from `reference/plan-template.md`: topic, audience, hook (real result in 0-3 s), visual concept, selected skills with the reason for each, scene table (time, narration line, visual, engine, effect, robot action, real or concept label), real demos vs labelled concept visuals, audio direction, expected duration, MUST RECORD list. Keep it to one page.

## 6. Hand off and gate
Execute with the chosen skills in this order: robot acting plan, ui/diagrams/morph/3d assets, motion/camera/transitions, typography, audio, then `/agentoon-qc`. Mark every deliverable FINAL only if `/agentoon-qc` passes; otherwise name it `*-PREVIEW.mp4` and list the blockers. Do not render, publish or spend credits unless asked.

## Engine rule
Use Remotion as the compositor when it is installed and verified in this environment (`bash ${CLAUDE_SKILL_DIR}/scripts/check-env.sh`), otherwise HyperFrames (verified, used for episodes 0-14). Say which one ran; never claim an engine, MCP or asset that did not run.

## 7. Motion-graphics pipeline (mandatory since 2026-11-15; extends sections 1-6)
A skill name in a plan is not proof of an effect. Every planned effect must exist as code AND as rendered footage that was inspected.
1. **Analyse** the topic, script and any footage: which beats are lists/roundups, UI walk-throughs, presenter emphasis, numbers/comparisons.
2. **Inspect the real skills**: `python3 ${CLAUDE_SKILL_DIR}/scripts/discover-skills.py` (flags `doc-only` skills) and read `reference/fx-styles.md` for what actually renders.
3. **Choose styles that carry the message** (never all): roundup/hook → `/scrapbook-collage`; software walk-through → `/explainer-panel-reel`; robot/presenter hero beat → `/neon-outline`; talking-head footage → `video-effects`; kinetic text/diagram → `motion-graphics`. One hero effect + at most two supporting effects, each ≤ 3 uses.
4. **Write the timeline** `<episode>/data/FX-TIMELINE.json`: `[{"id","skill","comp","start","end","clip","note"}]` (seconds; `clip` = rendered MP4 path relative to the episode; `note` = the narrated beat it supports). Software tutorials also need real logos + screenshots; important points use kinetic typography; alternatives use an animated comparison; camera moves direct attention; the original robot lip-syncs.
5. **Apply** in code: Remotion FX → `bash ${CLAUDE_SKILL_DIR}/scripts/render-fx.sh <CompId> <episode>/fx/<name>.mp4` (compositions live in `agentoon-video/remotion-fx/src`); base scenes stay HyperFrames/GSAP; Blender only if a Blender asset actually exists.
6. **Render and inspect**: view the 5 extracted frames; run `python3 ${CLAUDE_SKILL_DIR}/scripts/check-fx-usage.py <episode>`; run the effect's verifier (`agentoon-video/remotion-fx/scripts/verify-fx.py` pattern).
7. **Fix** weak or missing animation (static holds, overlaps, unreadable text), re-render, re-inspect. Report engines honestly (Remotion vs HyperFrames vs Blender).
Avoid static slides and generic crossfades; avoid excessive or distracting animation. Installed third-party skills have their own intake questions: the Agentoon defaults (9:16, 1080x1920, 30 fps, no questions) pre-answer them.
