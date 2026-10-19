# Ep 03 — what is still needed before publishing

Preview: `out/agentoon-ep03-chatcut-PREVIEW-v2.mp4`. Every real ChatCut recording/result is a hazard-striped PLACEHOLDER; the editor in S2 is a schematic rebuild.

| Scene | Slot | Needed (real) |
|---|---|---|
| Hook 0:00 | hook_ba | Real BEFORE and AFTER clips of the same footage |
| What it does 0:02 | editor_rec | Real ChatCut editor recording: cut, captions, B-roll |
| Install 0:12 | install_status | Real `claude plugin details` / `claude mcp get plugin:chatcut:chatcut` output (Connected); real chatcut.io/claude page |
| Demo 0:18 | demo_log | Real Claude Code session with the exact request, tool actions, timeline edits |
| Result 0:32 | demo_result | Real edited timeline and preview vs original; show export only if it succeeded |

## You must (I cannot)
1. Authorize ChatCut (OAuth in your browser) on your own machine and supply a source video.
2. Approve any credit-consuming step (generation). Nothing was spent.
3. Record the session (screen capture), then drop files into `assets/`.

## Replace procedure
Set the slot to `verified` in `data/slots.json`, add the `<video muted>` (HyperFrames rules: data-start/duration, no crossorigin) in `src/index.template.html` where the placeholder sits, `python3 build.py`, mix, render to a NEW filename, run validate-render.sh and motion-profile.sh. Set `preview_banner` false. Blur account info.
