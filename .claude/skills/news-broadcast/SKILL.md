---
name: news-broadcast
description: >-
  Agentoon.ai Remotion effect: studio-style broadcast layout around a presenter cutout (the robot or any alpha footage): moving background graphics, animated lower third,
  BREAKING headline banner, sliding information panels and a scrolling ticker. It is a style; the layout labels itself STYLE DEMO and never claims to be live news.
  Type /news-broadcast.
argument-hint: <presenter footage or image sequence> <headline>
allowed-tools: Read Write Edit Bash(npx remotion *) Bash(bash *)
---

# /news-broadcast

Custom Agentoon.ai skill (not built into Claude Code). Code: `agentoon-video/remotion-fx/src/fx/NewsBroadcast.tsx`; demo `D03`.

## Do this when invoked
1. Presenter = transparent PNG sequence (`public/robot-seq/` via `npx remotion render RobotTakeAlpha out/seq --sequence --image-format=png`, then rename to `f0000.png`...). For other footage supply an alpha matte sequence.
2. `<NewsBroadcast presenter={ROBOT_SEQ} headline="..." name="..." role="..." panels={[{k,v}]} ticker="..." />`; headlines must be true statements about the video, never fake news. Keep the STYLE DEMO tag.
3. Register, render with `render-fx.sh`, inspect frames: layout, lower third, banner, panels and ticker must all be visible and moving.
Not for real news content. No "LIVE" label.
