# Agentoon video kit

Reusable, original, free components for HyperFrames episodes (GSAP, HTML, CSS, SVG). One shared kit, one folder per episode
(`new-episode.sh` copies the kit into each episode so every project renders standalone). Licences: `LICENSES.md`.

| Module | API |
|---|---|
| `robot.js` | `Robot.create(host,{id,w,x,y})` then `bot.introduce / walk / aimPoint / react('wow'\|'think'\|'worried'\|'celebrate') / hop / wave / look / blinks / outro` (all take absolute times, return end time) |
| `outro.js` | `Outro.build(tl, scene, at, {bot, cx, y, fromX})` signature ending: navy field, `agentoon`+`.ai` (#60CDFF) wordmark, one "+ Follow Agentoon.ai" CTA |
| `captions.js` | `Captions.build(tl, host, words, {style:'tag'\|'bar'\|'plain', bottom, active})` word-timed kinetic subtitles |
| `camera.js` | `Cam.cardGrow / whip / push / drift` original continuous-camera transitions |
| `collage.js` | `Collage.paper / stopIn / arrow` torn-paper, halftone, stop-motion B-roll |
| `term.js` | `Term.card / type` real-output terminal cards with stepped typing |
| `py/build_audio.py` | `tts` (Kokoro, calibrates to 156-168 wpm, writes timeline.js) and `mix` (synth music + SFX, ducking, -15 LUFS) |

Setup for audio (once): `python3 -m venv /tmp/kokoro/venv && /tmp/kokoro/venv/bin/pip install kokoro-onnx soundfile`, then download
`kokoro-v1.0.onnx` and `voices-v1.0.bin` from the kokoro-onnx GitHub release `model-files-v1.0` into `/tmp/kokoro` (or set `KOKORO_MODEL`, `KOKORO_VOICES`).

Robot rig note: rebuilt from the brand description (teal body, light-grey head, red antenna bulb, navy eyes, chest light, black outlines).
Replace the shapes in `robot.js` with the canonical artwork when the original file is supplied; the actions do not change.
Word timings are estimated from phrase durations (Kokoro has no alignment): re-check subtitle sync.
