#!/usr/bin/env python3
"""Encode the Blender PNG frame sequences into 1080x1920, 24 fps clips whose length matches each scene (data/clips.json).
Frames come from ../10-ai-property-design/blender/renders/v2 (rendered by render_shot.py). Speed factor is printed; >1.5x is flagged."""
import json, os, subprocess, sys
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, "../10-ai-property-design/blender/renders/v2")
clips = json.load(open(f"{D}/data/clips.json"))
RANGES = {"hook": (380, 500), "build": (1, 240), "car": (356, 604), "garden": (710, 1010), "interior": (1135, 1375)}
for name, (f0, f1) in RANGES.items():
    n = f1 - f0 + 1; src = n / 24.0; tgt = clips[name]; speed = src / tgt
    missing = [f for f in range(f0, f1 + 1) if not os.path.exists(f"{R}/{name}_{f:05d}.png")]
    if missing: print(f"SKIP {name}: {len(missing)} frames missing (first {missing[0]})"); continue
    out = f"{D}/assets/v2_{name}.mp4"
    vf = f"setpts=PTS*{tgt / src:.5f},scale=1080:1920:flags=lanczos,fps=24"
    subprocess.run(["nice", "ffmpeg", "-v", "error", "-y", "-framerate", "24", "-start_number", str(f0), "-i", f"{R}/{name}_%05d.png", "-vf", vf, "-t", f"{tgt:.3f}", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", out], check=True)
    print(f"{name}: {n} frames = {src:.1f}s -> {tgt:.1f}s (speed {speed:.2f}x){'  <-- fast' if speed > 1.5 else ''}")
