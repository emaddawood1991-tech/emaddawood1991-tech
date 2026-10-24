# Ep 08b — Git vs GitHub: final polish pass (edited in place)

New render: `out/agentoon-ep08b-git-vs-github-v2-polish.mp4` (1080x1920, 30 fps, H.264+AAC, 56.5 s, -15.3 LUFS, TP -1.4 dBTP). Preserved unchanged: `out/agentoon-ep08b-git-vs-github-v2.mp4` (previous render) and `../08-git-vs-github/` (original). Narration, audio, SFX cues, subtitles, branding, robot and the nine educational steps are unchanged.
Note: `1000286170.mp4` is not in the sandbox, so the comparison is against the previous render in this folder.

## What the ratings pointed at, and the fix
- Website presentation (5.5): the Bean Bar page was a tiny, mostly empty page in a big dark screen. Now the website itself was rebuilt as a real, fuller project (nav bar, hero, "Order now" button, menu cards, opening hours) with the same 5 commit messages, re-recorded with real `git` (new hashes: `data/record2.sh`, `data/s*.txt`), and shown in a large laptop with a realistic browser window (traffic-light bar + URL bar). Camera zooms go to the actual changes: plain HTML text -> design added (nav + hero ring) -> menu cards + Order-now button (green rings, "NEW: MENU CARDS"). The white page fades in/out softly (no flash).
- GitHub (visual storytelling): the repository view is now much larger: repo name, PUBLIC badge, branch, real clone URL, file row (README + its real last commit message and date) and the 3-commit history with real hashes, messages and dates (`octocat/Hello-World`, from a real `git clone`/`git log`). It is an Agentoon-styled view of real repository data, labelled as such; github.com's own page cannot be loaded from this sandbox, so it is not shown.
- push / pull / clone: GitHub-remote panel with commit pills above, your computer below; push: three commit pills fly UP into the remote; pull: the new remote commit flies DOWN into your laptop (laptop flashes); clone: the repository's three commits are copied DOWN to a second computer whose terminal then shows the real clone, `ls` and `git log`.
- Mobile readability: bigger laptop screens (800-960 px wide), terminal text 26-28 px, fewer small chips, subtitle-safe layout (nothing important under y~1480, S4 command no longer hidden).
- Remotion: the two timeline clips were re-rendered with the new real hashes and website thumbnails (`remotion/`). Blender, Pexels, Shotcut: not available here; not used.

## Light sweeps
The scan-beam loop was already removed in the previous render (0 of 339 sampled frames show a vertical band, the original `08` render had 62). In this pass I also removed the remaining harsh brightness jumps: the white plain-HTML page now fades in/out (0.45-0.55 s) instead of cutting from white to dark. Intentional effects kept: transitions, HEAD/active glow, rings, robot, captions.

## Checks
validate-render: 0 failures (1080x1920, 30 fps, 56.5 s, -15.3 LUFS, TP -1.4, no silence >= 1 s); no-placeholders PASS; frame comparison old vs new at 6 timestamps; every command on screen is real output from `data/`.
Motion profile: mean energy 2.2, no static stretch >= 2.5 s.
