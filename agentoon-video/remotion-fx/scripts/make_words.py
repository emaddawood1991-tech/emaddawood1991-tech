#!/usr/bin/env python3
"""Kokoro TTS for a sentence -> wav + word frame stamps (30 fps) proportional to word length. Usage: /tmp/kokoro/venv/bin/python scripts/make_words.py "<text>" <out_prefix> [lead_frames]"""
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
text, out = sys.argv[1], sys.argv[2]; lead = int(sys.argv[3]) if len(sys.argv) > 3 else 0
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin"); x, sr = k.create(text, voice="am_michael", speed=1.2, lang="en-us"); x = x.astype(np.float32)
nz = np.where(np.abs(x) > 0.01)[0]; x = x[nz[0]:nz[-1] + 1]; dur = len(x) / sr
words = text.split(); wts = [len(w) + 2 for w in words]; tot = sum(wts); t = lead / 30; out_w = []
for w, wt in zip(words, wts): d = dur * wt / tot; out_w.append({"w": w, "s": round((t) * 30), "e": round((t + d) * 30)}); t += d
sf.write(out + ".wav", np.concatenate([np.zeros(int(lead / 30 * sr), np.float32), x]), sr); json.dump(out_w, open(out + ".json", "w")); print("seconds", round(dur, 2), "words", len(words))
