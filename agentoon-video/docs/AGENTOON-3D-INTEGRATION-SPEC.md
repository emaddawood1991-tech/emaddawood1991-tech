# Agentoon.ai · 3D Production Integration Specification (for Claude Code agents)

Status: specification. Nothing here has been built beyond what section 3 marks "proven".

## 1. Hard rules
1. Agentoon.ai config is independent of Dawoud Labs. Never read, edit, deploy to, or reference the `dawoud-labs` Vercel project or its env vars.
2. Never print, commit or paste credentials. Refer to env var **names** only (`AI_GATEWAY_API_KEY`). Keys live in git-ignored `agentoon-video/.env`.
3. No paid call (AI Gateway) without explicit user approval: show model, seconds, estimated USD, then require `--confirm` and `--max-usd`.
4. Never modify a completed video; new episode = new folder + new filename.
5. Label what is real. Renders of code-built scenes are "3D RENDER", not screen recordings. Do not claim a tool that was not used.
6. Original Agentoon robot and logo only.

## 2. Decide the engine
| Need | Engine |
|---|---|
| Deterministic 3D shots, exact brand robot, text, interiors, people, cars | **Blender (bpy)** to PNG frames |
| Fast web-native 3D, floating UI, transitions, 3D type | **Three.js** (headless Playwright frame capture) |
| Interactive 3D page/viewer for sharing | Three.js or React Three Fiber, **hosted on Vercel** |
| Editing, captions, lip-sync, final timeline | **HyperFrames** (primary) |
| Atmospheric B-roll only | **AI Gateway** video model (optional, paid, approved) |
Vercel never "renders" anything in the first four rows.

## 3. Proven workflows
**A. Blender (proven, Ep 10/10b).** venv with PyPI `bpy`; Cycles CPU + denoise; build scene in Python; keyframes (Blender 5: set `preferences.edit.keyframe_new_interpolation_type`); render PNG frames resumable (skip existing); ffmpeg to MP4; composite in HyperFrames. Scripts: `episodes/10-ai-property-design/blender/`.

**B. Three.js headless (proven on the villa branch).**
```
scene.html   -> export window.__render(t)        (pure function of time)
render.mjs   -> chromium.launch({args:[swiftshader flags]})
              for i in 0..N: await page.evaluate(t=>__render(t), i/fps); save PNG
ffmpeg       -> libx264 crf 17 yuv420p faststart
```
Rules: no `Date.now()`/`Math.random()`; seed everything; fixed fps; pin three version; vendor locally (no CDN at render time).

**C. Vercel hosting (proven for the video page).** Static folder with `index.html`, mp4, poster. Deploy to a project in the **Agentoon** scope. Protected by Vercel Authentication unless the user approves public.

**D. AI Gateway clip (optional; code exists on the villa branch, never run here).** `verify-gateway.mjs` checks key and credits; `ai-clip.mjs` generates one clip. Gate: approval card + `--confirm` + `--max-usd`.

## 4. Capability map
| Capability | Engine | State | What must be built |
|---|---|---|---|
| Animated 3D robot mascot | Blender (rig) or Three.js (groups) | **Not built in 3D** (existing robot is SVG) | Model from kit robot colors; idle, wave, point, look; lip-sync via loudness envelope (`B.speak` logic) |
| Futuristic AI environments | Blender or Three.js | Partial (Blender room/terrain scripts reusable) | Environment presets: grid floor, data tunnel, server hall |
| Floating 3D interfaces | Three.js (CSS3D or textured planes of real screenshots) | Not built | Plane-with-screenshot component, parallax drift, drawn highlight |
| Cinematic camera moves | Both | Orbit exists (Three.js demo); Blender keyframed cameras proven | Camera presets: push-in, orbit, crane, whip |
| 3D logo / typography | Blender text objects or Three.js `TextGeometry` | Not built | Load licensed font, extrude, bevel, reveal animation |
| Software/tech demos | Three.js plane with **real** recordings/screenshots on a laptop model | Not built (2D laptop illustration exists) | Laptop model + video texture; zoom to screen |
| 3D transitions | Three.js/Blender shot + HyperFrames | Not built | Zoom-through, cable, shape-grow carriers |
| 3D explainer scenes | Blender + HyperFrames | Proven (property episode) | Per-topic scene scripts |

## 5. Suggested layout (new, create when approved)
```
agentoon-video/3d/
  README.md
  blender/        presets + render_frames.py (resumable)
  threejs/        scene.html, render.mjs, components/{robot,ui-plane,text3d,env}.js
  specs/          *.json shot specs
  out/            (git-ignored) PNG frames
```
Shot spec fields: `fps, size, duration, camera[], objects[], textures[] (real files only), seed`.

## 6. Vercel + AI Gateway setup (credentials stay out of git)
1. Create a **separate Agentoon team/account** project (user action in dashboard). Do not reuse `dawoud-labs`.
2. Hosting project: set Ignored Build Step so only intended branches deploy.
3. AI Gateway: user creates a key named `agentoon-video` with spend limit and expiry; saves it to local `agentoon-video/.env` as `AI_GATEWAY_API_KEY`. Agents never request it in chat.
4. `.env` is git-ignored; commit only `.env.example` with empty values.
5. Verify: run `verify-gateway.mjs` (checks `/v1/credits`, prints balance only, never the key).
6. Before any clip: print model, duration, estimated cost; wait for approval.

## 7. Quality gate for any 3D shot
- Frames rendered to PNG first; MP4 built after.
- Review contact sheet and phone-size crop; check contrast.
- Run existing `final-gate.sh`, `mobile-check.sh`, `no-placeholders.sh`.
- Mark `PREVIEW` if any real recording is missing.

## 8. Open decisions for the user
1. Separate Vercel team for Agentoon (and move `agentoon-property-preview`)?
2. Ignored Build Step on `agentoon.ai`?
3. Public or protected video page?
4. First 3D build: robot mascot (recommended) or floating-UI laptop demo?
5. Any AI Gateway spend at all, and what monthly cap?
