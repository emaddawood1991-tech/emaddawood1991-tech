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
