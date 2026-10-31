#!/usr/bin/env bash
# Contact sheets for review: 20 evenly spaced frames, and (optional) robot crops. Usage: sample-frames.sh <mp4> [outdir] [robot_crop=w:h:x:y]
set -eu; F="${1:?mp4}"; O="${2:-$(dirname "$F")/qc-review}"; C="${3:-300:340:780:1150}"; mkdir -p "$O"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
ffmpeg -v error -y -i "$F" -vf "fps=20/$D,scale=270:-1,tile=10x2" -frames:v 1 "$O/contact-sheet.png"
for t in 0.5 $(python3 -c "d=$D;print(' '.join(str(round(d*x,1)) for x in (0.2,0.5,0.8)))"); do ffmpeg -v error -y -ss "$t" -i "$F" -frames:v 1 -vf "crop=$C,scale=300:-1" "$O/robot-$t.png"; done
echo "contact sheet: $O/contact-sheet.png ; robot crops: $O/robot-*.png (compare a silent frame with speaking frames; adjust crop if the robot is elsewhere)"
