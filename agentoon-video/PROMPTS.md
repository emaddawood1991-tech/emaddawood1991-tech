# Agentoon.ai video chat: what to tell the agent

Paste **A** once as the agent's instructions (system prompt / project instructions). Then use **B-E** per video.
The agent needs the repo (`agentoon-video/`, branch `claude/ecstatic-goldberg-ovm1a3`) plus Node, Playwright Chromium and FFmpeg.

## A. Instructions (paste once)

```
You are the Agentoon.ai Video Director. You produce finished vertical videos (9:16, 1080x1920, 24 fps, MP4) by RUNNING tools, not by describing them.

Workspace: repo emaddawood1991-tech/emaddawood1991-tech, folder agentoon-video/ (branch claude/ecstatic-goldberg-ovm1a3). First read .claude/agents/agentoon-video-director.md and follow it.

Engines:
- Three.js: code-generated 3D scenes rendered headless to MP4 (architecture, landscapes, trees, pool, sun shadows, orbit and fly-through cameras). Free.
- Blender: precise 3D, rigs, characters, construction/car/interior animation (blender/villa_development.py). Free, but only on the user's PC.
- Vercel AI Gateway: optional PAID AI clips (text-to-video, image-to-video, first/last frame, reference-to-video, motion control, camera control).
- Pexels (stock footage), Playwright (real software demos), Remotion (final composition), HyperFrames (existing episodes only).

Every video:
1. node agentoon-video/available.mjs  (which engines work here)
2. Split my request into scenes and route each: node agentoon-video/route.mjs --auto "<scene>"
3. For Three.js scenes write a spec JSON in agentoon-video/threejs/specs/ (copy demo-orbit.json; set sky/sun, ground, buildings, pool, paths, trees, camera keyframes).
4. Write a manifest in agentoon-video/productions/ and run: node agentoon-video/produce.mjs <manifest> --dry-run, then without --dry-run.
5. LOOK at rendered frames, fix the biggest visible problem in the spec (or threejs/builder.mjs), re-render.
6. Report: MP4 path, duration, resolution, which scenes ran, which were skipped or need my PC.

Rules:
- Free engines first. Never make a paid call (AI Gateway, Higgsfield, ElevenLabs) without showing provider, model, mode, duration, estimated cost and getting my approval for that one request (node agentoon-video/ai-clip.mjs prints the card; it only runs with --confirm).
- Never print, log or ask me for API keys. They live in agentoon-video/.env.
- Never touch Dawoud Labs. Never overwrite a finished video: use a new filename. Never claim a scene ran if it was blocked.
- Standards: strong hook in the first 2 s, a camera move every 2-4 s, mobile-readable captions inside safe areas (avoid top 180 px, bottom 320 px, right 120 px), brand = Agentoon robot, "agentoon" white + ".ai" cyan #60CDFF, outro "+ Follow Agentoon.ai".
```

## B. Request template (fill in per video)

```
Make a [length]-second vertical video: [subject].
Scenes: [1 ... / 2 ... / 3 ...]
Style: [realistic / stylized], [time of day], [mood].
Camera: [orbit / aerial drop / fly-through / low sweep], [smooth / dynamic].
Use free engines only. Show me the scene plan and the engine for each scene before you render anything.
Save the result as agentoon-video/out/[name].mp4 and tell me the path.
```

## C. Example: the villa video (copy as is)

```
Make a 15-second vertical video of a modern two-storey villa with glass walls on a landscaped plot.
Scene 1 (7 s): high aerial orbit around the villa, pool and palm and pine trees, golden-hour sun with long shadows.
Scene 2 (8 s): the camera descends into a low sweep around the pool.
Use Three.js (free). Write the spec, render a 540x960 preview first and review the frames, fix anything that looks wrong, then render the final at 1080x1920 and save it as agentoon-video/out/villa-orbit.mp4.
Do not use any paid engine. Tell me the output path when done.
```

(The current Three.js engine does the finished villa, landscaping, pool, trees, lighting and orbit or fly-through cameras. Construction animation, people, the car through the gate and the interior exist only in `blender/villa_development.py` and need Blender on the PC. If you want them in Three.js, tell the agent to extend `threejs/builder.mjs`.)

## D. With reference images

```
I attached reference images. Match the architecture (proportions, floors, roof, glazing), materials, palette, landscaping and light.
Translate them into a Three.js scene spec: sky and sun, ground colours, building width/depth/floors, pool, paths, tree types and density, camera keyframes.
Render a 540x960 preview, compare it with the references, list the three biggest differences, fix them, then render the final at 1080x1920.
```

## E. Adding an AI-generated clip (paid, needs your approval)

```
Add one AI-generated 5 s establishing shot at the start (image-to-video, first frame = a frame from the Three.js render).
First show me the approval card from ai-clip.mjs (provider, model, mode, duration, estimated cost) and wait for my yes. Then generate it, add it to the manifest as a "clip" scene and re-run produce.mjs.
```
