# Ep 05 — 3 PowerShell checks: what is still needed

Preview: `out/agentoon-ep05-powershell-checks-PREVIEW-v2.mp4` (33.5 s). Unfinished: NO real PowerShell output is shown. My environment is Linux (no Windows PowerShell, no BitLocker/DNS-client/HotFix modules), so the three terminal outputs are labeled placeholders. Command text and column names are exact.

## Minimum input from you (Windows PC, ~2 minutes, read-only)
1. Open PowerShell as Administrator (BitLocker usually needs it).
2. Run `deliverables/collect-outputs.ps1` (add `-Mask` to hide the last IPv4 octet). It only READS.
3. Send `dns.txt`, `bitlocker.txt`, `hotfix.txt` from `agentoon-outputs/` (or 3 screen-recording clips, see deliverables/recording-workflow.md).

## Then (I do this)
Put the lines into data/slots.json (`lines`, `source`, `masked`, status `verified`), `python3 build.py`, mix, render to a NEW filename, validate. The terminal then typesets your text verbatim with a "VERBATIM OUTPUT" tag and draws highlights around the real columns. If BitLocker answers with an error, the real error is shown with an honest note. Recordings replace the typeset window instead if you send them.

Rules kept: no invented output, no green SAFE badges, no claim that an unfamiliar DNS address means hacking, hotfix list labeled as not the full update history, private values masked on request.

## Correction log (stray dot)
A small cyan glowing dot sat near mid-frame (about x 550, y 770) for ~85% of the video. Source: Cam.iris() in kit/camera.js created its transition ring with `opacity:1` in a fromTo at t=0, so the ring (0 px wide, 10 px border + glow) was visible from the first frame until the iris transition at 28.25 s. Fix: the ring now stays hidden until `tl.set(r,{opacity:1},at)`. Ep 05 and the master kit are patched; Ep 02/03/04 kit copies still contain the old behavior (their renders are untouched; Ep 02 and 04 also use iris with a ring).
Outputs: ...PREVIEW-v2-nodot.mp4 and ...PREVIEW-v3-with-winx-intro-nodot.mp4 (originals kept).
