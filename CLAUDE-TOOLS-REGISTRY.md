# Claude Code Tools Registry

Separate from project docs / CLAUDE.md. Audited 2026-10-19 in a **cloud** container
(Ubuntu 24.04, Claude Code 2.1.303, Node 22.22, npm 10.9, Python 3.13, uv 0.11, Go present, git 2.43).
Rebuild in a fresh container: `bash scripts/claude-tools-setup.sh` (idempotent).

## Registry

| Tool | Official repo | Type | Version (pinned) | Scope / config | Auth | Test result |
|---|---|---|---|---|---|---|
| Playwright MCP | microsoft/playwright-mcp | MCP (stdio, npx) | @playwright/mcp 0.0.83 | user, `~/.claude.json` | none | PASS: navigate, snapshot, click, console (local page) |
| Chrome DevTools MCP | ChromeDevTools/chrome-devtools-mcp | MCP (stdio, npx) | chrome-devtools-mcp 1.11.0 | user, `~/.claude.json` | none | PASS: navigate, console, network (local page) |
| Context7 | upstash/context7 | MCP (stdio, npx) | @upstash/context7-mcp 4.4.2 | user, `~/.claude.json` | optional API key (higher limits) | INSTALLED, NOT FUNCTIONAL HERE: starts, lists tools, `fetch failed` (proxy 403 for context7.com) |
| Memory MCP | modelcontextprotocol/servers (src/memory) | MCP (stdio, npx) | @modelcontextprotocol/server-memory 2026.8.31 | user; data `~/.claude/memory/memory.jsonl` | none | PASS: create, retrieve from new process, delete |
| Playwright CLI | microsoft/playwright-cli | CLI (global npm) | @playwright/cli 0.1.22 | `/opt/node22/lib` | none | PASS: open, snapshot, click, close |
| Glyph | github.com/benmyles/glyph (claimed by a synced skill) | MCP via `go install` | not installed | n/a | none | **UNVERIFIED, not installed** |

For the five verified tools, the npm maintainers and `repository` field match the official GitHub org/repo.
Glyph: repo and Go module exist (README matches), but it is a personal account, publisher identity could not be
confirmed (GitHub API blocked in sandbox). Install only after you approve:
`go install github.com/benmyles/glyph@latest` then `claude mcp add --scope user glyph "$(go env GOPATH)/bin/glyph" mcp`.

## Browser setup (cloud)
No browser download. Chromium 141 at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` is passed explicitly
(`--executable-path` / `--executablePath`), headless, `--no-sandbox` (root container). Playwright CLI reads
`PLAYWRIGHT_MCP_EXECUTABLE_PATH`, `PLAYWRIGHT_MCP_HEADLESS=true`, `PLAYWRIGHT_MCP_NO_SANDBOX=true`, `PLAYWRIGHT_MCP_BROWSER=chromium`.

## When to use which
- **Playwright MCP**: multi-step browser tasks, forms, login flows, structured accessibility snapshots.
- **Playwright CLI**: same engine via shell commands; lower context cost for long scripted runs. Prefer for batch work.
- **Chrome DevTools MCP**: debugging: console, network, performance traces, Lighthouse, heap snapshots.
- **Context7**: current library docs. MCP chosen over `ctx7` CLI + skills: simplest, only 2 tools (small context footprint).
- **Memory MCP**: persistent knowledge graph across sessions.
- Gotcha: DevTools tools need `pageId` (from `list_pages`) and `take_snapshot` before `click`.

## Persistence (cloud)
- `~/.claude.json`, `~/.claude/memory` and global npm installs live in the **ephemeral container** and are lost on reclaim.
- Reusable: this repo (script + registry) persists via git. Run the script at session start (or from a SessionStart hook).
- Memory data is NOT persisted by git. For durable memory, commit/copy `memory.jsonl` or point `MEMORY_FILE_PATH` at synced storage.
- Local Windows: same `claude mcp add --scope user` lines with `cmd /c npx ...`; drop `--executable-path` and `--no-sandbox` and let Playwright manage its own browser.

## Known issues
- Sandbox proxy blocks many hosts (context7.com, example.com, GitHub API). Browser HTTPS to allowed hosts fails with
  `ERR_CERT_AUTHORITY_INVALID` (proxy CA). TLS verification was deliberately NOT disabled; tests used a local page.
- `@modelcontextprotocol/server-memory`: npm `latest` (2.0.0) needs Node >=24; pinned the 2026.8.31 line, which runs on Node 22 (self-reports serverInfo 0.6.3).
- MCP tools load at session start: start a new session to get `mcp__playwright__*` etc. in context.
- Pre-existing: ~100 plugin MCP servers fail with proxy 403; unrelated and untouched.

## Update procedure
Bump pinned versions in `scripts/claude-tools-setup.sh` (check `npm view <pkg> version`), then
`claude mcp remove <name> -s user` and re-run the script. Config backups: `~/.claude/backups/`.
