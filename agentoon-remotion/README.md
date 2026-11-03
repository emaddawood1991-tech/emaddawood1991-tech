# agentoon-remotion

```
Figma (design)  →  Claude Code + Figma MCP  →  Remotion (render)  →  MP4 1080×1920
```

| Stage | Where | What |
| --- | --- | --- |
| Design | Figma, frames `S01_hook…` at 1080×1920 | Layer naming + `@anim` tags (see skill) |
| Sync | Claude Code + Figma MCP, skill `.claude/skills/figma-to-remotion` | Writes `episodes/<slug>/episode.json` + `public/episodes/<slug>/assets` |
| Render | Remotion (`src/`) | Data-driven composition, 30 fps, crossfade/slide transitions, captions, audio |
| Output | `out/<slug>-1080x1920.mp4` | h264, yuv420p |

## Use
```bash
npm install
npm run dev                      # studio preview (debug:true overlays safe area)
npm run validate -- <slug>       # spec checks: size, assets, safe area, transitions
npm run still -- <slug> --frame=30
npm run render -- <slug>         # → out/<slug>-1080x1920.mp4
```

In Claude Code: *"Use figma-to-remotion on <Figma URL>, slug `episode-02`"*.

`episodes/sample/` is a placeholder that proves the pipeline end to end; replace via Figma sync.
