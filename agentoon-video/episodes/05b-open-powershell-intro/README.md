# Ep 05 insert — "How to open PowerShell" (Win+X) — 4.43 s

The finished video "1000285186.mp4" was NOT available in this environment, so nothing of it was touched. This insert is a separate clip that is PREPENDED, which shifts the original timeline forward and changes nothing else.

Files
- out/intro-open-powershell-PREVIEW-v2.mp4: the insert (1080x1920, 30 fps, own voiceover at the same voice/speed as Ep 05: "First, press Windows plus X, then open Terminal to launch PowerShell.")
- splice-intro.sh <finished.mp4> <intro.mp4> <NEW.mp4>: encodes the intro to match the finished file and joins with stream copy, so the finished video's frames are untouched; refuses to overwrite.
- Applied once to this project's Ep 05 preview as ../05-powershell-checks/out/...PREVIEW-v3-with-winx-intro.mp4 (v2 left unchanged).

Verified on that splice: the 1005 original video frames are byte-identical after the 133 intro frames (framemd5); original audio matches within 4 ms with 0.1% re-decode residual; loudness -15.6 LUFS.

Honest status: the desktop, the Win+X menu and Windows Terminal are a labeled SCHEMATIC (no real Windows available here). Replace with a real recording (data/slots.json: winx_recording): desktop, press WIN+X, Quick Link menu, select Terminal or Terminal (Admin), Windows Terminal opens on a PowerShell tab; if it opens Command Prompt, pick the PowerShell profile (chip on screen).
