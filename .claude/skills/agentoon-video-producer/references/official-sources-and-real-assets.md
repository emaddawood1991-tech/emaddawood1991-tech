# Official websites and real visual assets (mandatory per video)

Every video folder must contain `data/OFFICIAL-SOURCES.md` **before scenes are designed**. Inspect each source first; never design from memory.

## Template (copy into `episodes/<NN-slug>/data/OFFICIAL-SOURCES.md`)
```
# OFFICIAL WEBSITES & REAL VISUAL ASSETS
| Item | Exact URL / command | Type | Inspected (date, how) | Used in scene | Status |
|---|---|---|---|---|---|
| Official site | https://... | website | Playwright screenshot data/shots/x.png | s2 | verified / needs-recording |
| Repo | https://github.com/<owner>/<repo> | GitHub | git clone + README read | s3 | verified |
| Docs | https://... | docs | read | s4 | verified |
| Logo | official brand/press page URL | logo | downloaded, licence checked | s1 | verified |
| Install | exact command from docs, run locally | command | transcript data/run.txt | s5 | verified |
| Official demo/video | URL + reuse permission | video | licence checked | s6 | verified / not used |
```
## Rules
- Exact official URLs and exact GitHub repo URLs only (owner/name copied from the site, not guessed). Windows tools: learn.microsoft.com page for the tool/command. Claude Code: real session output. AI apps: the real site/interface.
- Real logos only from the official brand/press page; genuine screenshots only (taken by us or official). Third-party footage only if its licence allows reuse; record the licence.
- Install/usage instructions must be verified (run them, or cite the official page and label "FROM OFFICIAL DOCS" if not runnable here).
- Real material goes inside the cinematic treatment (laptop/phone/browser card, zoom to the narrated detail, robot interacting) — never a plain full-frame screen recording, never fabricated.
- A row with status `needs-recording` means the video is a PREVIEW (see `final-approval-gate.md`).
- Sandbox reality check at the top of the file: list which sources were unreachable (e.g. github.com, learn.microsoft.com, Windows-only features) and what exactly the user must record.
## Tool availability (never claim unused tools)
Credits list in the deliverable report only tools actually run for this video (HyperFrames, Remotion, Blender, Pexels, Lemo Opuscar, Shotcut, MCPs). Check availability first (`which`, `npx ... --version`, MCP connected?). If unavailable or unused, write "not used" — never imply otherwise. Use them together only where they help the scene.
