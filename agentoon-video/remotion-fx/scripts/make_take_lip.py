#!/usr/bin/env python3
"""Kokoro (local) TTS -> loudness envelope for lip-sync. Usage: /tmp/kokoro/venv/bin/python scripts/make_take_lip.py "<text>" <out_prefix>
Writes <out_prefix>.json = {fps:24,a:[...]} and <out_prefix>.wav (24 kHz)."""
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
text, out = sys.argv[1], sys.argv[2]
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin"); x, sr = k.create(text, voice="am_michael", speed=1.2, lang="en-us"); x = x.astype(np.float32)
fps = 24; n = int(len(x) / sr * fps) + 1
env = np.array([np.sqrt(np.mean(x[int(i * sr / fps):int((i + 1) * sr / fps)] ** 2) + 1e-12) for i in range(n)]); env = np.convolve(env, [0.25, 0.5, 0.25], "same"); env = np.clip(env / (np.percentile(env, 98) + 1e-9), 0, 1)
json.dump({"fps": fps, "a": [round(float(v), 2) for v in env], "seconds": round(len(x) / sr, 2)}, open(out + ".json", "w")); sf.write(out + ".wav", x, sr); print("seconds", round(len(x) / sr, 2))
