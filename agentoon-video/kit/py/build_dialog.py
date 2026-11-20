#!/usr/bin/env python3
"""Two-voice dialogue builder (Kokoro, local). build_dialog.py <episode dir> [--sample]
Per line: TTS with the speaker's voice, per-speaker EQ/compression chain, concatenated sequentially (speakers never overlap).
Writes audio/narration.wav (mono 24k), audio/speakerA.wav / speakerC.wav (same length, silent when the other speaks) for lip-sync,
audio/dialog_timing.json (per line start/end, words)."""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
SR = 24000
def trim(x, thr=0.01, pad=0.02):
    nz = np.where(np.abs(x) > thr)[0]
    return x[max(0, nz[0] - int(pad * SR)): nz[-1] + int(pad * SR)] if len(nz) else x
def chain(x, who):
    tmp_in, tmp_out = f"/tmp/_dlg_in_{who}.wav", f"/tmp/_dlg_out_{who}.wav"; sf.write(tmp_in, x, SR)
    eq = "highpass=f=95,equalizer=f=180:t=q:w=1:g=1,equalizer=f=3300:t=q:w=1:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3" if who == "C" else \
         "highpass=f=110,equalizer=f=200:t=q:w=1:g=-1,equalizer=f=3600:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3:attack=4:release=70:makeup=3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp_in, "-af", eq, "-ar", str(SR), tmp_out], check=True)
    y, _ = sf.read(tmp_out, dtype="float32"); return y
def main():
    d = os.path.abspath(sys.argv[1]); cfg = json.load(open(d + "/dialogue.json")); os.makedirs(d + "/audio", exist_ok=True)
    k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin"); gap = cfg.get("gap", 0.2)
    segs = []; t = 0.15
    for ln in cfg["lines"]:
        v = cfg["voices"][ln["who"]]; sp = ln.get("speed", v["speed"])
        x, sr = k.create(ln["speak"], voice=v["voice"], speed=sp, lang="en-us"); assert sr == SR
        y = chain(trim(x.astype(np.float32)), ln["who"]); dur = len(y) / SR
        segs.append({"id": ln["id"], "who": ln["who"], "scene": ln["scene"], "show": ln["show"], "start": round(t, 3), "end": round(t + dur, 3), "y": y}); t += dur + gap + ln.get("pad", 0)
    total = round(t + 0.5, 3); n = int(total * SR)
    A = np.zeros(n, np.float32); C = np.zeros(n, np.float32)
    for s in segs:
        i = int(s["start"] * SR); (A if s["who"] == "A" else C)[i:i + len(s["y"])] += s["y"]
    sf.write(d + "/audio/speakerA.wav", A, SR); sf.write(d + "/audio/speakerC.wav", C, SR); sf.write(d + "/audio/narration.wav", A + C, SR)
    words = []
    for s in segs:
        toks = s["show"].split(); wt = [len(w) + 2 for w in toks]; cur = s["start"]; span = s["end"] - s["start"]
        for w, x in zip(toks, wt): dd = span * x / sum(wt); words.append({"w": w, "who": s["who"], "line": s["id"], "s": round(cur, 3), "e": round(cur + dd, 3)}); cur += dd
    nw = sum(len(s["show"].split()) for s in segs); spoken = sum(s["end"] - s["start"] for s in segs)
    json.dump({"total": total, "lines": [{k2: v for k2, v in s.items() if k2 != "y"} for s in segs], "words": words}, open(d + "/audio/dialog_timing.json", "w"), indent=1)
    print(f"total {total}s, {nw} words, speaking {spoken:.1f}s -> {nw / (spoken / 60):.0f} wpm")
main()
