#!/usr/bin/env python3
"""Proves every showcase effect is visible in the RENDERED showcase video (pixel/motion checks on extracted frames, per scene + per transition).
Usage: python3 scripts/verify-showcase.py [out/showcase.mp4]   -> out/verify-showcase.json, exit 1 on any failure."""
import json, os, subprocess, sys, hashlib
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = sys.argv[1] if len(sys.argv) > 1 else f"{D}/out/showcase.mp4"
DUR = [96, 96, 96, 100, 112, 110, 100, 100, 100, 100, 112, 112, 112]; TR = 14
START = [sum(DUR[:i]) - i * TR for i in range(len(DUR))]
cache = {}
def fr(n):
    if n in cache: return cache[n]
    p = f"/tmp/_vs_{hashlib.md5(V.encode()).hexdigest()[:6]}_{n}.png"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", V, "-vf", f"select=eq(n\\,{n})", "-vframes", "1", p], check=True)
    cache[n] = np.asarray(Image.open(p).convert("RGB")).astype(np.int16); return cache[n]
S = lambda i, f: fr(START[i - 1] + f)  # frame f of scene i
near = lambda a, rgb, tol=60: (np.abs(a - np.array(rgb)).sum(axis=2) < tol).mean()
diff = lambda a, b: float(np.abs(a - b).mean())
R = {}; ok = True
def check(name, cond, detail):
    global ok; ok &= bool(cond); R[name] = {"pass": bool(cond), "detail": detail}; print(("PASS " if cond else "FAIL ") + name + " :: " + detail)
LIME = (200, 240, 49)
# 01 counter: lime digits appear and grow; final frame is the 1,000 layout
a, b = S(1, 2), S(1, 72); check("01 counter: digits animate (frame 2 vs 72)", diff(a, b) > 12 and near(b, LIME) > near(a, LIME) + 0.02, f"diff {diff(a, b):.1f}, lime {near(a, LIME):.3f}->{near(b, LIME):.3f}")
# 02 percent: ring appears
a, b = S(2, 4), S(2, 80); check("02 percent: digits roll and ring fills", diff(a, b) > 8 and near(b, LIME) > 0.04, f"diff {diff(a, b):.1f}, lime {near(a, LIME):.3f}->{near(b, LIME):.3f}")
# 03 bars: bars grow
a, b = S(3, 6), S(3, 80); check("03 bar chart: bars grow, line draws", diff(a, b) > 8 and near(b, (53, 242, 255), 90) > 0.003 and near(b, LIME) > 0.003, f"diff {diff(a, b):.1f}, cyan {near(b, (53, 242, 255), 90):.4f}, lime {near(b, LIME):.4f}")
# 04 3d logo: blue body + changes between rotation angles + blender sprite
a, b = S(4, 20), S(4, 55); blue = lambda x: near(x, (32, 86, 223), 120); check("04 3D logo rotates (frame 20 vs 55 differ, blue body present)", diff(a, b) > 6 and blue(a) + blue(b) > 0.05, f"diff {diff(a, b):.1f}, blue {blue(a):.3f}/{blue(b):.3f}")
bl = lambda x: x[1500:1860, 640:1040]; check("04 Blender render panel animates (bottom-right region)", diff(bl(S(4, 30)), bl(S(4, 45))) > 1.0, f"diff {diff(bl(S(4, 30)), bl(S(4, 45))):.2f}")
# 05 fly-through: bright screenshot content + large motion between frames (camera moving)
a, b = S(5, 30), S(5, 60); check("05 fly-through: camera moves through textured panels", diff(a, b) > 15 and (a.mean() > 25 or b.mean() > 25), f"diff {diff(a, b):.1f}, mean lum {a.mean():.0f}/{b.mean():.0f}")
# 06 kinetic: lime highlight + progressive reveal
a, b = S(6, 6), S(6, 90); check("06 kinetic type: words/letters/morph appear progressively", diff(a, b) > 12 and near(b, LIME) > 0.01, f"diff {diff(a, b):.1f}, lime {near(b, LIME):.3f}")
# 07 mcp: amber client node + lime server + cyan tools, dots move
b = S(7, 80); c = S(7, 88); check("07 MCP diagram: amber/lime/cyan nodes + flowing dots move", near(b, (255, 178, 62), 80) > 0.001 and near(b, LIME) > 0.002 and near(b, (53, 242, 255), 90) > 0.002 and diff(b, c) > 0.5, f"amber {near(b, (255, 178, 62), 80):.4f} lime {near(b, LIME):.4f} cyan {near(b, (53, 242, 255), 90):.4f} dots-diff {diff(b, c):.2f}")
# 08 morph: red -> lime
RED = (255, 90, 77); a, b = S(8, 20), S(8, 90); check("08 morphing comparison: red (paid) -> lime (open source)", near(a, RED) > near(b, RED) + 0.003 and near(b, LIME) > near(a, LIME) + 0.003, f"red {near(a, RED):.4f}->{near(b, RED):.4f}, lime {near(a, LIME):.4f}->{near(b, LIME):.4f}")
# 09 robot neon: neon pixels around the silhouette
from scipy import ndimage as ndi
rob = np.asarray(Image.open(f"{D}/public/robot/robot-neutral.png").split()[3].resize((760, 1064))) > 128; cv = np.zeros((1920, 1080), bool); cv[380:380 + 1064, 160:160 + 760] = rob
ring = ndi.binary_dilation(cv, iterations=22) & ~ndi.binary_dilation(cv, iterations=2); far = ~ndi.binary_dilation(cv, iterations=140); f9 = S(9, 75)
neon = (((f9[..., 1] > 170) & (f9[..., 2] > 200) & (f9[..., 0] < 140)) | ((f9[..., 0] > 200) & (f9[..., 2] > 180) & (f9[..., 1] < 130)))
check("09 robot neon outline hugs the silhouette", neon[ring].mean() > 0.05 and neon[ring].mean() > 20 * max(neon[far].mean(), 1e-4), f"ring {neon[ring].mean():.3f} vs far {neon[far].mean():.5f}")
# 10 scrapbook
a, b = S(10, 6), S(10, 80); check("10 scrapbook: cards fly in, paper + lime highlight", diff(a, b) > 20 and near(b, LIME) > 0.01 and (b.min(axis=2) > 245).mean() > 0.1, f"diff {diff(a, b):.1f}, lime {near(b, LIME):.3f}")
# 11 explainer
a, b = S(11, 20), S(11, 90); check("11 explainer panel: amber callouts + steps advance", near(b, (255, 178, 62), 70) > 0.003 and diff(a, b) > 12, f"amber {near(b, (255, 178, 62), 70):.4f}, diff {diff(a, b):.1f}")
# 12 logo motion: multicolour AppFlowy logo + particle logo region changes
a, b = S(12, 12), S(12, 90); pr = lambda x: x[330:810, 540:1020]; check("12 logo motion: logos animate, particle logo assembles", diff(pr(S(12, 14)), pr(S(12, 70))) > 8 and near(b, (255, 0, 140), 120) + near(b, (0, 190, 255), 120) > 0.003, f"particle diff {diff(pr(S(12, 14)), pr(S(12, 70))):.1f}")
# 13 tracking + speed ramp: background tiles scroll, robot stays near centre
a, b = S(13, 20), S(13, 40); c = S(13, 60); d = S(13, 70); fast, slow = diff(a, b), diff(c, d); check("13 tracking camera + speed ramp (fast segment moves more than slow)", fast > 1.0 and fast > slow * 1.2, f"fast {fast:.2f} vs slow {slow:.2f}")
# transitions: mid-transition frame differs from both neighbours and is not black
for i in range(1, len(DUR)):
    mid = START[i] + TR // 2 - 0; before = fr(START[i] - 1 if START[i] > 0 else 0); after = fr(START[i] + TR + 2); m = fr(mid)
    check(f"transition {i}->{i + 1}: blends two scenes mid-way", diff(m, before) > 4 and diff(m, after) > 4 and m.mean() > 6, f"mid-vs-before {diff(m, before):.1f}, mid-vs-after {diff(m, after):.1f}")
json.dump(R, open(f"{D}/out/verify-showcase.json", "w"), indent=1); print("ALL PASS" if ok else "SOME FAILED"); sys.exit(0 if ok else 1)
