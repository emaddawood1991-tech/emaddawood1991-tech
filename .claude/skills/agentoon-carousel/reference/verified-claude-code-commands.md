# Verified Claude Code facts (checked 2026-10-17 against code.claude.com/docs)

Re-fetch before reusing: docs change quickly. Sources: `/docs/en/commands`, `/docs/en/skills`, `/docs/en/code-review-local`, `/docs/en/scheduled-tasks`.

## Taxonomy — always label which kind a command is

| Kind | What it is | Examples |
|---|---|---|
| Built-in command | Fixed logic coded into the CLI | `/init`, `/compact`, `/security-review`, `/skills` |
| Bundled skill | Prompt-based; ships with Claude Code; marked **Skill** in the commands reference; available in every session (a few need a feature) | `/simplify`, `/code-review` (alias `/review`), `/batch`, `/loop`, `/debug`, `/verify`, `/run`, `/claude-api` |
| Custom skill | You write `.claude/skills/<name>/SKILL.md` (project) or `~/.claude/skills/<name>/SKILL.md` (personal). Old `.claude/commands/*.md` files still work and are merged into skills | `/fix-issue` |
| Plugin skill | Comes from an installed plugin; namespaced `/plugin-name:skill-name` | `/my-plugin:review` |
| MCP prompt | Exposed by an MCP server as `/mcp__server__prompt` | `/mcp__github__list_prs` |

## The five bundled skills (all need no installation)

- **/simplify [target]** — reviews changed code for cleanup and applies fixes. Four review agents run in parallel: reuse of existing helpers, simplification, efficiency, right level of abstraction. Does not look for correctness bugs.
- **/code-review [low|medium|high|xhigh|max|ultra] [--fix] [--comment] [--max-findings n|all|default] [pr#|branch|path]** — correctness-bug review of your branch (commits ahead of upstream + uncommitted changes), a PR, branch, path or commit range. Runs as a background subagent. `--fix` asks Claude to apply findings (edits go through permission mode). `--comment` posts inline on a GitHub PR or one note on a GitLab MR (GitLab needs `glab`, v2.1.257+). `low` = most-confident findings only; `medium`–`max` broaden coverage. With no level typed it reuses the last `low`–`max` level you typed (v2.1.223+). `ultra` = cloud ultrareview: needs a claude.ai account, unavailable on Bedrock/Vertex/Foundry, ZDR, HIPAA, CMEK (falls back to a local review). `/review` is an alias.
- **/batch <instruction>** — researches the codebase, splits work into 5–30 independent units, shows a plan; after approval spawns one background subagent per unit in an isolated worktree; each implements, runs tests, publishes its change. Needs a git repo or a `WorktreeCreate` hook (outside git: v2.1.281+). Official example: `/batch migrate src/ from JavaScript to TypeScript`.
- **/loop [interval] [prompt]** — runs a prompt repeatedly while the session stays open. Official examples: `/loop 5m check the deploy`, `/loop check the deploy` (Claude picks 1 min–1 h each time), bare `/loop` (maintenance prompt or `loop.md`). Units s/m/h/d. Session-scoped; fires only while Claude Code is running and idle. Recurring tasks expire after 7 days. `Esc` stops a self-paced loop. A fixed loop does NOT end by itself after N runs.
- **/debug [description]** — enables debug logging for the current session and troubleshoots by reading the session debug log. Logging is off by default unless started with `claude --debug`, so `/debug` mid-session captures from that point forward.

## Claims to avoid

"No install" (say "ships with Claude Code"), "official example" for wording you invented, implying `/loop` stops when work is done, implying `ultra` is just another local effort level, calling every slash command a "skill".
