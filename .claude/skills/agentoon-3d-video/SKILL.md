---
name: agentoon-3d-video
description: On request only. Builds a 3D scene as a finished MP4 (architecture, villas, landscaping, pool, trees, sun and shadows, orbit or fly-through camera) with code-generated Three.js, and edits videos (trim, resize to 9:16, speed, join with cross-fades, mix audio, contact sheet). Use when the user asks for something 3D, an architectural or landscape visualization, or to edit, join or assemble video clips. Do not use otherwise.
---

# Agentoon 3D + video edit

Free and local. No API keys, no paid calls. Runs only when the user asks for something 3D or to edit a video.

## Find the tools

`TOOLS` is the first folder that exists: `${CLAUDE_SKILL_DIR}/scripts`, `$AGENTOON_VIDEO_DIR`, `./agentoon-video`. It contains `threejs/render.mjs`, `edit.mjs` and `agentoon-tool.mjs`.

One-time setup (skip if `TOOLS/threejs/node_modules/three` exists): `npm install` inside `TOOLS/threejs`. Needs Node 18+, FFmpeg on PATH, and Playwright Chromium (`npx playwright install chromium` only if missing). Check first, do not reinstall working tools.

## 3D video

1. Turn the request (text and/or reference images) into a **scene spec JSON**. Fields are in `spec-reference.md`. Start from `TOOLS/threejs/specs/demo-orbit.json`.
   With reference images: match proportions, floors, roof, glazing, materials, palette, landscaping and light, then say what you could not match.
2. Render a **preview** first: `node TOOLS/agentoon-tool.mjs render_3d_video '{"spec": <spec or path>, "out": "out/<name>-preview.mp4", "width": 540, "height": 960, "frames": 24, "contact_sheet": "out/<name>-sheet.png"}'`
3. **Look at the frames** (open the contact sheet or a rendered PNG). Fix the biggest visible problem in the spec: framing, camera height and radius, sun angle, tree density, colours. Re-render. Repeat until it looks right.
4. Render the **final**: same call with `"width": 1080, "height": 1920`, no `frames`, and a new filename (never overwrite an earlier video). About half a second per frame at 720x1280 on a CPU-only machine, slower at 1080x1920.
5. Report the output path, resolution, duration and anything you could not do.

Defaults for vertical video: 1080x1920, 24 fps, camera fov 48-55, one smooth orbit or descent, hook in the first 2 seconds.

## Editing

`node TOOLS/agentoon-tool.mjs edit_video '{"op": ..., ...}'` (or `node TOOLS/edit.mjs <op> ...`):

| op | arguments | does |
|---|---|---|
| info | input | size, fps, seconds, audio |
| trim | input, out, start, end | cut a section |
| resize | input, out, width, height, fps | fill 9:16 (crops the rest) |
| speed | input, out, factor | faster or slower |
| join | inputs[], out, fade | cross-fade clips into one video |
| audio | input, audio, out, lufs | mix music or voice to about -15 LUFS, fade out |
| sheet | input, out, count | contact sheet for review |

Always write to a new output file. Check the result with `info` or `sheet` before saying it is done.

## What this tool cannot do (say so, do not fake it)

- Only `villa`-type buildings, one pool, paths, trees (round, pine, palm) and orbit or position-and-target camera moves are built in. No people, cars, interiors, construction animation or rigged characters.
- To add objects, edit `TOOLS/threejs/builder.mjs` (functions like `villa()` and `roundTree()`), then re-render and look.
- Rigged characters, precise product animation and anything needing a real 3D app: tell the user it needs Blender (their Blender scene: `blender/villa_development.py`).
- It renders stylized low-poly, not photoreal. If the user wants photoreal AI clips, that is a separate paid tool: show provider, model and cost and get approval first.

## Rules

- Never print or ask for API keys. Never make a paid call from this skill.
- Never claim a render ran if it failed: report the error text.
- Keep the user's earlier videos untouched.
