"""One soft 'airy breath' texture for Version B transitions: pink-ish noise, 350 Hz–1.8 kHz warm band (no hiss, no metal), slow Hann envelope (0.9 s in / 1.1 s out),
stereo-decorrelated. Starts and ends at exactly zero (no clicks)."""
import sys, numpy as np, wave
SR = 48000; D = 2.2
rng = np.random.default_rng(21)
n = int(D * SR); t = np.arange(n) / SR
out = []
for ch in range(2):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); f[0] = 1
    X *= 1 / np.sqrt(f / 200.0)                       # pink tilt
    X *= 1 / (1 + (f / 1800.0) ** 4) * (1 - 1 / (1 + (f / 350.0) ** 4))  # warm band-pass
    y = np.fft.irfft(X, n)
    env = np.where(t < 0.9, np.sin(0.5 * np.pi * t / 0.9) ** 2, np.sin(0.5 * np.pi * (D - t) / 1.3) ** 2)
    env = np.where(t > D - 1.3, np.sin(0.5 * np.pi * (D - t) / 1.3) ** 2, np.where(t < 0.9, np.sin(0.5 * np.pi * t / 0.9) ** 2, 1.0))
    out.append(y * env)
a = np.stack(out, 1); a *= 0.5 / np.abs(a).max()
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a * 32767).astype(np.int16).tobytes())
print('wrote', sys.argv[1])
