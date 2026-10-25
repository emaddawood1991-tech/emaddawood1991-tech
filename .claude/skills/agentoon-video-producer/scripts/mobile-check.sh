#!/usr/bin/env bash
# Extract phone-size review frames (read-only on the MP4). Usage: mobile-check.sh <video.mp4> [step_seconds=2.5]
v="$1"; step="${2:-2.5}"; [ -f "$v" ] || { echo "usage: mobile-check.sh <video.mp4> [step]"; exit 2; }
o="${v%.mp4}.mobile"; mkdir -p "$o"
ffmpeg -v error -y -i "$v" -vf "fps=1/$step,scale=360:640" "$o/f360_%03d.png"
ffmpeg -v error -y -i "$v" -vf "fps=1/$step,scale=270:480" "$o/f270_%03d.png"
n=$(ls "$o"/f360_*.png | wc -l); cols=8; rows=$(( (n+cols-1)/cols ))
ffmpeg -v error -y -i "$v" -vf "fps=1/$step,scale=270:480,tile=${cols}x${rows}" -frames:v 1 "$o/sheet.png"
echo "frames: $n at 360x640 and 270x480; sheet: $o/sheet.png"
echo "Review each: command/key text readable? inside safe area (x60-1020,y220-1500)? captions off commands? Record PASS/FAIL in data/QC-REPORT.md"
