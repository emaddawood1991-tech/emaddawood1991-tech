#!/usr/bin/env bash
# Motion profile of a video (read-only analysis, never renders or edits anything).
# Usage: motion-profile.sh <video.mp4> [--quiet]
# Prints: hard-cut times, motion energy per 0.5 s, mean energy, share of "alive" time, and static stretches.
# Energy = mean absolute frame difference (0-255 scale, measured on a 270 px wide copy). Reference range from the
# approved Agentoon references: holds 0.2-4, transitions/camera moves 8-21, mean about 6-7.
set -u
V="${1:-}"; [ -s "$V" ] || { echo "usage: motion-profile.sh <video.mp4>"; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not installed"; exit 1; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$V" | awk -F/ '{printf "%.3f", $1/$2}')
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
ffmpeg -nostats -i "$V" -vf "scale=270:-1,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -an -f null - 2>&1 | grep -o "YAVG=[0-9.]*" | cut -d= -f2 > "$TMP/e.txt"
CUTS=$(ffmpeg -nostats -i "$V" -vf "select='gt(scene,0.3)',showinfo" -an -f null - 2>&1 | grep -o "pts_time:[0-9.]*" | cut -d: -f2 | awk '{printf "%.1f ", $1}')
python3 - "$TMP/e.txt" "$FPS" "$DUR" "$CUTS" "${2:-}" <<'EOF'
import sys
e = [float(x) for x in open(sys.argv[1])]; fps = float(sys.argv[2]); dur = float(sys.argv[3]); cuts = sys.argv[4]; quiet = sys.argv[5] == "--quiet"
seg = max(1, round(fps / 2)); w = [sum(e[i:i + seg]) / len(e[i:i + seg]) for i in range(0, len(e), seg)]   # 0.5 s windows
mean = sum(e) / len(e); alive = sum(1 for x in w if x >= 2.0) / len(w); burst = sum(1 for x in w if x >= 8.0)
print(f"duration {dur:.1f}s  fps {fps:g}  hard cuts at: {cuts or 'none'}")
if not quiet: print("energy per 0.5s: " + " ".join(f"{x:.1f}" for x in w))
print(f"mean energy {mean:.1f}   alive time (>=2.0): {alive*100:.0f}%   motion bursts (>=8.0 per 0.5s): {burst}  ({burst/dur*60:.1f} per minute)")
# static stretches: >= 2.5 s below 1.0, ignoring the last 3 s (signature ending may hold)
limit = len(w) - 6; run = 0; start = 0; found = []
for i in range(limit):
    if w[i] < 1.0:
        if run == 0: start = i
        run += 1
    else:
        if run >= 5: found.append((start * 0.5, (start + run) * 0.5))
        run = 0
if run >= 5: found.append((start * 0.5, (start + run) * 0.5))
print("static stretches (>=2.5 s, energy<1.0): " + (", ".join(f"{a:.1f}-{b:.1f}s" for a, b in found) if found else "none"))
# verdict against the reference rhythm: a burst or camera move every ~2.5 s
gap = 0; longest = 0
for x in w[:limit]:
    gap = 0 if x >= 8.0 else gap + 0.5; longest = max(longest, gap)
print(f"longest gap between motion bursts: {longest:.1f}s  (references: about 2.5s)")
EOF
