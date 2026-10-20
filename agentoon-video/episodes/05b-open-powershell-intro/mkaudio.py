# One-line narration at the SAME voice/speed as Ep 05 (am_michael, speed 1.222) so the insert matches the finished video's delivery.
import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
T = "First, press Windows plus X, then open Terminal to launch PowerShell."
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin")
x, sr = k.create(T, voice="am_michael", speed=1.222, lang="en-us")
x = x.astype(np.float32); idx = np.where(np.abs(x) > 0.01)[0]; x = x[max(0, idx[0] - 480): idx[-1] + 480]
lead = np.zeros(int(0.15 * sr), dtype=np.float32); a = np.concatenate([lead, x]); dur = len(x) / sr
sf.write("audio/narration.wav", a, sr)
words = T.split(); wt = [len(w) + 2 for w in words]; tot = sum(wt); cur = 0.15; W = []
for w, g in zip(words, wt):
    d = dur * g / tot; W.append({"w": w, "s": round(cur, 3), "e": round(cur + d, 3)}); cur += d
ph = [{"id": "p0", "start": 0.15, "end": round(0.15 + dur, 3), "show": T, "speak": T, "map": None}]
json.dump({"voice": "am_michael", "speed": 1.222, "wpm": round(len(words) / (dur / 60)), "total": round(0.15 + dur, 3), "phrases": ph, "words": W}, open("audio/timing.json", "w"), indent=1)
print("dur", dur, "wpm", round(len(words) / (dur / 60)))
