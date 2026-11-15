#!/usr/bin/env python3
"""Fails if a planned motion-graphics effect was not actually implemented and rendered.
Usage: python3 check-fx-usage.py <episode_dir>
Reads <episode>/data/FX-TIMELINE.json: [{"id","skill","comp","start","end","clip","note"}] (seconds). For each entry the clip file must exist,
its duration must match end-start (±0.3 s) and it must not be static (mean frame difference over 1 s above a threshold)."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image
ep = sys.argv[1]; tl = json.load(open(os.path.join(ep, "data/FX-TIMELINE.json"))); bad = 0
def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode().strip())
def fr(p, t):
    o = f"/tmp/_fx_{abs(hash((p, t)))}.png"; subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", p, "-frames:v", "1", "-vf", "scale=270:-1", o], check=True); return np.asarray(Image.open(o).convert("RGB")).astype(np.int16)
for e in tl:
    clip = os.path.join(ep, e["clip"]); name = f'{e["id"]} ({e["skill"]})'
    if not os.path.exists(clip): print("FAIL", name, "clip missing:", e["clip"]); bad += 1; continue
    d = dur(clip); want = e["end"] - e["start"]
    if abs(d - want) > 0.3: print("FAIL", name, f"duration {d:.2f}s != planned {want:.2f}s"); bad += 1; continue
    t0 = min(d * 0.4, d - 1.1); m = float(np.abs(fr(clip, t0) - fr(clip, t0 + 1.0)).mean())
    if m < 0.5: print("FAIL", name, f"looks static (motion {m:.2f})"); bad += 1; continue
    print("PASS", name, f"{d:.1f}s motion {m:.1f}")
print("ALL PLANNED EFFECTS IMPLEMENTED" if not bad else f"{bad} PLANNED EFFECT(S) MISSING OR STATIC"); sys.exit(1 if bad else 0)
