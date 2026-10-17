#!/usr/bin/env bash
# Create a new Agentoon episode project: ./new-episode.sh <NN-slug>
# Copies the shared kit (without python tools) into episodes/<NN-slug>/kit, never touches existing episodes.
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"; NAME="${1:?usage: new-episode.sh <NN-slug>}"; DEST="$HERE/episodes/$NAME"
[ -e "$DEST" ] && { echo "episodes/$NAME already exists, refusing to overwrite"; exit 1; }
mkdir -p "$DEST/kit" "$DEST/audio" "$DEST/out"
(cd "$HERE/kit" && tar cf - --exclude=py .) | (cd "$DEST/kit" && tar xf -)
cp "$HERE/hyperframes.json" "$DEST/"
printf '{"id":"agentoon-%s","name":"%s"}\n' "$NAME" "$NAME" > "$DEST/meta.json"
cat > "$DEST/episode.json" <<JSON
{ "title": "TODO", "voice": "am_michael", "speed": 1.1, "total": 75.0,
  "phrases": [ {"id": "p0", "speak": "TODO hook line.", "show": "TODO hook line."} ],
  "music": [ {"t0": 0, "t1": 75, "mood": "hook"} ], "sfx": [] }
JSON
echo "Created $DEST"
echo "Next: pick a NEW look (see .claude/skills/agentoon-video-producer/references/creative-direction.md), write episode.json,"
echo "  python kit/py/build_audio.py tts $DEST/episode.json   # narration + timeline.js"
echo "  author $DEST/index.html (copy 00-quality-test/index.html as a starting point, do not reuse its look)"
echo "  python kit/py/build_audio.py mix $DEST/episode.json   # music + sfx + loudnorm"
echo "  cd $DEST && npx hyperframes check && npx hyperframes render --quality delivery --fps 30 --output out/<name>.mp4"
echo "  bash ../../../.claude/skills/agentoon-video-producer/scripts/validate-render.sh out/<name>.mp4 <word_count>"
