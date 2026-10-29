#!/usr/bin/env python3
"""Portrait composites (1080x1920, 30 fps, silent) from the REAL animatic footage/source-animatic-720p.mp4.
Each shot = blurred, darkened extension of the same shot as backdrop + the real frame as a sharp card (no AI, no outpainting).
'full' = whole 16:9 frame at 1080 wide (nothing cropped); 'tall' = full frame height, cropped to the building (hero shots).
Lengths come from data/clips.json (scene lengths). Usage: python3 mkclips.py"""
import json, os, subprocess
D = os.path.dirname(os.path.abspath(__file__)); SRC = f"{D}/footage/source-animatic-720p.mp4"; A = f"{D}/assets"; T = f"{D}/out/tmp"
os.makedirs(A, exist_ok=True); os.makedirs(T, exist_ok=True)
L = json.load(open(f"{D}/data/clips.json")); XF = 0.25
BR = "0xD9A85B"
def seg(name, ss, dur, mode, y, cx=0.5, h=1010):
    out = f"{T}/{name}.mp4"
    bg = "[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=38:3,eq=brightness=-0.22:saturation=0.85[bg]"
    if mode == "full": fg, ch = "[b]scale=1080:-2[fg]", 608
    else: fg, ch = f"[b]scale=-2:{h},crop=1080:{h}:'max(0,min(iw-1080,iw*{cx}-540))':0[fg]", h
    fc = f"{bg};{fg};[bg][fg]overlay=0:{y},drawbox=x=0:y={y}:w=1080:h={ch}:color={BR}@0.9:t=3,format=yuv420p"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", f"{dur:.3f}", "-i", SRC, "-an", "-r", "30", "-filter_complex", fc, "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-g", "15", out], check=True); return out
def chain(name, parts, total, D=None):
    out = f"{A}/{name}.mp4"
    if len(parts) == 1:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", parts[0], "-vf", f"tpad=stop_mode=clone:stop_duration=3,trim=duration={total:.3f}", "-c:v", "libx264", "-crf", "16", "-g", "15", "-pix_fmt", "yuv420p", out], check=True); return
    ins = sum([["-i", p] for p in parts], []); fl = ""; cur = "[0:v]"; c = 0.0
    for i in range(1, len(parts)):
        c += D[i - 1]; fl += f"{cur}[{i}:v]xfade=transition=fade:duration={XF}:offset={c - XF / 2:.3f}[x{i}];"; cur = f"[x{i}]"
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + ins + ["-filter_complex", fl.rstrip(";"), "-map", cur, "-t", f"{total:.3f}", "-c:v", "libx264", "-crf", "16", "-g", "15", "-pix_fmt", "yuv420p", out], check=True)
def plan(name, total, shots, mode, y, h=1010, cuts=None):
    n = len(shots); D = cuts or [total / n] * n
    lens = [D[i] + (XF / 2 if i in (0, n - 1) else XF) + 0.05 for i in range(n)] if n > 1 else [total + 0.1]
    chain(name, [seg(f"{name}_{i}", ss, lens[i], mode, y, cx, h) for i, (ss, cx) in enumerate(shots)], total, D)
# 1 aerial context (S1 dolly-in of the animatic), whole frame
plan("v2", L["v2"], [(2.0, 0.5)], "full", 560)
# 2 result of the build, top card
plan("v5", L["v5"], [(16.0, 0.5)], "full", 290)
# 3 exterior: facade rising, then arrival court + palms (tall crops on the tower)
plan("v6", L["v6"], [(29.0, 0.5), (43.0, 0.45)], "tall", 290, cuts=L["v6_cuts"])
# 4 interiors: lobby (reception), office, apartment living room, duplex penthouse stair (real floors 1, 12, 31, 48)
plan("v7", L["v7"], [(62.0, 0.5), (101.0, 0.5), (72.0, 0.5), (85.5, 0.5)], "tall", 290, cuts=L["v7_cuts"])
# 5 finale: the night shot with the project's own title card, whole frame
plan("v9", L["v9"], [(113.4, 0.5)], "full", 560)
print("clips ok", sorted(f for f in os.listdir(A) if f.endswith(".mp4")))
