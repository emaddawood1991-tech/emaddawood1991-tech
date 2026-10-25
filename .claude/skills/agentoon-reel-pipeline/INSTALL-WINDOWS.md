# Setup runbook (run on YOUR Windows machine — not testable from the cloud sandbox)

Reel Studio v3.0.2 is **Windows 64-bit only** (MIT; setup downloads FFmpeg GPL build, Chrome Headless Shell, whisper.cpp + ~1.5 GB model, fonts). Remotion's licence: free for individuals / ≤3-employee companies.

## 1. MCP servers (run in PowerShell, then `claude mcp list`)
```
claude mcp add --transport http elevenlabs https://api.elevenlabs.io/v1/mcp
claude mcp add --transport http magnific https://mcp.magnific.com
claude mcp add playwright npx @playwright/mcp@latest
```
Skip any that `claude mcp list` already shows. Then inside Claude Code run `/mcp` and choose each server → Authenticate (browser OAuth). Playwright needs no login.

## 2. Reel Studio (separate folder, NOT inside the Agentoon project)
```
mkdir C:\Tools\reel-studio; cd C:\Tools\reel-studio
git clone https://github.com/mohamedabdou-ai/reel-studio.git .
claude
```
Then tell Claude: "Follow AGENTS.md to set up this studio." Review `scripts/` and `versions.lock.json` first if you want. Verify: `node scripts/studio.mjs status` → `done`, then `node scripts/studio.mjs doctor`.

## 3. Copy the skill
Place `agentoon-reel-pipeline/` in `.claude/skills/` of your Agentoon.ai project (already here in this repo).
