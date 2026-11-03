---
name: figma-to-remotion
description: Turn a Figma file into an Agentoon.ai vertical video. Reads frames through the Figma MCP, writes agentoon-remotion/episodes/<slug>/episode.json plus assets, then renders MP4 1080x1920 with Remotion. Use when the user gives a Figma URL and wants a video / reel / episode.
---

# Figma → Claude Code + Figma MCP → Remotion → MP4 1080×1920

Project: `agentoon-remotion/`. Spec schema: `src/types.ts`. Sample: `episodes/sample/episode.json`.
Never modify or re-render an approved episode; every video gets its own `episodes/<slug>/`.

## Figma conventions (tell the designer once)
- One page per episode. Each **top-level frame = one scene**, size **1080×1920**, ordered top→bottom / left→right.
- Frame name: `S01_hook`, `S02_problem`, … (`S##_name`). Frame background fill → scene `background`.
- Layer names drive behaviour: `title`, `sub`, `card`, `img:hero` (raster → image layer), `bg:photo` (full-bleed image).
- Animation tag in layer name after `@`: `title@fadeUp`, `card@scaleIn`, `badge@pop`, `x@slideLeft`; optional delay `@fadeUp+0.4` (seconds). Default `fadeUp`. Tags: fadeIn fadeUp fadeDown slideLeft slideRight scaleIn pop none.
- Scene length: frame description / name suffix `_3s`; otherwise derive from narration timing.
- Keep text inside the safe area: x 60–1020, y 250–1580.

## Workflow
1. **Get the file key + node ids** from the URL (`/design/:fileKey/...?node-id=1-2` → `1:2`). No URL → ask for one. Check access with `whoami` if calls fail.
2. `create_session(fileKey, "Render <slug> as vertical video")`; reuse the returned `sessionId` on every file tool.
3. `get_metadata(fileKey, nodeId=<page id>)` → list top-level frames (IDs, names, sizes). Reject frames not 1080×1920 and tell the user.
4. Per frame: `get_design_context` (load the `figma-design-to-code` skill first) for text, fonts, colors, layer boxes; `get_variable_defs` once for brand tokens; `get_screenshot(maxDimension=1920)` as visual reference.
5. `download_assets` per image/vector layer (and the frame `export` if a layer cannot be rebuilt natively). Save to `agentoon-remotion/public/episodes/<slug>/assets/` using the temporary URLs promptly (curl).
6. **Build native layers, don't flatten**: text → `text` layer with real fontFamily/size/weight/color/box (x,y,w,h in Figma px — 1:1 with the 1080×1920 canvas); rectangles/gradients → `rect`; photos → `image` (`src` relative to `public/`). Flatten a frame into a single `image` layer only for complex vector art, and say so.
7. Fonts: download/export the Figma fonts as `.woff2` to `public/fonts/`, list in `fonts[]`. Never rely on network fonts at render time.
8. Narration/music (only if the user supplied files or approved free local TTS): put in `public/episodes/<slug>/audio/`, set `audio`, then set scene `duration`s so they match the voiceover. Add `captions[]` (seconds on the global timeline).
9. Write `episodes/<slug>/episode.json` (`meta.slug` = folder name, `fonts`, `scenes`, `captions`). Record `meta.figma = {fileKey, nodeIds}`.
10. `cd agentoon-remotion && npm install` (first time), then `npm run validate -- <slug>`; fix all ERRORs, review warnings.
11. Visual check: `npm run still -- <slug> --frame=<n>` for the first frame of each scene; compare with the Figma screenshot; fix drift.
12. `npm run render -- <slug>` → `out/<slug>-1080x1920.mp4` (h264, yuv420p, ffprobe printed). Deliver path + duration + warnings.

## Rules
- Never invent claims, metrics, demos or logos; use only what is in Figma or provided by the user. Never show keys/passwords/email.
- Hook within 0–2 s; a new visual beat every 2–4 s; first scene ≤ 3 s.
- Offline/sandbox: `render.mjs` uses `/opt/pw-browsers/chromium` or `$BROWSER_EXECUTABLE`.
- Preview interactively: `npm run dev` (set `"debug": true` in the JSON to overlay the safe area).
- Re-sync after Figma edits: re-run steps 3–11 for changed frames only; keep ids stable (`<scene>-<layername>`).
