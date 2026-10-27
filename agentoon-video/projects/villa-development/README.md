# Villa development video (Agentoon.ai)

Empty land -> two villas built -> trees, pool, people -> car through the gate -> interior.
Engine: Blender (primary, free). Final cut: Remotion (default composer). No paid APIs.
Scene source: `../../blender/villa_development.py`. Shot list: `manifest.json`.

## Run on Windows (PowerShell, in your clone of the repo, branch claude/ecstatic-goldberg-ovm1a3)

Find your Blender once (do not reinstall): `Get-ChildItem "C:\Program Files\Blender Foundation" -Directory`

```powershell
$b = "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"   # adjust to your version
cd agentoon-video
# 1. Check the look first: 12 low-sample stills (a few minutes)
& $b -b -P blender\villa_development.py -- --stills out\villa\stills --samples 16
# 2. Happy with the stills? Render the 30 s vertical video (1080x1920, 24 fps)
& $b -b -P blender\villa_development.py -- --video out\villa\villa.mp4 --samples 32
# Optional: save an editable .blend with all keyframes
& $b -b -P blender\villa_development.py -- --save out\villa\villa.blend
```

Or open Blender > Scripting > open `villa_development.py` > Run Script, or send it through your Blender MCP.
Stills are named `villa_0001.png` ... `villa_0680.png`. Outputs go to `out/` (git-ignored).

## Review (important)

This first version is procedural low-poly and was **not rendered in real Blender yet**: only the Python and the
camera/car/gate timing were checked with a stubbed Blender. Render the stills and check:
framing in portrait (CAM A-F), nothing floating or intersecting, the gate fully open before the car reaches it,
the car parked in front of the front door, and the interior lit (warm lights come on at frame 541).
Send the stills back and I will refine the weakest shots.

## Then Remotion

Cut points are at frames 97, 241, 361, 457, 553. Assemble the MP4 in Remotion with a title, mobile captions inside the
safe areas (avoid top ~180 px, bottom ~320 px), 6-12 frame transitions on each cut, music ducked under any voiceover
(about -15 LUFS) and the standard Agentoon.ai outro.
