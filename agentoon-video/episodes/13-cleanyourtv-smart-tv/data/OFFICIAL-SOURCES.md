# OFFICIAL WEBSITES & REAL VISUAL ASSETS · Ep 13 "Claude Code Can Transform Your Smart TV!"

## What was inspected (this session, 2026-10-30)
| Source | How checked | Result |
|---|---|---|
| CleanYourTV GitHub repo https://github.com/Gathin23/cleanyourtv | `git clone` of commit `31092430837970dd9b2579270008d9b5a285c7cb` (committed 2026-10-30 21:48 +0530); README.md, PROMPT.md, SECURITY.md, docs/restore.md, docs/faq.md, examples/xiaomi-mi-tv-4a/debloat.txt read directly | Snapshots in `data/` (`cleanyourtv-README-snapshot.md`, `cleanyourtv-PROMPT-snapshot.md`, `xiaomi-mi-tv-4a-debloat.txt`, `cleanyourtv-commit.txt`). Licence: MIT (`data/cleanyourtv-LICENSE.txt`, (c) 2026 Gathin) |
| github.com web page (browser view) | not reachable in the sandbox (403 for the page; git and raw.githubusercontent.com work) | No github.com screenshot exists. The video shows README text and project images instead and labels them as such |
| https://cleanyour.tv | no response from the sandbox | Not captured. Named as the official site because the README says so ("Official links: cleanyour.tv and this repo") |
| https://developer.android.com/tools/adb | HTTP 200 | Not captured on screen; ADB is named in text only |
| Claude Code docs, Blender, Remotion, Pexels, Gemini | not needed for the verified story | Not shown. No Claude Code recording was made |
| Reference video `1000287323.mp4` | not in the session uploads | **Not received, not studied.** The storyboard in the brief was followed instead; nothing from it was reused |

## Real assets used on screen (all from the MIT repo, `docs/`)
`banner.png` (CleanYourTV logo + tagline "Your TV, minus the ads."), `stock-home.jpg` (stock Google TV home with a "Sponsored" row), `new-home.jpg`, `stock-vs-new-side.jpg` (project's BEFORE/AFTER), `focus-2-up-netflix.png`, `app-library.jpg`, `inputs-menu.jpg` (copied to `assets/cytv-*`). These are the project's own photos and screenshots of **its authors' TVs, not a TV tested in this production**.

## Text taken verbatim from the project
- README "How it works": "No root, no cable, nothing uninstalled, and a one-line restore if you change your mind."; developer-options steps; `export TV_HOST` and `tools/tv.py --probe` commands
- `examples/xiaomi-mi-tv-4a/debloat.txt`: header comments and package names (excerpt)
- README "Restoring your TV": the `restore.sh` command (wrapped for the screen)
- README "Supported TVs": Android TV/Google TV supported; Fire TV debloat only; Samsung Tizen, LG webOS, Roku, Vizio, Hisense VIDAA not supported (no ADB)
- SECURITY.md: debugging should be turned off when done
- README/FAQ: it does not remove YouTube ads, only partly blocks in-app ads via Private DNS (basis for "won't remove every ad inside streaming apps")

## Not used / not claimed
No stars, download counts, press numbers or per-model compatibility figures were shown. No TV, ADB session, package change or launcher install was performed in this production.

## MUST RECORD to make it FINAL
1. A real, authorised TV (model and Android version confirmed) running the real workflow: backup, owner-approved package review, launcher install, restore and debugging switched off, recorded on screen and with the TV's own screen (photo/capture).
2. A real browser capture of github.com/Gathin23/cleanyourtv and cleanyour.tv (needs network access to those hosts).
3. Official Claude Code and Android Debug Bridge logos/interfaces.
4. The reference video `1000287323.mp4` if a closer sequence match is wanted.
