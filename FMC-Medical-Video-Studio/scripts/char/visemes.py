"""Audio-driven mouth parameters per video frame (30 fps) from narration WAV/MP3 files (numpy + ffmpeg only).
 o: mouth openness 0..1   w: mouth width/roundness factor (0.8 round 'oo' ... 1.15 spread 'ee')
 This is amplitude+spectrum driven lip sync (not phoneme-accurate): vowels/openness from energy and spectral balance,
 fricatives -> teeth-visible small opening, pauses -> closed."""
import sys, json, subprocess, numpy as np
FPS = 30
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32), 16000
def analyse(path):
    x, sr = load(path); hop = sr // FPS; win = int(sr * 0.04)
    n = len(x) // hop
    o = np.zeros(n); w = np.ones(n); env = np.zeros(n)
    fr = np.fft.rfftfreq(win, 1 / sr); hann = np.hanning(win)
    for i in range(n):
        seg = x[i * hop: i * hop + win]
        if len(seg) < win: seg = np.pad(seg, (0, win - len(seg)))
        rms = np.sqrt((seg ** 2).mean() + 1e-12); env[i] = 20 * np.log10(rms + 1e-9)
        S = np.abs(np.fft.rfft(seg * hann)) ** 2 + 1e-12
        b = lambda lo, hi: S[(fr >= lo) & (fr < hi)].sum()
        low, f1, f2, hi = b(150, 450), b(450, 1000), b(1000, 2800), b(3500, 7500)
        tot = low + f1 + f2 + hi
        o[i] = f1 / tot             # open vowels carry energy in the F1 band
        w[i] = 1.0 + 0.25 * (f2 / tot - 0.30) - 0.35 * (low / tot - 0.35)
        w[i] = np.clip(w[i], 0.8, 1.18)
        hf = hi / tot
        o[i] = o[i] * 1.0 + (0.0 if hf < 0.25 else -0.1)
        o[i] = 0.55 + 0.45 * np.clip(o[i] / 0.55, 0, 1)    # spectral class only modulates (loudness drives the jaw)
        if hf > 0.35: o[i] = 0.22                              # s / sh / f : teeth, small opening
    p95 = np.percentile(env, 95)
    lev = np.clip((env - (p95 - 22)) / 15, 0, 1)             # relative to this clip's own speech level
    o = o * lev ** 0.9
    o[env < p95 - 24] = 0
    # smoothing: fast attack, slower release, no jitter
    out = np.zeros(n); prev = 0
    for i in range(n):
        a = 0.8 if o[i] > prev else 0.5
        prev = prev + (o[i] - prev) * a; out[i] = prev
    wsm = np.convolve(np.pad(w, 2, mode='edge'), np.ones(5) / 5, 'valid')
    return [round(float(v), 3) for v in np.clip(out * 1.15, 0, 1)], [round(float(v), 3) for v in wsm]
if __name__ == '__main__':
    manifest_dir = sys.argv[1]
    m = json.load(open(manifest_dir + '/manifest.json'))
    res = {}
    for s in m['scenes']:
        o, w = analyse('assets/' + s['file']); res[s['id']] = {'o': o, 'w': w}
        print(s['id'], len(o), 'frames, mean open %.2f, speaking frames %d' % (np.mean(o), sum(v > 0.08 for v in o)))
    json.dump({'fps': FPS, 'scenes': res}, open(manifest_dir + '/visemes.json', 'w'))
