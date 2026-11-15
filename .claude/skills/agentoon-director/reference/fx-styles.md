# Real motion-graphics effects (what exists, what runs, when to pick)
Verified 2026-11-15. "Runs" = an implementation was rendered and inspected, not just a SKILL.md.

| Effect / skill | Source | Implementation (path) | Runs? | Pick when | Avoid when |
|---|---|---|---|---|---|
| `/scrapbook-collage` | Agentoon (custom) | `agentoon-video/remotion-fx/src/fx/ScrapbookCollage.tsx` | YES (proof/test-a) | roundups, hooks, recaps with 3+ real images/logos | step-by-step UI, one-image scenes |
| `/explainer-panel-reel` | Agentoon (custom) | `.../ExplainerPanel.tsx` | YES (proof/test-b) | "how to use X" with a real screenshot/recording | no real capture available (do not mock the UI) |
| `/neon-outline` | Agentoon (custom) | `.../NeonOutline.tsx` (+ `scripts/render-robot-layers.cjs`) | YES (proof/test-c) | robot/presenter hero beat, intro, emphasis (≤3 s) | text-heavy or editorial scenes |
| `video-effects` (21 effects: orbit, chat-takeover, zoom-portal, paper-cutout, magazine-cover ...) | github.com/JesseEisenbart/video-effects-skill (MIT) | `.claude/skills/video-effects/` (Remotion project, needs `npm install`; person matting is macOS-only, supply masks/alpha instead) | Installed, NOT yet rendered here | real talking-head footage with a cut-out/mask | no footage of a person; use the robot layer + /neon-outline instead |
| `motion-graphics` | github.com/Liamrjohnston/remotion-motion-graphics-skill (MIT) | `.claude/skills/motion-graphics/` (kinetic text, AI workflow diagrams, official-asset library) | Installed, not rendered | kinetic text / product logos / workflow diagrams | its intake questions are pre-answered by Agentoon rules: 9:16, dark grid or brand palette |
| `cinematic-camera` | same repo | `.claude/skills/cinematic-camera/SKILL.md` (rules only, no code) | Guidance only | continuous-camera scenes | neon scenes (it forbids neon) |
| `terminal-inserts` | same repo | `.claude/skills/terminal-inserts/` | Installed, not rendered | authentic terminal inserts | glow/neon looks |
| `article-highlights` | same repo | `.claude/skills/article-highlights/` | Installed, not rendered | editorial text highlights | neon looks |
| Remotion best practices (`remotion:*` plugin skills) | github.com/remotion-dev/skills | already available as plugin skills (reused, not duplicated) | Reference | any Remotion code | |
| Existing Agentoon kit (HyperFrames + GSAP): `kit/robot.js`, `camera.js`, `captions.js`, `outro.js` | repo | `agentoon-video/kit/` | YES (Eps 11-18) | robot lip-sync, captions, outro, base scenes | |

## Rules
- Never select every effect. Each effect must serve a narrated beat; log it in `data/FX-TIMELINE.json` (see `scripts/check-fx-usage.py`).
- One hero effect + at most two supporting effects per video; no effect more than three times.
- Remotion clips are rendered to MP4 in `agentoon-video/remotion-fx` (`npx remotion render <Comp> out/x.mp4`), then composited into the episode (HyperFrames `<video>` or ffmpeg overlay). Say which engine rendered which scene.
- A skill name in a prompt is NOT proof: `check-fx-usage.py` fails if a planned effect has no rendered clip or the clip is static.
