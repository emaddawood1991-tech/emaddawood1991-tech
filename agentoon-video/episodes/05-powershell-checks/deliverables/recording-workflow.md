# Recording workflow (Windows PC, ~3 minutes, nothing is changed on your PC)

The video needs REAL output. I cannot run Windows PowerShell here (my environment is Linux), so:

## Option A (minimum input, recommended): 3 text files
1. Open PowerShell **as Administrator** (BitLocker usually requires it).
2. Run `.\collect-outputs.ps1` (add `-Mask` to hide IP last octets). Review the 3 files in `agentoon-outputs`.
3. Send me `dns.txt`, `bitlocker.txt`, `hotfix.txt`. I typeset them verbatim in the PowerShell-style window, labeled "verbatim output".

## Option B (best look): real screen recording
1. Windows Terminal / PowerShell, font size 24+, window about 60x20 characters, dark theme.
2. Win+G (Game Bar) or OBS; 1080p; record each command separately (3 clips, 8-10 s each).
3. Paste each command from `commands.txt`, press Enter, wait 2 s with the output visible.
4. Before recording: close other windows, hide your username in the prompt (use `cd C:\`), do not show private networks (or use -Mask).
5. Send the 3 MP4 clips. I place them under the terminal graphics with zoom highlights.

If BitLocker is unavailable (not Pro/Enterprise, or no admin), send the real error text; the video shows it honestly.
