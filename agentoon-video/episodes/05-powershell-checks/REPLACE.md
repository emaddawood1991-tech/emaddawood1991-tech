# Ep 05 — 3 PowerShell checks: what is still needed

Preview: `out/agentoon-ep05-powershell-checks-PREVIEW-v2.mp4` (33.5 s). Unfinished: NO real PowerShell output is shown. My environment is Linux (no Windows PowerShell, no BitLocker/DNS-client/HotFix modules), so the three terminal outputs are labeled placeholders. Command text and column names are exact.

## Minimum input from you (Windows PC, ~2 minutes, read-only)
1. Open PowerShell as Administrator (BitLocker usually needs it).
2. Run `deliverables/collect-outputs.ps1` (add `-Mask` to hide the last IPv4 octet). It only READS.
3. Send `dns.txt`, `bitlocker.txt`, `hotfix.txt` from `agentoon-outputs/` (or 3 screen-recording clips, see deliverables/recording-workflow.md).

## Then (I do this)
Put the lines into data/slots.json (`lines`, `source`, `masked`, status `verified`), `python3 build.py`, mix, render to a NEW filename, validate. The terminal then typesets your text verbatim with a "VERBATIM OUTPUT" tag and draws highlights around the real columns. If BitLocker answers with an error, the real error is shown with an honest note. Recordings replace the typeset window instead if you send them.

Rules kept: no invented output, no green SAFE badges, no claim that an unfamiliar DNS address means hacking, hotfix list labeled as not the full update history, private values masked on request.
