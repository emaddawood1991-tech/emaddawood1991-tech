# Remotion project: Git timeline clips (Ep 08)
`src/Timeline.tsx` draws the commit history (perspective tilt, HEAD marker glide, thumbnails of real site screenshots). `src/props.json` holds the real commit hashes/messages (from `data/s8.txt`) and times derived from `audio/timing.json`.
Render (scratch copy, Chrome download is blocked in this sandbox):
```
npm install
npx remotion render src/index.ts GitTimelineA out/timeline-a.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --codec=h264
npx remotion render src/index.ts GitTimelineB out/timeline-b.mp4 --browser-executable=... --codec=h264
```
The two MP4s are placed in the HyperFrames composition (`../assets/timeline-a.mp4`, `timeline-b.mp4`). Remotion 4.0.505, React 19.2.3.
