# FMC Skills Registry

Single source of truth for what FMC video production can use, with **evidence-based** status. Checked mechanically by `npm run verify:skills` (non-rendering). Update this file whenever something is installed, removed or tested — never record a capability as working without evidence.

**Status vocabulary**
- **INSTALLED** — present on disk and enabled (plugin) or committed (project skill/code), verified.
- **CONFIGURED** — wired into FMC rules/settings/guards so future sessions use it correctly.
- **TESTED** — a capability was actually exercised; evidence stated.
- **NOT AVAILABLE** — not installed / not usable (also used for deliberate exclusions).

Environment note: plugins are installed at *user scope* in the container's `~/.claude`; the repo's `.claude/settings.json` (repo root and `FMC-Medical-Video-Studio/`) declares the marketplaces and enabled plugins so a fresh container/session is offered the same install. Fresh-session discovery was tested from both working directories (see `docs/v7/PERSISTENCE_CHECKLIST.md`).

## Registry (machine-checked)
```json skills-registry
[
  {
    "id": "fmc-video-producer",
    "name": "FMC Video Producer",
    "repository": "this repository",
    "version": "1.0.0",
    "location": ".claude/skills/fmc-video-producer/SKILL.md (repo root) and FMC-Medical-Video-Studio/.claude/skills/fmc-video-producer/SKILL.md (identical copies)",
    "license": "project-owned",
    "installation": "INSTALLED",
    "capability": "TESTED",
    "invocation": "Skill tool / slash command /fmc-video-producer <topic>; auto-selected for FMC video requests by its description",
    "usedFor": ["every FMC video task: loads CLAUDE.md, routes to approved capabilities, enforces gates"],
    "evidence": "Fresh headless `claude -p` sessions started in the repo root and in FMC-Medical-Video-Studio both list `fmc-video-producer` (count 1). Auto-selection test: for the plain prompt \"Make an FMC video about lower back pain\" a fresh session's first action was the Skill tool call `fmc-video-producer` (one test, one turn; nothing rendered). verify:skills checks frontmatter, copies identical, referenced files exist.",
    "limitations": ["Auto-selection depends on the model matching the description; a session started in a sibling folder will not see it", "Skill is guidance: it cannot render or approve anything"],
    "files": [".claude/skills/fmc-video-producer/SKILL.md", "FMC-Medical-Video-Studio/.claude/skills/fmc-video-producer/SKILL.md"]
  },
  {
    "id": "hyperframes",
    "name": "HyperFrames",
    "repository": "https://github.com/heygen-com/hyperframes",
    "version": "0.8.171 (commit dc0e80e73af1)",
    "location": "plugin cache /root/.claude/plugins/cache/hyperframes/hyperframes/0.8.171 · marketplace /root/.claude/plugins/marketplaces/hyperframes · declared in ~/.claude/settings.json and project .claude/settings.json · CLI via pinned npx (not in package.json) · FMC adapter v7/hyperframes-adapter",
    "license": "Apache-2.0",
    "installation": "INSTALLED",
    "capability": "TESTED",
    "plugin": "hyperframes@hyperframes",
    "invocation": "Reference skills: hyperframes:hyperframes-core, -animation, -keyframes, -creative (and -audio/-cli for reading). CLI only: npm run hf -- lint|check|keyframes|timeline|compositions|info|doctor|docs|preview|snapshot|beats (guarded scripts/hf.mjs, telemetry off)",
    "usedFor": ["motion-graphics / Arabic info-card overlay studies", "GSAP + keyframe inspection", "composition lint/layout/motion checks", "audio-mix concepts (reference only; FMC mixes with scripts/mix-audio.ts)"],
    "evidence": "Plugin enabled (claude plugin list); 21 hyperframes:* skills appear in fresh sessions; `npm run hf -- lint|check|timeline|keyframes` pass on v7/hyperframes-adapter (check: lint 0/0, runtime 0/0, layout 0 issues/9 samples, motion 0/0). Guard wrapper blocks render/tts/cloud/add/publish/auth/transcribe (tests/audio-policy.test.ts).",
    "limitations": ["NOT the FMC renderer (Remotion is); no migration", "Skill /hyperframes:hyperframes claims to be the mandatory entry point for any video request — FMC rules override it; never use it, media-use, or the creation-workflow skills for FMC", "media-use/tts/auth/cloud use HeyGen accounts or catalog music/SFX — blocked", "registry blocks may ship SFX wavs and glitch/CRT looks — `add` blocked", "render, snapshot, studio preview and Arabic contrast (transparent overlay gives 0/0 text checks) not verified", "plugin install notice: bun.lock workspace packages not installed (CLI works via npx)", "~4.1k always-on tokens per session"],
    "files": ["scripts/hf.mjs", "v7/hyperframes-adapter/index.html"]
  },
  {
    "id": "lemo-opuscar",
    "name": "Lemo Opuscar",
    "repository": "https://github.com/lemomo-ai/lemo-opuscar",
    "version": "v0.1.0 (commit 508848acb2b4)",
    "location": "plugin cache /root/.claude/plugins/cache/lemolab/lemo-opuscar/508848acb2b4 · marketplace /root/.claude/plugins/marketplaces/lemolab · declared in ~/.claude/settings.json and project .claude/settings.json",
    "license": "MIT",
    "installation": "INSTALLED",
    "capability": "CONFIGURED",
    "plugin": "lemo-opuscar@lemolab",
    "invocation": "/lemo-opuscar:lemo-opuscar (its first step clones the library to ~/lemo-opuscar and prints LIB=). For FMC prefer the in-repo adaptation docs/v7/FMC_DIRECTING_SYSTEM.md",
    "usedFor": ["creative direction", "storyboarding", "camera composition", "lighting", "visual continuity", "pacing"],
    "evidence": "Plugin enabled; skill `lemo-opuscar:lemo-opuscar` appears in fresh sessions. DIRECTOR.md and TECHNIQUE.md were read and adapted as grammar into the directing system (tests/camera-and-style.test.ts covers the styles/selector). The plugin's own setup/clone/deps/render tools were NOT run.",
    "limitations": ["Guidance only; none of its renders, voice, music or tooling is verified or wanted", "Its sound-design advice (foley/SFX on every action, SFX as transitions) must NOT be applied", "Styles are tuned for Claude Opus 5.5 per its README; 'deps' would download ~350 MB+ — not for FMC", "Do not copy its styles, characters or demos"],
    "files": ["docs/v7/FMC_DIRECTING_SYSTEM.md", "src/lib/directorStyles.ts"]
  },
  {
    "id": "claude-animation-base",
    "name": "Claude Animation Base (principles)",
    "repository": "https://github.com/JohnHeibel/ClaudeAnimationBase",
    "version": "commit 0ac8bf2b3194 (read-only reference)",
    "location": "no plugin; FMC implementation in src/components/Doctor/actingPrinciples.ts + docs/skills/claude-animation-principles.md",
    "license": "MIT (code); sample character 'Clawd' not used",
    "installation": "NOT AVAILABLE",
    "capability": "TESTED",
    "invocation": "none (no installable skill). Read docs/skills/claude-animation-principles.md; use Clip.acting / GESTURE_ACTING in the doctor engine",
    "usedFor": ["gesture anticipation/overshoot", "movement timing", "acting plan per scene", "reactions", "eye/head lead"],
    "evidence": "actingEase curve unit-tested (tests/camera-and-style.test.ts); anim:qc after enabling: 0 snap frames, max joint step 0.32 rad/frame, planted feet 0 cm/frame; standards:qc checks gesture repetition/acting coverage.",
    "limitations": ["2D p5.js starter — not installed or run", "Resulting 3D motion not yet reviewed as video", "explain gesture needs variants; no finger-articulation or phoneme-accurate lip-sync upgrade"],
    "files": ["docs/skills/claude-animation-principles.md", "src/components/Doctor/actingPrinciples.ts"]
  },
  {
    "id": "continuous-camera-transitions",
    "name": "Original continuous-camera transitions",
    "repository": "original FMC code (concept only inspired by public OneTake idea)",
    "version": "1.0 (V7)",
    "location": "src/lib/cameraFlow.ts, src/lib/continuousTransitions.ts, docs/skills/continuous-camera-transitions.md",
    "license": "project-owned",
    "installation": "NOT AVAILABLE",
    "capability": "TESTED",
    "invocation": "import transitionKeys/revealAt/sampleCameraFlow (sampleCamera already uses the C1 sampler)",
    "usedFor": ["doctor→spine", "spine→explanation", "explanation→treatment", "treatment→closing", "no slide-to-slide cuts"],
    "evidence": "5 camera tests (path through keys, C1 continuity, through-key speed, hold rest, no overshoot) + transition tests (sfx null, 1.3–3 s, bounded speed, reveal 1/0→0/1) pass; sampler live in all renders.",
    "limitations": ["'NOT AVAILABLE' = no external skill exists or is wanted; this is project code", "Presets not yet used by a topic script; motion not reviewed as video", "No code/assets from OneTake (PolyForm Noncommercial) — never install it"],
    "files": ["src/lib/cameraFlow.ts", "src/lib/continuousTransitions.ts", "docs/skills/continuous-camera-transitions.md"]
  },
  {
    "id": "collage-broll",
    "name": "Original collage B-roll",
    "repository": "original FMC code (idea only; gbro-collage-broll NOT used)",
    "version": "0.1 (study)",
    "location": "src/components/Collage/index.tsx, src/compositions/CollageStudy.tsx, docs/skills/paper-collage-broll.md",
    "license": "project-owned",
    "installation": "NOT AVAILABLE",
    "capability": "TESTED",
    "invocation": "import CollageField/PaperCutout/AssemblePiece; optional, awareness/prevention topics only",
    "usedFor": ["health-awareness", "prevention tips", "simple education"],
    "evidence": "3 unit tests (deterministic cut paths, stepped time, module is silent/local with no network or paid-API references); one rendered still of CollageStudy reviewed (halftone paper cut-outs, real Arabic text layer).",
    "limitations": ["Early study: no icon/object library or scene templates", "Only a still was checked; no motion test", "Never for anatomy", "gbro-collage-broll's paid Gemini video generation is not enabled and no key was requested"],
    "files": ["src/components/Collage/index.tsx", "docs/skills/paper-collage-broll.md"]
  },
  {
    "id": "onetake",
    "name": "OneTake",
    "repository": "https://github.com/feitangyuan/onetake",
    "version": "not installed",
    "location": "none (clone deleted)",
    "license": "PolyForm Noncommercial 1.0.0 — commercial use not permitted",
    "installation": "NOT AVAILABLE",
    "capability": "NOT AVAILABLE",
    "invocation": "never",
    "usedFor": [],
    "evidence": "Licence read; excluded deliberately.",
    "limitations": ["FMC is a commercial clinic: no code, assets or templates may be used"],
    "files": []
  },
  {
    "id": "gbro-collage-broll",
    "name": "Collage B-roll (gbro-collage-broll)",
    "repository": "https://github.com/pyang5166/gbro-collage-broll",
    "version": "not installed (commit a1a4ee2e2abf reviewed)",
    "location": "none",
    "license": "MIT",
    "installation": "NOT AVAILABLE",
    "capability": "NOT AVAILABLE",
    "invocation": "never",
    "usedFor": [],
    "evidence": "README/SKILL read: workflow requires paid Gemini Omni Flash video generation + GEMINI_API_KEY + Codex image_gen. Not installed or run.",
    "limitations": ["Paid API — never activate; use src/components/Collage instead"],
    "files": []
  },
  {
    "id": "fmc-audio-policy",
    "name": "FMC audio policy + QC (project components)",
    "repository": "this repository",
    "version": "V7",
    "location": "src/lib/audioPolicy.tsx, scripts/audio-qc.ts, scripts/mix-audio.ts, scripts/hf.mjs, tests/audio-policy.test.ts",
    "license": "project-owned",
    "installation": "INSTALLED",
    "capability": "TESTED",
    "invocation": "npm run audio:qc [-- --video f.mp4 --stems dir]; automatic after mix-audio; npm test",
    "usedFor": ["no-SFX enforcement", "loudness/peak/clipping/transient checks", "music-bed heuristics"],
    "evidence": "11 policy tests incl. end-to-end refusal of an effect without approval and negative fixtures (raw <Audio>, <audio> in v7/); audio:qc passes on the repo.",
    "limitations": ["Cannot judge listening comfort; piano absence unprovable; duplicate-effect detection is static"],
    "files": ["src/lib/audioPolicy.tsx", "scripts/audio-qc.ts"]
  },
  {
    "id": "fmc-standards-arabic-qc",
    "name": "FMC standards & Arabic QC (project components)",
    "repository": "this repository",
    "version": "V7",
    "location": "scripts/standards-qc.ts, lib/arabic-qc.ts, config/pronunciation.json, src/lib/fmcStandards.ts",
    "license": "project-owned",
    "installation": "INSTALLED",
    "capability": "TESTED",
    "invocation": "npm run standards:qc, npm run arabic:check -- <slug>, npm run qc:all",
    "usedFor": ["character/framing/typography/logo checks", "Arabic spelling/brand/services/claims/contact-details checks"],
    "evidence": "8 Arabic/brand tests + 11 camera/style tests pass; standards:qc runs on repo and on rendered files.",
    "limitations": ["Arabic grammar, pronunciation, medical accuracy need humans; lexicon entries are machine-drafted (humanReviewed:false)", "standards:qc currently FAILs on one locked-script item (13-word safety card) awaiting owner decision"],
    "files": ["scripts/standards-qc.ts", "lib/arabic-qc.ts", "config/pronunciation.json"]
  }
]
```

## Human-readable summary
| Capability | Installation | Capability status | Where |
|---|---|---|---|
| FMC Video Producer skill | INSTALLED | TESTED (discovery) | `.claude/skills/fmc-video-producer/` (root + FMC copy) |
| HyperFrames 0.8.171 | INSTALLED | TESTED (lint/check/timeline/keyframes) | plugin cache path above; adapter `v7/hyperframes-adapter` |
| Lemo Opuscar | INSTALLED | CONFIGURED (guidance adapted; plugin tools not run) | plugin cache path above |
| Claude Animation Base | NOT AVAILABLE (no skill) | TESTED (project implementation) | `actingPrinciples.ts` |
| Continuous-camera transitions | project code | TESTED | `src/lib/cameraFlow.ts`, `continuousTransitions.ts` |
| Collage B-roll | project code | TESTED (unit + one still) | `src/components/Collage` |
| OneTake | NOT AVAILABLE (licence) | — | — |
| gbro-collage-broll | NOT AVAILABLE (paid API) | — | — |

## Actual commands (verified)
- `claude plugin list` → shows `hyperframes@hyperframes 0.8.171` and `lemo-opuscar@lemolab 508848acb2b4`, user scope, enabled.
- `npm run hf -- lint | check | timeline | keyframes` (guarded; others refused with exit 3).
- `npm run verify:skills` (add `-- --fresh-session` to also start a headless `claude -p` session and check skill discovery; it makes one tiny model call).
- `npm run audio:qc`, `npm run standards:qc`, `npm run arabic:check -- <slug>`, `npm run qc:all`, `npm test`, `npm run anim:qc`.
