"""Original cinematic ambient score (generated, no samples, no licensing): pads + soft bell arpeggio + gentle water bed.
python make_audio.py out.wav   -> 120 s, 48 kHz stereo."""
import sys
import numpy as np
SR = 48000; DUR = 120.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
t = np.arange(N) / SR

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

def env_pad(t0, t1, a=4.0, r=5.0):
    e = np.zeros(N); i0, i1 = max(0, int(t0 * SR)), min(N, int(t1 * SR))
    tt = np.arange(i1 - i0) / SR; L = (t1 - max(0, t0))
    e[i0:i1] = np.minimum(1, tt / a) * np.minimum(1, (L - tt) / r)
    return e

def pad_voice(f, t0, t1, amp):
    sig = np.zeros(N)
    for det in (-0.12, 0.0, 0.14):
        ff = f * 2 ** (det / 12)
        for h, w in ((1, 1.0), (2, 0.45), (3, 0.22), (4, 0.1)):
            sig += w * np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6.28))
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * rng.uniform(0.05, 0.12) * t + rng.uniform(0, 6))
    return amp * sig * lfo * env_pad(t0, t1)

# slow progression, 4 chords x 30 s (midi notes)
chords = [(50, 57, 62, 66, 69, 73), (47, 54, 59, 62, 66, 69), (43, 50, 55, 59, 62, 66), (45, 52, 57, 61, 64, 69)]
pad = np.zeros(N)
for i, ch in enumerate(chords):
    for n in ch:
        pad += pad_voice(midi(n), i * 30 - 3, i * 30 + 33, 0.035)
# finale swell: lift from 106 s
sw = np.zeros(N)
for n in (62, 66, 69, 74, 78, 81):
    sw += pad_voice(midi(n), 104, 121, 0.03)
pad += sw

def bell(t0, f, amp, dec=2.2):
    i0 = int(t0 * SR); L = int(min(N - i0, SR * 6))
    if L <= 0: return np.zeros(N)
    tt = np.arange(L) / SR
    s = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt) + 0.12 * np.sin(2 * np.pi * f * 3.97 * tt)
    s *= np.exp(-tt / dec) * np.minimum(1, tt / 0.01)
    o = np.zeros(N); o[i0:i0 + L] = amp * s
    return o

arp = np.zeros(N)
scale = [74, 78, 81, 85, 86, 81, 78, 83]
for k in range(int(DUR / 1.875)):
    tt0 = 6 + k * 1.875
    if tt0 > 112: break
    ch = chords[min(3, int(tt0 // 30))]
    note = ch[2 + (k % 4)] + 12
    arp += bell(tt0, midi(note), 0.05 * (0.6 + 0.4 * np.sin(k * 0.7) ** 2))

# water bed under the landscape scene (frames 1261-1710 => 42.0-57.0 s) with soft fades
noise = rng.normal(size=N)
from numpy.fft import rfft, irfft
spec = rfft(noise); fr = np.fft.rfftfreq(N, 1 / SR)
band = np.exp(-((np.log(fr + 1) - np.log(1800)) ** 2) / (2 * 0.9 ** 2))
water = irfft(spec * band, N)
water /= np.abs(water).max()
wenv = np.clip((t - 41) / 2, 0, 1) * np.clip((58 - t) / 2, 0, 1)
water *= wenv * (0.7 + 0.3 * np.sin(2 * np.pi * 0.27 * t)) * 0.18

mix = pad + arp + water
# simple stereo width + reverb tail
def reverb(x, sec=2.8):
    L = int(SR * sec)
    ir = rng.normal(size=L) * np.exp(-np.arange(L) / (SR * sec / 4.5))
    ir[0] = 0
    n = 1 << int(np.ceil(np.log2(N + L)))
    y = irfft(rfft(x, n) * rfft(ir, n), n)[:N]
    return y
wet = reverb(mix); wet /= np.abs(wet).max() + 1e-9
wet *= np.abs(mix).max() * 0.55
left = mix + wet * 0.9 + np.roll(arp, int(0.011 * SR)) * 0.25
right = mix + np.roll(wet, int(0.017 * SR)) * 0.9 + np.roll(arp, int(0.023 * SR)) * 0.25
st = np.stack([left, right], 1)
fade = np.clip(t / 2.0, 0, 1) * np.clip((DUR - t) / 3.0, 0, 1)
st *= fade[:, None]
st /= np.abs(st).max() / 0.8
pcm = (st * 32767).astype("<i2")
import wave
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1])
