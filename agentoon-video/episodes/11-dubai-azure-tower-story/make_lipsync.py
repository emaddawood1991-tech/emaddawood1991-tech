#!/usr/bin/env python3
"""Loudness-envelope lip-sync data from audio/narration.wav -> data/lipsync.json (+ lipsync.js). 24 fps, values 0..1."""
import json, os, numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
x, sr = sf.read(f"{D}/audio/narration.wav", dtype="float32")
if x.ndim > 1: x = x.mean(1)
fps = 24; n = int(len(x) / sr * fps) + 1
env = np.array([np.sqrt(np.mean(x[int(i * sr / fps):int((i + 1) * sr / fps)] ** 2) + 1e-12) if int(i * sr / fps) < len(x) else 0 for i in range(n)])
env = np.convolve(env, [0.25, 0.5, 0.25], "same"); env = np.clip(env / (np.percentile(env, 98) + 1e-9), 0, 1)
os.makedirs(f"{D}/data", exist_ok=True)
js = json.dumps({"fps": fps, "a": [round(float(v), 2) for v in env]})
open(f"{D}/data/lipsync.json", "w").write(js); open(f"{D}/data/lipsync.js", "w").write("window.LIPSYNC = " + js + ";\n")
print("lipsync frames", n)
