#!/usr/bin/env bash
# Post-render checks for an Agentoon.ai video. Read-only: never modifies the video.
# Usage: validate-render.sh <video.mp4> [word_count]
# Writes a phone-size contact sheet to <video>-review/. Exit 1 if any FAIL.
set -u
V="${1:-}"; WORDS="${2:-}"
[ -s "$V" ] || { echo "FAIL file missing or empty: $V"; exit 1; }
command -v ffprobe >/dev/null && command -v ffmpeg >/dev/null || { echo "FAIL ffmpeg/ffprobe not installed"; exit 1; }

FAILS=0; WARNS=0
pass() { echo "PASS  $*"; }
warn() { echo "WARN  $*"; WARNS=$((WARNS+1)); }
fail() { echo "FAIL  $*"; FAILS=$((FAILS+1)); }
num()  { awk -v a="$1" -v b="$2" -v op="$3" 'BEGIN{r=0; if(op=="ge")r=(a>=b); else if(op=="le")r=(a<=b); else if(op=="gt")r=(a>b); print r}'; }

# --- container / streams
vid=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -of csv=p=0 "$V")
IFS=, read -r vcodec W H PIX FR <<<"$vid"   # ffprobe prints fields in stream order
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
acodec=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$V")
fps=$(awk -F/ '{ if ($2>0) printf "%.2f", $1/$2; else print $1 }' <<<"$FR")
echo "INFO  ${W}x${H} ${vcodec} ${PIX} ${fps}fps duration ${dur}s audio=${acodec:-none}"

[ "$W" = 1080 ] && [ "$H" = 1920 ] && pass "resolution 1080x1920" || fail "resolution is ${W}x${H}, expected 1080x1920"
[ "$vcodec" = h264 ] && pass "video codec h264" || warn "video codec is $vcodec (h264 recommended)"
[ "$PIX" = yuv420p ] && pass "pixel format yuv420p" || warn "pixel format is $PIX (yuv420p recommended for Instagram/TikTok)"
case "$fps" in 24.00|30.00) pass "frame rate ${fps}";; *) warn "frame rate ${fps} (24 or 30 expected)";; esac
[ -n "$acodec" ] && pass "audio stream present ($acodec)" || fail "no audio stream"
if [ "$(num "$dur" 110 le)" = 1 ]; then pass "duration ${dur}s (max 110s)"; else fail "duration ${dur}s exceeds 1:50"; fi
if [ "$(num "$dur" 60 ge)" = 0 ]; then warn "duration ${dur}s is under 60s (fine for tests; tutorials target 60-90s)"; fi

# --- loudness and true peak
if [ -n "$acodec" ]; then
  LOG=$(ffmpeg -nostats -i "$V" -af ebur128=peak=true -f null - 2>&1)
  I=$(grep -E '^\s+I:' <<<"$LOG" | tail -1 | awk '{print $2}')
  TP=$(grep -E '^\s+Peak:' <<<"$LOG" | tail -1 | awk '{print $2}')
  echo "INFO  integrated ${I:-?} LUFS, true peak ${TP:-?} dBFS"
  if [ -n "$I" ]; then
    if [ "$(num "$I" -17 ge)" = 1 ] && [ "$(num "$I" -13 le)" = 1 ]; then pass "loudness ${I} LUFS (target about -15)"; else warn "loudness ${I} LUFS outside -17..-13"; fi
  else warn "could not measure loudness"; fi
  if [ -n "$TP" ]; then
    if [ "$(num "$TP" -1 le)" = 1 ]; then pass "true peak ${TP} dBTP (<= -1)"; else fail "true peak ${TP} dBTP exceeds -1 (clipping risk)"; fi
  fi

  # --- silence gaps
  SIL=$(ffmpeg -nostats -i "$V" -af silencedetect=noise=-35dB:d=1.0 -f null - 2>&1 | grep -E 'silence_(start|end)')
  if [ -z "$SIL" ]; then pass "no silence gap >= 1.0s"; else warn "silence >= 1.0s detected (check each is intentional):"; echo "$SIL" | sed 's/^/        /'; fi
fi

# --- narration speed
if [ -n "$WORDS" ]; then
  wpm=$(awk -v w="$WORDS" -v d="$dur" 'BEGIN{printf "%.0f", w/(d/60)}')
  echo "INFO  ${WORDS} words / ${dur}s = ${wpm} wpm (video length; speaking-only pace is slightly higher)"
  if [ "$wpm" -ge 145 ] && [ "$wpm" -le 180 ]; then pass "narration pace ~${wpm} wpm (target 155-170)"; else warn "narration pace ${wpm} wpm outside 145-180; recompute with voice-only duration"; fi
fi

# --- phone-size review frames
OUT="${V%.*}-review"; mkdir -p "$OUT"
ffmpeg -v error -y -i "$V" -vf "fps=1/2,scale=390:-1,tile=6x2" -frames:v 1 "$OUT/phone-sheet.png" && echo "INFO  phone-size contact sheet: $OUT/phone-sheet.png (view it: commands readable? subtitles clear of code? safe areas?)"
ffmpeg -v error -y -i "$V" -vf "fps=1/3,scale=390:-1" "$OUT/phone-%03d.png" && echo "INFO  single phone-width frames: $OUT/phone-*.png"

echo "---- ${FAILS} fail, ${WARNS} warn. Manual: safe areas, readability, spelling, robot acting, branding, ending."
[ "$FAILS" -eq 0 ]
