#!/usr/bin/env bash
# Prepend the Win+X intro to a FINISHED video without re-encoding the finished video (stream copy = original frames/audio untouched).
# usage: splice-intro.sh <finished.mp4> <intro.mp4> <new-output.mp4>
set -eu
FIN="$1"; INTRO="$2"; OUT="$3"; [ -e "$OUT" ] && { echo "refusing to overwrite $OUT"; exit 1; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$FIN")
SR=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "$FIN")
CH=$(ffprobe -v error -select_streams a:0 -show_entries stream=channels -of csv=p=0 "$FIN")
PF=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 "$FIN")
TS=$(ffprobe -v error -select_streams v:0 -show_entries stream=time_base -of csv=p=0 "$FIN" | awk -F/ '{print $2}')
VP=$(ffprobe -v error -select_streams v:0 -show_entries stream=profile -of csv=p=0 "$FIN")
case "$VP" in High) P=high;; Main) P=main;; Baseline) P=baseline;; *) P=high;; esac
VD=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$INTRO")
ffmpeg -v error -y -i "$INTRO" -af "atrim=0:$(python3 -c "print(max(0.5,$VD-${AUDIO_TRIM:-0.047}))"),asetpts=PTS-STARTPTS" -r "$FPS" -c:v libx264 -profile:v $P -pix_fmt "$PF" -crf 14 -preset slow -video_track_timescale "$TS" -c:a aac -ar "$SR" -ac "$CH" -b:a 192k "$T/intro.mp4"
printf "file '%s'\nfile '%s'\n" "$T/intro.mp4" "$(cd "$(dirname "$FIN")" && pwd)/$(basename "$FIN")" > "$T/list.txt"
ffmpeg -v error -f concat -safe 0 -i "$T/list.txt" -c copy -movflags +faststart "$OUT"
echo "wrote $OUT"
