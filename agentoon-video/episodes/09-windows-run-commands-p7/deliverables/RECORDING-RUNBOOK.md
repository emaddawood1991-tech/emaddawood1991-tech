# Ep 09 — Recording the REAL Windows clips (6 short clips)

Why: this sandbox is Linux; it cannot open the real Windows Run dialog or any of these tools, and Microsoft's documentation sites (learn.microsoft.com, support.microsoft.com) were not reachable from it, so nothing Windows-related was fabricated. The preview shows labelled "RECORDING SLOT" frames. Record the clips on your own Windows PC (a test PC if possible), drop them in `assets/`, and the build swaps them in.

## Rules
- Do NOT change anything: no importing/deleting certificates, no iSCSI connections, no ODBC data sources, no folder-option changes. Look, then close with the X / Cancel.
- No personal information on screen (certificate lists can contain your name/employer: record only the left folder tree, or use a clean test account; blur/crop otherwise).
- Record the full screen at 1920x1080 (Xbox Game Bar `Win+Alt+R`, or Snipping Tool video, or OBS). 5–6 s per clip. Move the mouse slowly; do not click inside the tools.
- Do not reuse Microsoft's own screenshots/videos unless their reuse terms allow it; your own recording of your own screen is what we use.

## Clips (file name -> what to record)
| File | Record | Notes |
|---|---|---|
| `c0.mp4` | Press `Win+R`: the Run dialog opens (empty). 3 s. | Real Run dialog; hide taskbar clutter if you can. |
| `c1.mp4` | Run: type `certmgr.msc`, Enter. Certificate Manager (Certificates – Current User) opens. Expand nothing; hover the left folder tree (Personal, Trusted Root Certification Authorities...). | Do not open/export any certificate. |
| `c2.mp4` | Run: type `psr`, Enter. If Steps Recorder opens: show its small toolbar (do not click Start Record), then close. If Windows shows an error / nothing opens: record that genuine response. | Narration says "on older Windows versions": that's accurate either way. Microsoft lists Steps Recorder among deprecated features; its availability depends on your Windows build, so record what your PC really does. |
| `c3.mp4` | Run: `control folders`, Enter. File Explorer Options opens; click the **View** tab (clicking a tab changes nothing); show "Hidden files and folders" and "Hide extensions for known file types". Cancel. | Do not tick any box. |
| `c4.mp4` | Run: `iscsicpl`, Enter. First run may ask "The Microsoft iSCSI service is not running... start the service now?". That prompt STARTS A SERVICE (and sets it to start automatically). Safest: record on a test PC, answer Yes, show the iSCSI Initiator Properties (Targets / Discovery tabs), close with Cancel. If you prefer not to start it, record the genuine prompt, answer No, and tell me: I'll change the scene text. | Do not enter a target or Connect. |
| `c5.mp4` | Run: `odbcad32`, Enter. ODBC Data Source Administrator opens (64-bit on 64-bit Windows). Hover/click only the tabs (User DSN, System DSN, File DSN, Drivers, Tracing...). Close. | Do not Add/Configure/Remove any data source. |

## Put them in
1. Copy the 6 files to `assets/` (c0.mp4 ... c5.mp4). 1080p, H.264 is fine.
2. In `data/slots.json` set for each clip `"status": "verified"`, `"file": "cN.mp4"`, and optionally `"highlight": {"x":0.1,"y":0.1,"w":0.5,"h":0.3}` (fractions of the clip frame: the part to ring and zoom into, e.g. the left folder tree for c1, the View tab for c3, the tab row for c5).
3. `python3 build.py && /tmp/kokoro/venv/bin/python ../../kit/py/build_audio.py mix mix.json` then `npx hyperframes render --quality delivery --fps 30 -o out/agentoon-ep09-windows-run-commands-p7.mp4`.
4. Set `"preview_banner": false`, run `bash ../../../.claude/skills/agentoon-video-producer/scripts/no-placeholders.sh .` (must PASS), validate-render, motion-profile.
