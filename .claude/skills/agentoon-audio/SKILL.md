---
name: agentoon-audio
description: >-
  Professional sound direction for Agentoon.ai videos: English voiceover timing and pace, music ducking, subtle keyboard and mouse-click effects, clean dialogue, loudness consistency (-15 LUFS), caption synchronisation. Use for narration generation, mixing, SFX cues and audio QC.
argument-hint: <script or episode folder>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-audio

Voice first, always. Sound effects are punctuation, not decoration.

## Voice
- Local, free TTS only (Kokoro `am_michael`, speed about 1.1; `kit/py/build_audio.py tts episode.json`, or an episode's `tts_seq.py` that places scene groups sequentially). Setup per `agentoon-video/kit/README.md` (model in `/tmp/kokoro`). No paid TTS without approval.
- Pace 155-170 wpm **while speaking**; measure with `validate-render.sh <mp4> <word_count>` (it reports whole-video pace too). If a line does not fit its slot, **shorten the script; do not speed the voice up.**
- No silence gap over about 1 s (`validate-render.sh` fails it). Use `"pad"` seconds between phrases (0.3-0.6 s) and scene pads of 0.35-0.45 s.
- Pronunciation: spell brand terms for TTS ("Agentoon dot A I", "M I T", "cleanyour dot T V") and keep the on-screen text correct (`show` vs `speak` fields).
- Keep claims verifiable: narration states only what the visuals/docs support; no "free calls", no guaranteed results.

## Music and ducking
`kit/py/build_audio.py mix mix.json` synthesises original music (no third-party samples) by mood: `hook`, `demo`, `result`; set sections in `mix.json` (`music:[{t0,t1,mood}]`). It ducks the bed about 16 dB under the voice and soft-clips safely. Music sits 18-24 dB under the voice; change mood at discovery -> demo -> result.

## SFX (meaningful actions only)
Names: `whoosh` (transition, 0.4 gain), `pop` (chip/card appears, 0.4-0.45), `tick` (click, focus-ring hop, line highlight, 0.4), `sparkle` (success/reveal, 0.3-0.4), `type` with `{dur, cps, gain}` (keyboard, 0.25-0.3). Cue them from words: `build.py` helper `W(phrase, word, offset)` reads `audio/timing.json`. Rules: no more than one SFX per 0.5 s, nothing during a key spoken word except a soft tick on it, whooshes only on real transitions, no glitches/risers.

## Loudness and delivery
Target about -15 LUFS integrated, true peak <= -1 dBTP, no clipping. Mixing normalises (`loudnorm=I=-15:TP=-1.5`), but a HyperFrames render can come out lower: fix **without re-rendering video**: `ffmpeg -i raw.mp4 -af loudnorm=I=-15:TP=-1.5:LRA=9 -c:v copy -c:a aac -b:a 192k -movflags +faststart final.mp4`, then re-run `validate-render.sh`.

## Caption sync
Word timings are estimated (phrase duration x word length). Spot-check three captions against the waveform; if drift exceeds about 0.15 s, adjust word weights or add real alignment (e.g. forced alignment tool) and say so. Write `data/subtitles.srt` and `data/transcript.txt` from `audio/timing.json`.

## Do not
Use stock music/SFX without a licence note, duck so deeply that music pumps, layer SFX on every animation, or let sound cover the hook line.

## `mix.json` example (what `build.py` writes for `build_audio.py mix`)
```json
{ "total": 80.0,
  "music": [ {"t0": 0, "t1": 5.3, "mood": "hook"}, {"t0": 5.3, "t1": 64.2, "mood": "demo"}, {"t0": 64.2, "t1": 80.0, "mood": "result"} ],
  "sfx": [ {"name": "whoosh", "t": 5.24, "gain": 0.4}, {"name": "pop", "t": 2.1, "gain": 0.45},
           {"name": "type", "t": 40.8, "dur": 1.4, "cps": 22, "gain": 0.28}, {"name": "tick", "t": 31.5, "gain": 0.4} ] }
```
Run: `python3 kit/py/build_audio.py mix mix.json` (writes `audio/mix.wav`, 48 kHz stereo; the composition plays it as a single `<audio>` track).

## Click and keyboard sounds
Mouse click: `tick` at the exact frame of the real click/ring hop. Keyboard: `type` with `cps` equal to the on-screen typing speed (about 14-24 characters per second) for the exact typing window. Keep gains 0.25-0.4 so they sit under the voice.

## Pre-delivery audio checks
`bash .claude/skills/agentoon-video-producer/scripts/validate-render.sh <mp4> <words>`; confirm: integrated -17..-13 LUFS (target -15), true peak <= -1 dBTP, no silence >= 1 s, voice never masked by SFX (listen to the first 8 s and the CTA). Record numbers in `data/QC-REPORT.md`.
