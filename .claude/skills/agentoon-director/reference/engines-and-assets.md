# Engines and assets (audited 2026-10-31; re-run scripts/check-env.sh before relying on it)

| Item | Status | Notes |
|---|---|---|
| HyperFrames CLI 0.8.x + GSAP | VERIFIED, used for episodes 0-14 | `npx hyperframes check` / `snapshot` / `render`; user-level skills `/hyperframes*` exist: reuse, do not duplicate |
| Remotion | Projects exist (`remotion-studio`, `remotion-video`, `remotion-claude`) but `node_modules` are not installed here | Install in a scratch copy; this sandbox needs `REMOTION_USE_LOCAL_CHROME=1` and the preinstalled Chromium (see `agentoon-video-producer/references/remotion-blender.md`). Existing components: `remotion-studio/src/components/{AnimatedClip,AnimatedText}.tsx`, `lib/{audio,effects,types}.ts`; do not rebuild them |
| Blender | App not installed; `bpy` 5.2.3 works headless in a venv (`/tmp/bpyenv`) | Cycles CPU, PNG frames. No GUI recordings. Blender MCP not connected in the cloud. No Blender robot rig exists in the repo (only `property*.blend` scenes) |
| FFmpeg | VERIFIED | encode, loudnorm, reframing |
| Shotcut | NOT installed | optional finishing only; never claim it |
| Pexels | Needs `PEXELS_API_KEY` and network access to api.pexels.com / images.pexels.com | check-env.sh reports reachability; licensed stock only, never presented as the real subject |
| Kokoro TTS | VERIFIED at `/tmp/kokoro` (recreate per `agentoon-video/kit/README.md`) | local voice; `kit/py/build_audio.py` |
| Robot | `agentoon-video/kit/robot.js` (original 2D SVG character: lip-sync `speak`, `aimPoint`, `react`, `outro`...), `kit/outro.js`, docs `references/robot-acting.md` | Do not redesign |
| Kit | `kit/{camera,captions,collage,term,blueprint,nightops,outro,robot}.js`, `kit/snippets/laptop-screen.js`, `kit/agentoon.css`, fonts Fraunces / Inter / JetBrains Mono | per-episode copy via `agentoon-video/new-episode.sh` |
| Production scripts | `.claude/skills/agentoon-video-producer/scripts/{validate-render,motion-profile,mobile-check,no-placeholders,final-gate}.sh` | used by `/agentoon-qc` |
| Style references | Lemo Opuscar (MIT, style grammar), ClaudeAnimationBase (MIT, character principles), OneTake (PolyForm NC: ideas only, never copy code/assets) | per `agentoon-video-producer/SKILL.md` |
