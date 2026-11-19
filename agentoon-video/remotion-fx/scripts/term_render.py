#!/usr/bin/env python3
"""Replay a real terminal capture (JSONL [t, base64 bytes]) through pyte and render it to an MP4 (frames piped to ffmpeg). Idle gaps longer than --gap seconds are
shortened to --gap (and the clip is marked as trimmed). Usage: term_render.py <in.jsonl> <out.mp4> [--cols 74 --rows 26 --font 22 --fps 30 --gap 0.7 --hold 1.2]"""
import sys, json, base64, argparse, subprocess
import pyte
from PIL import Image, ImageDraw, ImageFont
ap = argparse.ArgumentParser(); ap.add_argument("inp"); ap.add_argument("out"); ap.add_argument("--cols", type=int, default=74); ap.add_argument("--rows", type=int, default=26)
ap.add_argument("--font", type=int, default=22); ap.add_argument("--fps", type=int, default=30); ap.add_argument("--gap", type=float, default=0.7); ap.add_argument("--hold", type=float, default=1.2)
ap.add_argument("--maxlen", type=float, default=0)
a = ap.parse_args()
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", a.font); FB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", a.font)
cw = F.getlength("M"); lh = int(a.font * 1.36); pad = 20; W = int(cw * a.cols + pad * 2); H = lh * a.rows + pad * 2; W += W % 2; H += H % 2
BG = (14, 17, 23); FG = (232, 234, 240)
PAL = {"black": (60, 64, 72), "red": (255, 107, 107), "green": (126, 231, 135), "brown": (255, 200, 87), "blue": (110, 168, 254), "magenta": (213, 140, 255), "cyan": (86, 214, 229), "white": (232, 234, 240),
       "brightblack": (130, 138, 150), "brightred": (255, 130, 130), "brightgreen": (150, 245, 160), "brightbrown": (255, 220, 120), "brightblue": (140, 190, 255), "brightmagenta": (230, 170, 255), "brightcyan": (130, 235, 245), "brightwhite": (255, 255, 255)}
def col(c, default):
    if c == "default": return default
    if c in PAL: return PAL[c]
    try: return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
    except Exception: return default
ev = [json.loads(l) for l in open(a.inp)]
# compressed time map
comp = []; t_prev = 0.0; tc = 0.0
for t, b in ev:
    d = t - t_prev; tc += min(d, a.gap) if d > a.gap else d; t_prev = t; comp.append((tc, b))
total = comp[-1][0] + a.hold
if a.maxlen: total = min(total, a.maxlen)
screen = pyte.Screen(a.cols, a.rows); stream = pyte.ByteStream(screen)
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(a.fps), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", a.out], stdin=subprocess.PIPE)
i = 0; nf = int(total * a.fps)
for f in range(nf):
    t = f / a.fps
    while i < len(comp) and comp[i][0] <= t: stream.feed(base64.b64decode(comp[i][1])); i += 1
    img = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(img)
    for y in range(a.rows):
        row = screen.buffer[y]; x = 0
        while x < a.cols:
            ch = row[x]; s = ch.data; fg = col(ch.fg, FG); bg = col(ch.bg, None) if ch.bg != "default" else None
            if ch.reverse: fg, bg = (bg or BG), fg
            px, py = pad + x * cw, pad + y * lh
            if bg: d.rectangle([px, py, px + cw, py + lh], fill=bg)
            if s.strip(): d.text((px, py), s, font=FB if ch.bold else F, fill=fg)
            x += 1
    if (f // 15) % 2 == 0: cx, cy = screen.cursor.x, screen.cursor.y; d.rectangle([pad + cx * cw, pad + cy * lh + 3, pad + (cx + 1) * cw, pad + (cy + 1) * lh - 3], fill=(200, 240, 49))
    ff.stdin.write(img.tobytes())
ff.stdin.close(); ff.wait(); print(a.out, f"{W}x{H}", f"{nf / a.fps:.1f}s (from {ev[-1][0]:.1f}s real)")
