#!/usr/bin/env python3
"""Kokoro narration placed sequentially (scene groups, no speed-up). Writes audio/narration.wav, audio/timing.json, timeline.js, data/lipsync.json/.js."""
import json, os, sys, numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D); sys.path.insert(0, f"{D}/../../kit/py")
from script import PHR, GAP, SCENE_PAD, LEAD
from build_audio import trim, SR
from kokoro_onnx import Kokoro
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin"); voice, speed = "am_michael", 1.1
chunks = [np.zeros(int(LEAD * SR), dtype=np.float32)]; t = LEAD; phrases = []; words = []; spoken = 0; vs = 0.0; prev = None
for pid, sc, sp, show in PHR:
    if prev is not None:
        pad = SCENE_PAD if sc != prev else GAP; chunks.append(np.zeros(int(pad * SR), dtype=np.float32)); t += pad
    x, sr = k.create(sp, voice=voice, speed=speed, lang="en-us"); assert sr == SR
    x = trim(x.astype(np.float32)); dur = len(x) / SR
    phrases.append({"id": pid, "scene": sc, "start": round(t, 3), "end": round(t + dur, 3), "show": show, "speak": sp})
    toks = show.split(); wts = [len(w) + 2 for w in toks]; cur = t
    for w, wt in zip(toks, wts):
        d = dur * wt / sum(wts); words.append({"w": w, "s": round(cur, 3), "e": round(cur + d, 3)}); cur += d
    chunks.append(x); t += dur; spoken += len(sp.split()); vs += dur; prev = sc
buf = np.concatenate(chunks); total = round(t + 0.8, 1)
os.makedirs(f"{D}/audio", exist_ok=True); sf.write(f"{D}/audio/narration.wav", buf, SR)
wpm = round(spoken / (vs / 60)); json.dump({"voice": voice, "speed": speed, "wpm": wpm, "total": total, "phrases": phrases, "words": words}, open(f"{D}/audio/timing.json", "w"), indent=1)
open(f"{D}/timeline.js", "w").write("window.EP = " + json.dumps({"total": total, "wpm": wpm, "phrases": phrases, "words": words}) + ";\n")
fps = 24; n = int(total * fps) + 1; buf2 = np.pad(buf, (0, int(total * SR) - len(buf) + SR))
env = np.array([np.sqrt(np.mean(buf2[int(i * SR / fps):int((i + 1) * SR / fps)] ** 2) + 1e-12) for i in range(n)])
env = np.convolve(env, [0.25, 0.5, 0.25], "same"); env = np.clip(env / (np.percentile(env, 98) + 1e-9), 0, 1)
os.makedirs(f"{D}/data", exist_ok=True); js = json.dumps({"fps": fps, "a": [round(float(v), 2) for v in env]})
open(f"{D}/data/lipsync.json", "w").write(js); open(f"{D}/data/lipsync.js", "w").write("window.LIPSYNC = " + js + ";\n")
print("total", total, "wpm", wpm)
for p in phrases: print(p["id"], p["scene"], p["start"], p["end"])
