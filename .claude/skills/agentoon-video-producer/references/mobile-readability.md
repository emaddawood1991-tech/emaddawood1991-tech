# Mobile readability standard (9:16, phone-first)

## Rules
- Commands/code large: at 1080 wide, command text >= 44 px (monospace), at most ~28 characters per line unless zoomed; never cut off at any edge; hold each command >= 2.5 s (longer if > 20 chars) before moving on.
- Never show a tiny full desktop/window. Crop and zoom to the control, field or line being narrated; one primary point per beat.
- Camera motion limited while reading: no zoom/pan during the hold of a command; move before or after.
- Captions away from commands, UI and code (caption band y ~1500-1700 of 1920; keep commands above y ~1450 or move captions). Never cover a command, dialog or button.
- Platform safe areas: keep key content inside x 60-1020 and y 220-1500; bottom ~420 px and right ~120 px are Instagram/TikTok UI (caption text, buttons, username); top ~220 px is status/search UI.
- Strong contrast (>= 4.5:1; check on both dark and light panels); few tiny labels (honest labels such as VERBATIM may be small but >= 24 px and never the only way to read a command).
## Test (required before FINAL)
1. `bash scripts/mobile-check.sh <video.mp4>` extracts representative frames (every scene start/mid/end) at 360x640 and 270x480 plus a contact sheet into `<video>.mobile/` (read-only on the MP4).
2. View the sheets (Read tool on PNGs). For each frame answer: can the command/key text be read at 360x640? Is anything under captions or in the unsafe bottom/right zone? Unreadable -> enlarge/crop/hold longer, re-render to a new filename, re-check.
3. Record results in `data/QC-REPORT.md` (see final-approval-gate.md).
