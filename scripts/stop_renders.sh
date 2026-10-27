#!/usr/bin/env bash
# Stops running Blender renders without ever matching the calling shell.
me=$$; parent=$PPID
for pat in '[b]pyenv/bin/python render_stage' '[r]ender_all\.sh'; do
  for pid in $(pgrep -f "$pat"); do
    [ "$pid" = "$me" ] || [ "$pid" = "$parent" ] || kill "$pid" 2>/dev/null
  done
done
sleep 2
left=$(pgrep -fc '[b]pyenv/bin/python render_stage' || true)
echo "render_stage still running: ${left:-0}"
