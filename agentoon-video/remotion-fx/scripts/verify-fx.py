#!/usr/bin/env python3
"""Proves each effect is actually visible in the rendered clips (not just that the render succeeded).
Usage: python3 scripts/verify-fx.py   (run after scripts/render-tests.sh). Exit 1 if any check fails. Writes out/verify-report.json"""
import json, subprocess, sys, os
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); O = f"{D}/out"
def frame(clip, n):
    p = f"/tmp/_vf_{os.path.basename(clip)}_{n}.png"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip, "-vf", f"select=eq(n\\,{n})", "-vframes", "1", p], check=True)
    return np.asarray(Image.open(p).convert("RGB")).astype(np.int16)
def near(a, rgb, tol): return (np.abs(a - np.array(rgb)).sum(axis=2) < tol)
def motion(clip, a, b): return float(np.abs(frame(clip, a) - frame(clip, b)).mean())
R = {}; ok = True
def check(name, cond, detail):
    global ok; ok &= bool(cond); R[name] = {"pass": bool(cond), "detail": detail}; print(("PASS " if cond else "FAIL ") + name + " :: " + detail)

# TEST A: scrapbook collage
A = f"{O}/test-a-scrapbook.mp4"; f90 = frame(A, 90); f0 = frame(A, 0)
lime = near(f90, (200, 240, 49), 60).mean(); sd = f90[:60, :].std()
check("A lime title highlight + notes present", lime > 0.01, f"lime pixel share {lime:.3f}")
bg = f90[1850:1900, 20:80].reshape(-1, 3); check("A paper texture (grain variance on background)", bg.std(axis=0).mean() > 1.5, f"bg std {bg.std(axis=0).mean():.2f}")
white = (f90.min(axis=2) > 245).mean(); check("A white paper cards / sticker borders", white > 0.12, f"near-white share {white:.3f}")
check("A staggered entrances (frame 10 != frame 90)", motion(A, 10, 90) > 25, f"mean abs diff {motion(A, 10, 90):.1f}")
check("A camera depth (late frames still move)", motion(A, 120, 140) > 0.8, f"mean abs diff {motion(A, 120, 140):.2f}")

# TEST B: explainer panel
B = f"{O}/test-b-explainer.mp4"; b50 = frame(B, 50); b105 = frame(B, 105)
amber = near(b50, (255, 178, 62), 70).mean(); check("B amber highlight/callout/connector", amber > 0.004, f"amber share {amber:.4f}")
lime = near(b50, (200, 240, 49), 60).mean(); check("B lime caption/step highlight", lime > 0.004, f"lime share {lime:.4f}")
check("B camera glides (zoom changes between 20 and 60)", motion(B, 20, 60) > 8, f"diff {motion(B, 20, 60):.1f}")
check("B steps advance (frame 50 != 105)", motion(B, 50, 105) > 8, f"diff {motion(B, 50, 105):.1f}")
# cursor: white arrow pixels exist inside the browser viewport and move between frames
w = lambda a: (a[420:980, 40:1040].min(axis=2) > 250); check("B cursor/click ripple moves", np.logical_xor(w(frame(B, 30)), w(frame(B, 36))).mean() > 0.0004, "white-pixel XOR between f30 and f36")

# TEST C: neon outline around the robot silhouette
C = f"{O}/test-c-neon.mp4"; c75 = frame(C, 75)
rob = np.asarray(Image.open(f"{D}/public/robot/robot-neutral.png").split()[3].resize((760, 1064))) > 128
canvas = np.zeros((1920, 1080), bool); canvas[300:300 + 1064, 160:160 + 760] = rob
from scipy import ndimage as ndi
ring = ndi.binary_dilation(canvas, iterations=22) & ~ndi.binary_dilation(canvas, iterations=2)
far = ~ndi.binary_dilation(canvas, iterations=140)
neon = lambda a: (((a[..., 1] > 170) & (a[..., 2] > 200) & (a[..., 0] < 140)) | ((a[..., 0] > 200) & (a[..., 2] > 180) & (a[..., 1] < 130)))
nr = neon(c75)[ring].mean(); nf = neon(c75)[far].mean()
check("C neon pixels hug the silhouette contour", nr > 0.05 and nr > 20 * max(nf, 1e-4), f"ring {nr:.3f} vs far {nf:.5f}")
check("C outline animates (sweep/pulse change between frames)", motion(C, 60, 75) > 0.15, f"diff {motion(C, 60, 75):.2f}")
check("C subject stays on top (teal body present)", near(c75, (25, 181, 165), 90).mean() > 0.03, f"teal share {near(c75, (25, 181, 165), 90).mean():.3f}")
json.dump(R, open(f"{O}/verify-report.json", "w"), indent=1); print("ALL PASS" if ok else "SOME FAILED"); sys.exit(0 if ok else 1)
