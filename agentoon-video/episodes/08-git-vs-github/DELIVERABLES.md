# Ep 08 — Git vs GitHub (final)

Video: `out/agentoon-ep08-git-vs-github.mp4` — 1080x1920, 30 fps, H.264 + AAC, **56.5 s**, -15.3 LUFS, true peak -1.4 dBTP, narration 168 wpm (voice only), no silence >= 1 s, `no-placeholders.sh` PASS, motion mean 4.4 / 37 bursts per min / longest gap 2.0 s.
Source: `src/index.template.html` + `build.py` (HyperFrames), `remotion/` (timeline clips), `episode.json`, `cues.json`. Subtitles: `subtitles.srt` (42 cues). Transcript: `narration-transcript.txt`.

## Narration (follows the 9-step sequence of your brief)
Think Git and GitHub are the same thing? They're not! / Imagine you're building a website. You write some code, change the design, and add new features. / Git keeps track of those changes, so you have a history of your project. / If something goes wrong, Git helps you find and recover an earlier version. / GitHub is different. It's an online platform where you can store and share Git repositories. / Use git push to send your commits to GitHub, and git pull to bring remote changes back. / With git clone, you can copy a repository onto another computer. / And git add and git commit let you stage and save a snapshot of your changes. / So remember: Git tracks your project's history. GitHub hosts and shares repositories online. / Follow Agentoon dot A I for more!

## Which tools actually contributed
| Tool | Used? | What it did |
|---|---|---|
| HyperFrames + Agentoon kit | YES (composition engine) | all scenes, robot, camera moves, whip/push/iris transitions, kinetic subtitles, Outro, audio mix |
| Remotion 4.0.505 | YES | the Git version-history timeline (perspective tilt, HEAD marker gliding back to an earlier commit, new commit appearing): `remotion/`, rendered to `assets/timeline-a.mp4` (scenes 3-4) and `timeline-b.mp4` (scene 8), composited as video layers |
| Real `git` 2.43 | YES | every command/transcript on screen (`data/*.txt`, `data/record.sh`) |
| Playwright + Chromium | YES | real browser screenshots of the website at each commit (`assets/site-*.png`) |
| Kokoro TTS, synth music/SFX | YES | narration, mix (existing workflow; small kit addition: optional per-phrase `pad` silence) |
| Blender | NO | not installed / no Blender MCP in this sandbox. The 3D look is a CSS-perspective Remotion timeline, not Blender. |
| Pexels | NO | api/images unreachable from the sandbox and no stock footage helps the story |
| Shotcut / melt | NO | not installed; ffmpeg/HyperFrames encode, no re-encode step needed |
| Lemo Opuscar | NO (style grammar only) | no new editorial pass beyond the existing Agentoon pacing |

## Real vs. not real (be careful what you claim)
- REAL: the website project and its 3 commits (+ the pulled commit and "Update website"), all terminal output shown for git log / restore / push / pull / clone / status / add / commit, the browser previews, the real `git clone https://github.com/octocat/Hello-World.git` and its real `git log`.
- Logos: the official Git and GitHub marks (simple-icons 16.35.0, CC0 artwork; trademarks remain Git's/GitHub's). Licence file in `assets/`.
- NOT captured: **github.com and git-scm.com web pages** — both are unreachable from this sandbox (proxy blocks them), so there is no screen recording of the GitHub site. The GitHub scene is an Agentoon card with the real clone data of octocat/Hello-World (files + commit list) captioned "REAL REPOSITORY DATA", not a drawn imitation of GitHub's UI.
- push/pull ran against a **local bare repository** acting as the remote (captioned "REMOTE = LOCAL BARE REPO · SAME COMMANDS WORK WITH GITHUB"); I did not create or push to a repo on your GitHub account (that would publish content; say the word if you want it).
- The reference video `1000286159.mp4` was not in the sandbox; the sequence follows the scene script in your brief exactly.
- The displayed command `git commit -m "Update website"` is the one run (the transcript's shell echo dropped the quotes only).
- Scene 4 uses `git restore --source=<hash> .` to recover the earlier version (no claim that Git saves every keystroke).

## QC report
PASS: format, duration (56.5 s, under 60), loudness/true peak, silences, no placeholder/preview text, no stray dot or cursor artifact seen in the sampled frames (20 frames + every scene snapshot), robot present in every scene, captions clear of code (after moving chips/robots), single Follow CTA ("Follow @agentoon.ai", "Real AI Tools • Skills • Automation").
Fixed during QC: wrapped code lines, empty code card, robot covering timeline labels, a chip hidden under captions, zoom crops.
Open notes: validator's "140 wpm" warning is computed over the whole video length (voice-only pace is 168 wpm); the timeline MP4s have a solid panel background rather than transparency; I did not listen to the audio, only measured it.
