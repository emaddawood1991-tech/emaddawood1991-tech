# Remotion and Blender: optional creative tools (additive only)

HyperFrames stays the primary engine and the Agentoon.ai look, robot, transitions, SFX and music are unchanged. Use these only when a shot clearly benefits, and say so in the episode brief.

## Remotion (verified 2026-10-22)
- Projects in the repo: `remotion-video` (Montage, 1280x720, needs missing `public/clip1.mp4`), `remotion-studio` (12 compositions incl. Instagram 1080x1920, FMC*), `remotion-claude` (prompt-to-video; its `npm run gen` CLI calls OpenAI + ElevenLabs = PAID, never run without approval). Do not create a duplicate project; reuse these or a scratch copy.
- Versions: Remotion 4.0.505, React 19.2.3, Node 22.22, npm 10.9. No `node_modules` committed and no root `.gitignore`: install and render in a scratch copy (`tar` the project to the scratchpad, `npm ci`), never in the repo, so the git tree stays clean.
- This sandbox cannot download Remotion's Chrome (remotion.media is blocked). Use the preinstalled shell: `npx remotion render <entry> <Comp> out.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` (the full `chrome` binary is rejected). Smoke test: 60-frame 1080x1920 H.264 rendered in 8 s.
- Licence: free for individuals and for-profit orgs up to 3 employees; larger for-profit companies need a company licence. Confirm eligibility before any commercial use.
- Where it helps (render a shot as MP4, then place it in the HyperFrames scene as a muted `<video>`): word-synced kinetic subtitles (`@remotion/captions`), typed command/terminal animations driven by frame math, `@remotion/transitions` presets, data-driven charts, and embedding real website/software clips with `OffthreadVideo` plus precise crop/zoom. Keep narration timing from `audio/timing.json`.
- Not a replacement: never re-render a finished episode in Remotion; never swap the robot, the Outro, or the kit transitions.

## Blender (status 2026-10-22: not installed or connected in this sandbox)
- If a Blender MCP is connected (blender-mcp), verify with a scene inspection first. Use it for true 3D shots (product turntables, orbiting objects, camera orbits) rendered to PNG sequence or MP4, then composite into HyperFrames as a muted video layer.
- Keep Blender output on the Agentoon palette; label concept renders as concept, never as a tool's real output.

## Update (Ep 08, 2026-10-24)
- Remotion was used for real in Ep 08: a React timeline composition rendered to two 1000x620 MP4s (props from `audio/timing.json` + real git log), placed in HyperFrames as muted `<video>` layers with `data-media-start` so one render spans two scenes. Project source kept in `episodes/08-git-vs-github/remotion/` (no node_modules). `npm install` in a scratch dir, render with the headless-shell flag above.
- Blender, Pexels, Shotcut: still unavailable in this sandbox (checked again). Do not claim them; say so in the production report.
- `kit/py/build_audio.py tts` accepts an optional per-phrase `"pad": seconds` of extra silence after a phrase (keeps gaps under ~1 s; used to hit a 55-60 s length without changing the script).

## Update (Ep 10, 2026-10-27): real Blender IS available headless via `bpy`
- `pip install bpy` works here (PyPI reachable; Blender 5.2.3 LTS, GPL-3.0, ~400 MB wheel, Python 3.13). Install in a scratch venv, never in the repo: `python3 -m venv /tmp/bpyenv && /tmp/bpyenv/bin/pip install bpy`.
- It is real Blender (Cycles CPU + OpenImageDenoise), headless: no viewport/UI, so it can NOT supply a screen recording of the Blender interface. Do not present a render as the Blender UI. EEVEE needs a GPU: use Cycles with ~12-48 samples + denoise (1080x1920 still ~60-140 s on 4 cores; 720x1280 animation frame ~14 s).
- Pattern used in `episodes/10-ai-property-design/blender/`: `build_property.py` builds the editable `.blend` (collections per design stage), `render_stage.py <stage> <camera> <out> [w h samples] [--frames f0 f1 orbit|walk]` renders stills/frame sequences, `render_all.sh` batch. Encode PNG sequences with ffmpeg and place as muted `<video>` layers.
- Blender 5.x gotchas: `view_transform` AgX washes out desert colours (use Standard + exposure -0.3); Sky texture `MULTIPLE_SCATTERING` works; keep world strength ~0.12 with a sun lamp ~3.0; stagger heights of overlapping coplanar boxes (z-fighting shows as black patches).
- Claude Code here wrote and ran the scripts; that is "Claude Code + Blender (bpy)", not a Blender MCP session. Say which when crediting.
