#!/usr/bin/env python3
"""Kokoro narration placed on the fixed schedule (no speed-up: each line must fit its slot or the script is shortened).
Writes audio/narration.wav (24 kHz), audio/timing.json, timeline.js (EP.words/phrases) and data/lipsync.json/.js."""
import json, os, sys, numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D); sys.path.insert(0, f"{D}/../../kit/py")
from script import PHR, TOTAL
from build_audio import trim, SR
from kokoro_onnx import Kokoro
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin"); voice, speed = "am_michael", 1.1
buf = np.zeros(int(TOTAL * SR) + SR, dtype=np.float32); phrases = []; words = []; bad = []; spoken = 0; vsecs = 0.0
for pid, start, sp, show, maxend in PHR:
    x, sr = k.create(sp, voice=voice, speed=speed, lang="en-us"); assert sr == SR
    x = trim(x.astype(np.float32)); dur = len(x) / SR; end = start + dur
    if end > maxend: bad.append((pid, round(end, 2), maxend))
    buf[int(start * SR):int(start * SR) + len(x)] += x
    phrases.append({"id": pid, "start": round(start, 3), "end": round(end, 3), "show": show, "speak": sp})
    toks = show.split(); wts = [len(t) + 2 for t in toks]; cur = start
    for t, w in zip(toks, wts):
        d = dur * w / sum(wts); words.append({"w": t, "s": round(cur, 3), "e": round(cur + d, 3)}); cur += d
    spoken += len(sp.split()); vsecs += dur
if bad: print("TOO LONG (shorten the line, do not speed up):", bad)
buf = buf[:int(TOTAL * SR)]; os.makedirs(f"{D}/audio", exist_ok=True); sf.write(f"{D}/audio/narration.wav", buf, SR)
wpm = round(spoken / (vsecs / 60)); json.dump({"voice": voice, "speed": speed, "wpm": wpm, "total": TOTAL, "phrases": phrases, "words": words}, open(f"{D}/audio/timing.json", "w"), indent=1)
open(f"{D}/timeline.js", "w").write("window.EP = " + json.dumps({"total": TOTAL, "wpm": wpm, "phrases": phrases, "words": words}) + ";\n")
fps = 24; n = int(TOTAL * fps) + 1
env = np.array([np.sqrt(np.mean(buf[int(i * SR / fps):int((i + 1) * SR / fps)] ** 2) + 1e-12) if int(i * SR / fps) < len(buf) else 1e-6 for i in range(n)])
env = np.convolve(env, [0.25, 0.5, 0.25], "same"); env = np.clip(env / (np.percentile(env, 98) + 1e-9), 0, 1)
os.makedirs(f"{D}/data", exist_ok=True); js = json.dumps({"fps": fps, "a": [round(float(v), 2) for v in env]})
open(f"{D}/data/lipsync.json", "w").write(js); open(f"{D}/data/lipsync.js", "w").write("window.LIPSYNC = " + js + ";\n")
print("narration wpm", wpm, "phrases", len(phrases), "late:", len(bad))
for p in phrases: print(p["id"], p["start"], p["end"], round(p["end"] - p["start"], 2))
