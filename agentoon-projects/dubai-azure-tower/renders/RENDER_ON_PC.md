# Final render on your Windows PC (Blender 4.2+ already installed - do not reinstall)

Why not here: the cloud sandbox has 4 CPU cores and no GPU. Measured Cycles cost: ~5 s/frame (exterior) and ~10-60 s/frame (interiors) at 640-800 px, 8-64 samples.
Native 4K x 3,600 frames on this CPU would take weeks, so the final 4K render is handed to your GPU machine.

## 1. Build (seconds) - from the repo root
```powershell
cd agentoon-projects\dubai-azure-tower
& "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" -b -P architecture\build_all.py -- animations\Dubai_Azure_Tower.blend
```
(or just open `animations/Dubai_Azure_Tower.blend`, it is the same scene.)

## 2. Render frames (resumable; GPU)
Set Cycles to OptiX/CUDA in Preferences once, then:
```powershell
$env:AZURE_DEVICE="GPU"
# 3840x2160, 128 samples, every frame, resumable
& "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" -b animations\Dubai_Azure_Tower.blend -P renders\render_frames.py -- renders\final 1 3600 1 3840 128
```
`render_frames.py` args: `<out> <start> <end> <stride> <width> <samples> [threads]`. It skips frames that already exist.
Fallback if 4K is too slow: render width 1920 (1080p) and upscale at assembly (see below).

## 3. Assemble the MP4 (FFmpeg)
```powershell
python exports\assemble.py renders\final exports\Dubai_Azure_Tower_4K.mp4 3840 2160 --stride 1 --crf 14
```
Adds scene dips, title card ("DUBAI AZURE TOWER" / "A Conceptual Architectural Vision"), concept disclaimer and the score.
For a 1080p render upscaled: `... 3840 2160 --stride 1` also works, frames are lanczos-scaled.

## 4. Optional Remotion edit
See `remotion/README.md` (scenes -> `public/scenes/Sxx.mp4`, then `npm run render`).
