#!/usr/bin/env python3
"""Agentoon audio pipeline (free, local, deterministic).

  build_audio.py tts <episode.json>   Kokoro on-device TTS -> audio/narration.wav + timeline.js (word times, phrase times)
  build_audio.py mix <episode.json>   original synth music bed + SFX + ducked mix -> audio/mix.wav (-15 LUFS, TP <= -1.5 dBTP)

Word times are ESTIMATED by splitting each phrase's measured duration in proportion to spoken character counts
(Kokoro gives no alignment). Re-check subtitle sync visually. No network, no paid API, no randomness.
Env: KOKORO_MODEL, KOKORO_VOICES (paths to kokoro-v1.0.onnx and voices-v1.0.bin).
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf

SR = 24000        # TTS native rate
OUT_SR = 48000
GAP = 0.12        # seconds between phrases (natural flow, no dead air)


def ep_dir(path):
    return os.path.dirname(os.path.abspath(path))


def trim(x, thr=0.01, pad=0.02):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a, b = max(0, idx[0] - int(pad * SR)), min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]


def tts(ep_path):
    from kokoro_onnx import Kokoro
    ep = json.load(open(ep_path)); d = ep_dir(ep_path); os.makedirs(d + "/audio", exist_ok=True)
    k = Kokoro(os.environ.get("KOKORO_MODEL", "/tmp/kokoro/kokoro-v1.0.onnx"), os.environ.get("KOKORO_VOICES", "/tmp/kokoro/voices-v1.0.bin"))
    voice = ep.get("voice", "am_michael"); speed = ep.get("speed", 1.1)
    for attempt in range(4):
        chunks, phrases, t = [], [], 0.15
        lead = np.zeros(int(0.15 * SR), dtype=np.float32); chunks.append(lead)
        n_spoken = 0; pads = 0.0
        for p in ep["phrases"]:
            x, sr = k.create(p["speak"], voice=voice, speed=speed, lang="en-us"); assert sr == SR
            x = trim(x.astype(np.float32)); dur = len(x) / SR
            phrases.append({"id": p["id"], "start": round(t, 3), "end": round(t + dur, 3), "show": p["show"], "speak": p["speak"], "map": p.get("map")})
            chunks.append(x); chunks.append(np.zeros(int((GAP + p.get("pad", 0)) * SR), dtype=np.float32)); t += dur + GAP + p.get("pad", 0); pads += p.get("pad", 0)
            n_spoken += len(p["speak"].split())
        voice_secs = t - 0.15 - GAP - pads
        wpm = n_spoken / (voice_secs / 60)
        print(f"speed {speed:.3f}: {n_spoken} spoken words / {voice_secs:.2f}s = {wpm:.0f} wpm")
        if 156 <= wpm <= 168:
            break
        speed = round(speed * (162 / wpm), 3)
    audio = np.concatenate(chunks)
    sf.write(d + "/audio/narration.wav", audio, SR)

    words = []
    for ph in phrases:
        toks = ph["map"] or [[w, w] for w in ph["show"].split()]
        weights = [len(s) + 2 for _, s in toks]; span = ph["end"] - ph["start"]; cur = ph["start"]
        for (shown, _), wgt in zip(toks, weights):
            dur = span * wgt / sum(weights)
            words.append({"w": shown, "s": round(cur, 3), "e": round(cur + dur, 3)}); cur += dur
    total = round(len(audio) / SR, 3)
    json.dump({"voice": voice, "speed": speed, "wpm": round(wpm), "total": total, "phrases": phrases, "words": words}, open(d + "/audio/timing.json", "w"), indent=1)
    open(d + "/timeline.js", "w").write("window.EP = " + json.dumps({"total": total, "wpm": round(wpm), "phrases": phrases, "words": words}) + ";\n")
    print(f"narration {total:.2f}s, {round(wpm)} wpm, voice {voice} -> audio/narration.wav, timeline.js")


# ---------- synth helpers (original sounds, no samples) ----------
def env(n, a, r, sr):
    e = np.ones(n, dtype=np.float32); na, nr = int(a * sr), int(r * sr)
    if na: e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr: e[-nr:] = np.linspace(1, 0, nr) ** 1.5
    return e


def tone(f, dur, sr, amp=1.0, harm=(1.0, 0.3, 0.1), a=0.01, r=0.1):
    n = int(dur * sr); t = np.arange(n) / sr; y = np.zeros(n, dtype=np.float32)
    for i, h in enumerate(harm): y += h * np.sin(2 * np.pi * f * (i + 1) * t)
    return amp * y * env(n, a, r, sr) / max(1e-6, sum(harm))


def place(buf, x, t, sr):
    i = int(t * sr)
    if i >= len(buf): return
    j = min(len(buf), i + len(x)); buf[i:j] += x[: j - i]


def note(m): return 440.0 * 2 ** ((m - 69) / 12)


def sfx(name, sr, seed=1):
    rs = np.random.RandomState(seed)             # fixed seed: deterministic
    if name == "pop":
        n = int(0.11 * sr); t = np.arange(n) / sr; f = 700 * np.exp(-t * 18) + 250
        return 0.9 * np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t * 28)
    if name == "tick":
        n = int(0.018 * sr); y = rs.randn(n) * np.exp(-np.arange(n) / (0.003 * sr)); return 0.5 * y
    if name == "step":
        n = int(0.09 * sr); t = np.arange(n) / sr; return 0.8 * np.sin(2 * np.pi * 95 * t) * np.exp(-t * 40)
    if name == "ding":
        a, b = tone(1318.5, 0.7, sr, 0.5, (1, 0.35, 0.12), 0.002, 0.55), tone(1760, 0.5, sr, 0.25, (1, 0.2), 0.002, 0.4)
        a[: len(b)] += b; return a
    if name == "whoosh":
        n = int(0.5 * sr); y = rs.randn(n).astype(np.float32); k = np.hanning(int(0.01 * sr)); y = np.convolve(y, k / k.sum(), "same")
        sw = np.sin(np.linspace(0, np.pi, n)) ** 2; return 0.5 * y * sw
    if name == "sparkle":
        return sum(tone(f, 0.35, sr, 0.18, (1, 0.2), 0.002, 0.3) * 1.0 for f in (1568, 2093, 2637))
    raise KeyError(name)


def music(total, sections, sr):
    """Original 4-section bed: low tension pad -> plucked arpeggio -> soft pulse -> resolved major chord."""
    n = int(total * sr); buf = np.zeros(n, dtype=np.float32)
    chords = {"hook": [48, 51, 55], "disc": [48, 51, 55, 58], "demo": [53, 56, 60, 63], "result": [48, 52, 55, 59]}
    for s in sections:
        t0, t1, mood = s["t0"], min(s["t1"], total), s["mood"]; dur = t1 - t0 + 0.6
        for m in chords[mood]:
            for det in (-0.6, 0.6):                                  # slow detuned pad
                place(buf, tone(note(m) * 2 ** (det / 1200), dur, sr, 0.10, (1, 0.25), 0.6, 0.7), t0, sr)
        if mood in ("disc", "demo", "result"):                      # plucked 8ths at 96 BPM
            step = 60 / 96 / 2; ch = chords[mood]; i = 0; tt = t0
            while tt < t1:
                m = ch[[0, 2, 1, 3 % len(ch), 2, 1][i % 6]] + 12
                place(buf, tone(note(m), 0.35, sr, 0.16 if mood != "result" else 0.12, (1, 0.4, 0.15), 0.004, 0.3), tt, sr); tt += step; i += 1
        if mood == "demo":                                          # quiet pulse
            tt = t0
            while tt < t1: place(buf, sfx("step", sr) * 0.5, tt, sr); tt += 60 / 96
        if mood == "result":
            place(buf, tone(note(84), 1.4, sr, 0.10, (1, 0.3), 0.01, 1.2), t0 + 0.1, sr)
    return buf


def mix(ep_path):
    ep = json.load(open(ep_path)); d = ep_dir(ep_path)
    voice, sr_v = sf.read(d + "/audio/narration.wav", dtype="float32")
    total = float(ep["total"]); n = int(total * OUT_SR)
    # resample voice 24k -> 48k (linear, fine for speech)
    v = np.interp(np.linspace(0, len(voice) - 1, int(len(voice) * OUT_SR / sr_v)), np.arange(len(voice)), voice).astype(np.float32)
    v = np.pad(v, (0, max(0, n - len(v))))[:n]; v = v / (np.max(np.abs(v)) + 1e-6) * 0.80
    bed = music(total, ep["music"], OUT_SR)[:n]
    # sidechain: smooth voice envelope -> duck music ~16 dB while speaking
    win = int(0.05 * OUT_SR); e = np.convolve(np.abs(v), np.ones(win) / win, "same"); e = np.convolve(e, np.hanning(int(0.25 * OUT_SR)) / np.hanning(int(0.25 * OUT_SR)).sum(), "same")
    duck = 1.0 - 0.84 * np.clip(e / 0.06, 0, 1)
    bed = bed * duck * 0.30
    fx = np.zeros(n, dtype=np.float32)
    for c in ep["sfx"]:
        if c["name"] == "type":
            t = c["t"]
            while t < c["t"] + c["dur"]: place(fx, sfx("tick", OUT_SR, int(t * 100)) * c.get("gain", 0.35), t, OUT_SR); t += 1.0 / c["cps"]
        else:
            place(fx, sfx(c["name"], OUT_SR, int(c["t"] * 100)) * c.get("gain", 0.5), c["t"], OUT_SR)
    y = v + bed + 0.55 * fx
    y = np.tanh(y * 0.9) / np.tanh(0.9)                                # gentle safety soft-clip
    raw = d + "/audio/mix_raw.wav"; sf.write(raw, np.stack([y, y], 1), OUT_SR)
    out = d + "/audio/mix.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", str(OUT_SR), out], check=True)
    os.remove(raw)
    print("mix ->", out)


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("tts", "mix"):
        sys.exit(__doc__)
    (tts if sys.argv[1] == "tts" else mix)(sys.argv[2])
