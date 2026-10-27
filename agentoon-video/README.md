# Agentoon.ai video production

Router and optional AI provider for the `agentoon-video-director` agent (`.claude/agents/agentoon-video-director.md`).
Blender is the primary 3D engine, Remotion the default composer, HyperFrames stays for existing episodes,
Vercel AI Gateway is an optional paid provider. Nothing here is a website or a deployment.

| File | Purpose |
|---|---|
| `route.mjs`, `engines.json` | Free, deterministic scene router |
| `check-tools.mjs` | Read-only readiness check per engine (no network, no paid calls) |
| `verify-gateway.mjs` | Checks `.env` is git-ignored, key is set (hidden) and lists gateway video models |
| `ai-clip.mjs`, `pricing.json` | Approval-gated AI Gateway clip generator (dry run by default) |
| `.env.example` | Variable names only. Copy to `.env` (git-ignored). |
| `tests/route.test.mjs` | Free tests: `node --test tests/route.test.mjs` |

## Windows setup (PowerShell)

```powershell
# 1. Get the files (clone once, or fetch if you already have the repo)
cd $HOME\Documents
if (Test-Path .\emaddawood1991-tech) { cd .\emaddawood1991-tech; git fetch origin claude/ecstatic-goldberg-ovm1a3 } else { git clone https://github.com/emaddawood1991-tech/emaddawood1991-tech.git; cd .\emaddawood1991-tech; git fetch origin claude/ecstatic-goldberg-ovm1a3 }
git status --short      # if this lists changes, commit or stash them before switching
git switch claude/ecstatic-goldberg-ovm1a3

# 2. Readiness check (free, read-only)
cd agentoon-video
node check-tools.mjs
node --test tests/route.test.mjs

# 3. Add your keys locally. Type them in Notepad, never in chat.
Copy-Item .env.example .env
notepad .env            # AI_GATEWAY_API_KEY=...   (and PEXELS_API_KEY=... if you have one)

# 4. Verify the gateway (no generation, key never printed)
node verify-gateway.mjs
```

Use the agent from this repo by starting Claude Code inside `emaddawood1991-tech`. To make it available in every project,
copy it only if you do not already have one (this never overwrites):

```powershell
$dest = "$HOME\.claude\agents\agentoon-video-director.md"
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Force "$HOME\.claude\agents" | Out-Null; Copy-Item "..\.claude\agents\agentoon-video-director.md" $dest }
```

Before the first paid clip: copy the model's per-second price from `verify-gateway.mjs` output into `pricing.json`,
then run `node ai-clip.mjs --model <id> --prompt "..." --duration 5` for the approval card. Add `--confirm` only after you approve.
