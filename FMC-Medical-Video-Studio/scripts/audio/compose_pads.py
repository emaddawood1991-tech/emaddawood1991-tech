"""
Original FMC ambient PAD underscore (no piano, no rhythm), synthesised with numpy (no samples, no third-party material => no licence issue).
Warm sustained pads + very soft string-like swells + faint air texture + algorithmic reverb. Nothing percussive, no melody.
Usage: python3 compose_music.py out.wav seconds
"""
import sys, numpy as np, wave
SR = 44100
OUT, SECS = sys.argv[1], float(sys.argv[2])
N = int(SECS * SR)
rng = np.random.default_rng(7)
L = np.zeros(N, np.float32); R = np.zeros(N, np.float32)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def put(sig, start, pan=0.5):
    i = int(start * SR)
    if i >= N: return
    n = min(len(sig), N - i)
    L[i:i+n] += sig[:n] * np.cos(pan * np.pi / 2)
    R[i:i+n] += sig[:n] * np.sin(pan * np.pi / 2)

def piano(m, dur, vel):
    f0 = hz(m); T = dur + 3.5
    t = np.arange(int(T * SR)) / SR
    low = np.clip((m - 30) / 60, 0, 1)
    sig = np.zeros_like(t)
    for n in range(1, 13):
        B = 0.00035 * (1 + 2 * (1 - low))
        fn = n * f0 * np.sqrt(1 + B * n * n)
        if fn > 9000: break
        amp = vel / n ** 1.15 * (0.75 if n > 6 else 1.0)
        tau = (2.0 + 5.5 * (1 - low)) / (1 + 0.45 * (n - 1))
        for det in (-0.35, 0.35):  # two detuned strings
            f = fn * 2 ** (det / 1200)
            sig += amp * 0.5 * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / tau)
    att = np.minimum(t / 0.006, 1.0)
    rel = np.where(t > dur, np.exp(-(t - dur) / 0.9), 1.0)  # soft pedal-like release
    thump = rng.standard_normal(len(t)) * np.exp(-t / 0.012) * 0.02 * vel
    thump = np.convolve(thump, np.ones(8) / 8, 'same')
    return (sig * att * rel + thump).astype(np.float32)

def pad(ms, dur, level, strings=False):
    T = dur + 3.0
    t = np.arange(int(T * SR)) / SR
    a, r = (2.6, 3.0) if strings else (1.8, 2.6)
    env = np.minimum(t / a, 1.0) * np.where(t > dur, np.exp(-(t - dur) / (r / 3)), 1.0)
    sig = np.zeros_like(t)
    for m in ms:
        for det in (-6, 0, 6):
            f = hz(m) * 2 ** (det / 1200)
            vib = 1 + (0.0014 * np.sin(2 * np.pi * 5.1 * t + det) if strings else 0)
            for n in range(1, 7 if not strings else 9):
                sig += np.sin(2 * np.pi * f * n * t * vib + rng.uniform(0, 6.28)) / n ** (1.6 if not strings else 1.2)
    return (sig * env * level / (len(ms) * 3)).astype(np.float32)


# slow chord pads, each 9 s with long overlapping swells (attack ~3.5 s, release ~4 s)
CH = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 57, 64], [43, 50, 55, 62],
      [48, 55, 59, 64], [40, 47, 55, 62], [41, 48, 57, 64], [43, 50, 59, 62]]
STEP = 8.0
def swell(ms, dur, level, a, r, strings):
    T = dur + r
    t = np.arange(int(T * SR)) / SR
    env = np.minimum(t / a, 1.0) ** 1.5 * np.where(t > dur, np.exp(-(t - dur) / (r / 3)), 1.0)
    sig = np.zeros_like(t)
    for m in ms:
        for det in (-7, 0, 7):
            f = hz(m) * 2 ** (det / 1200)
            vib = 1 + (0.0010 * np.sin(2 * np.pi * 4.6 * t + det) if strings else 0)
            for n in range(1, 6 if not strings else 7):
                sig += np.sin(2 * np.pi * f * n * t * vib + rng.uniform(0, 6.28)) / n ** (1.9 if not strings else 1.4)
    return (sig * env * level / (len(ms) * 3)).astype(np.float32)
t0 = 0.0; k = 0
while t0 < SECS:
    ch = CH[k % len(CH)]
    put(swell(ch, STEP + 2.5, 0.10, 3.5, 4.0, False), t0, 0.5)
    put(swell([m + 12 for m in ch[1:]], STEP + 2.5, 0.045, 4.5, 4.5, True), t0 + 0.4, 0.5)
    put(swell([ch[0] + 12, ch[2] + 12], STEP, 0.02, 5.0, 4.0, False), t0 + 1.0, 0.62)   # faint high shimmer
    t0 += STEP; k += 1
# faint air texture: band-limited noise with slow swell
noise = rng.standard_normal(N).astype(np.float32)
F = np.fft.rfft(noise); fr = np.fft.rfftfreq(N, 1 / SR)
F *= ((fr > 250) & (fr < 2200)) * np.exp(-((fr - 900) / 900) ** 2)
air = np.fft.irfft(F, N).astype(np.float32)
air *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * np.arange(N) / SR)
air *= 0.012 / (np.abs(air).max() + 1e-9) * 6
L += air * 0.7; R += np.roll(air, 1700) * 0.7

# algorithmic reverb (different IR per channel for width)
def ir(seed):
    r = np.random.default_rng(seed); n = int(2.8 * SR); tt = np.arange(n) / SR
    x = r.standard_normal(n) * np.exp(-tt * 6.9 / 2.4)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); X *= 1 / (1 + (f / 4500) ** 2)
    x = np.fft.irfft(X, n); x[:int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    return (x / np.abs(x).sum() * 8).astype(np.float32)
def conv(x, h):
    n = 1 << int(np.ceil(np.log2(len(x) + len(h))))
    return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(h, n), n)[:len(x)].astype(np.float32)
wetL, wetR = conv(L, ir(11)), conv(R, ir(12))
L = L * 0.72 + wetL * 0.45; R = R * 0.72 + wetR * 0.45

# soft normalise to -3 dBFS peak (loudness is set in the mix stage)
pk = max(np.abs(L).max(), np.abs(R).max()); g = 0.708 / pk
out = (np.stack([L, R], 1) * g * 32767).astype(np.int16)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('wrote', OUT)
