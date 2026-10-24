# Ep 08b — Git vs GitHub v2 (targeted visual upgrade of Ep 08) — exact changes

New video: `out/agentoon-ep08b-git-vs-github-v2.mp4` (1080x1920, 30 fps, H.264+AAC, 56.5 s, -15.3 LUFS, TP -1.4 dBTP). The current version `../08-git-vs-github/out/agentoon-ep08-git-vs-github.mp4` is unchanged.
Note: your file `1000286064.mp4` is not in the sandbox, so I could not watch it. I worked from the project that produced the Git vs GitHub video (Ep 08): same topic, same nine scenes (Git is not GitHub, building a website, Git tracks changes, return to an earlier version, what is GitHub, push/pull, clone, add/commit, final comparison), same narration. The earlier Replica Skill edit (07c) was the wrong video; it is untouched and unrelated.

## 1. Moving light — removed
Source: in `src/index.template.html` a loop (`for (let t = 0.9; …; t += 1.25)`) created `#bm0…` — 420 px full-height gradient bars with `mix-blend-mode:screen` added to the `#fx` overlay and swept across the frame every ~1.25 s (an overlay in the HyperFrames composition; Remotion only supplied the timeline clips and Blender was never part of it). The loop is deleted; the built HTML has no `mix-blend-mode`. The random camera "snap" jumps tied to it were replaced by small eased camera punches (max 1.05x).
Kept: whip/push/iris transitions, the glowing HEAD marker and active-version glow, callouts, chips, robot, subtitles, music, SFX.
Check: column-brightness band detector, strong vertical-band frames 62 of 339 (peak strength 145) in the old render -> 0 of 339 (peak 39) in the new.

## 2. Real software inside animated computers, with zooms
- S2 Building a website: the real Bean Bar site (3 real versions, captured at desktop size) inside a large laptop; it changes with "write code / change the design / add new features"; the real code lines above; camera pushes toward the screen.
- S3 Git tracks changes: the Remotion version-history timeline now plays inside a laptop screen; real `git log` below.
- S4 Earlier version: the website laptop shows before -> after `git restore`; the real command and the timeline (HEAD glides to the earlier commit) are placed so the subtitles never cover them.
- S5 GitHub: real clone data of octocat/Hello-World (files, commit history) on a laptop screen, GitHub logo and cloud.
- S6 Push/pull: GitHub cloud above, your computer below with the real terminal on its screen, vertical animated arrows (up = git push, down = git pull).
- S7 Clone: the repository travels from the cloud to a second computer whose screen shows the real `git clone` output.
- S8 Add/commit: real terminal on a laptop screen, timeline B below with the new commit appearing.
- S1 and S9/S10 unchanged (logos, equals -> not-equals, comparison, Outro).
Same narration, audio, SFX cues, subtitles, colours, robot, scene order and commands.

## Verification (old vs new)
Frame-by-frame sheets at 10 timestamps: software is much larger (laptop screens 656-856 px wide vs 300-440 px floating panels), text is readable, no captions over commands (checked S4 specifically), no new artifacts. validate-render: 0 failures; no-placeholders PASS; no silence >= 1 s; 1080x1920.
Motion profile: mean energy 1.6 (was ~4.4 with the beams); no static stretch >= 2.5 s.

## Limits
- github.com/git-scm.com pages cannot be opened from this sandbox, so no real GitHub web page is shown; real repository data from a real `git clone`/`git log` is shown instead, labelled. Push/pull ran against a local bare repo (labelled).
- Blender, Pexels, Shotcut unavailable here and not used; Remotion = the two timeline clips (unchanged from Ep 08).
