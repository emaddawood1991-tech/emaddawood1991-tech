# Claude Code Skills Registry

Audit date: 2026-10-19 · Environment: **Claude Code cloud container** (Linux, CLI 2.1.303, Node 22, ephemeral)
Status keys: INSTALLED · ACTIVE · TESTED · AUTHENTICATION REQUIRED · NOT WORKING · NOT VERIFIED

## Summary

| Skill       | Installed | Active | Tested | Result |
| ----------- | --------- | ------ | ------ | ------ |
| Find Skills | Yes (installed this session) | Yes (listed in session and in a fresh `claude -p` session) | Partly | Installs and loads. Registry search (`skills find`) returns nothing here because the sandbox proxy blocks skills.sh (HTTP 403). Git-based `skills add <repo> --list` works. |
| Claude-Mem  | **No** | No | No | **Held for approval.** Not installed. See "Claude-Mem decision" below. |
| Impeccable  | Yes (already present, v3.8.0 synced from your account; upstream is 4.6.0) | Yes | Yes | Skill loaded, reference files present, bundled detector ran; test landing page passed with 0 findings. Not upgraded (needs approval). |
| Superpowers | Yes (installed this session, v7.0.0) | Yes (fresh session lists all 15 skills and received the SessionStart context) | Yes | A headless TDD task invoked `superpowers:test-driven-development` and `superpowers:verification-before-completion`; red-then-green was shown and 5/5 tests passed. |

## Environment

- **Cloud-hosted** Claude Code container, not Desktop and not local Windows. Nothing here is shared with a local or Desktop install.
- `~/.claude/` in the container is rebuilt per session. Account-synced skills and plugins (`~/.claude/skills/synced`, `~/.claude/plugins/synced`) return each session. Anything installed by hand under `~/.claude` (find-skills, superpowers, `settings.json`) **does not persist**.
- To reinstall in a new cloud session: `bash skills-registry/bootstrap-skills.sh` (idempotent).
- Local Windows / Desktop need their own installs (commands below).

## Existing setup found (not modified)

- Project skill: `.claude/skills/agentoon-carousel` (untouched).
- Project agents: `.claude/agents/*.md` and `.claude/council.md` (untouched).
- Project `CLAUDE.md`: none present (not created, not edited).
- User skill: `session-start-hook`.
- Account-synced skills and plugins: about 130 (includes `impeccable`, `frontend-design`, `persistent-memory`, `ui-ux-pro-max`).
- Existing hooks: container Stop and UserPromptSubmit scripts, plus SessionStart context from account plugins.
- Duplicate-design-skill note: `frontend-design` and `impeccable` are both installed. They overlap. Nothing was removed.
- FMC Medical Video Studio and Agentoon.ai files: untouched. No production project was started and no video created.

## Entries

### 1. Find Skills
- Source: https://github.com/vercel-labs/skills (`skills/find-skills`). Owner verified as `vercel-labs`. Repo HEAD 13e4063, 2026-10-09.
- Skills CLI on npm: `skills@1.7.2`.
- Install used: `npx skills add vercel-labs/skills --skill find-skills -g -a claude-code -y`
- Location: `~/.claude/skills/find-skills/SKILL.md` (user level; does not persist in the cloud container).
- Hooks: none. Permissions: none beyond normal tools.
- Auto-activates when you ask "is there a skill for X" or "how do I do X".
- Manual use: `npx skills find <query>`, `npx skills add <owner/repo> --list`, `npx skills update`.
- Test results:
  - Skill appeared in the live skill list and in a fresh headless session.
  - `npx skills find "frontend design" / "automation" / "coding best practices"` returned "No skills found" for all three. Cause: the sandbox proxy returns 403 for skills.sh. Not verified on a machine with open network access.
  - `npx skills add vercel-labs/agent-skills --list` worked and listed 9 skills over git.

### 2. Claude-Mem
- Source: https://github.com/thedotmack/claude-mem (author Alex Newman, Apache-2.0, v14.0.1, HEAD 3fae1eb on 2026-10-19). Official docs: https://docs.claude-mem.ai
- Official install: `npx claude-mem install`, or `/plugin marketplace add thedotmack/claude-mem` then `/plugin install claude-mem`. `npm install -g claude-mem` installs the SDK only and is **not** the plugin.
- Requirements: Node >=20.12 (OK, v22), Bun >=1.1.31 (auto-installed if missing).
- What it does (from the repo's `plugin/hooks/hooks.json`):
  - Hooks on Setup, SessionStart, UserPromptSubmit, **PostToolUse with matcher `*`**, PostToolUseFailure, PreToolUse (Read/Bash/Grep/Glob), Stop and SessionEnd.
  - Starts a local Bun HTTP worker and stores sessions, observations and summaries in SQLite plus Chroma under `~/.claude-mem/`.
  - Injects past context at session start.
  - README: the installer prompts for a browser sign-in (email magic link) and defaults to the hosted "CMEM Pro" observer (30-day trial). Opt out with an explicit `--provider` flag or `CLAUDE_MEM_ONLINE_OPTIN=false`.
  - Privacy control: `<private>` tags exclude content from storage.
- Why it was not installed:
  1. It records the input and output of every tool call. This session has Gmail, Slack, Drive, Shopify and HubSpot connectors, and you work with FMC clinic material, so a blanket capture could store sensitive content.
  2. It runs a background service and hooks, which your safety rules say need approval.
  3. In this cloud container `~/.claude-mem/` is deleted when the session ends, so memory would not persist anyway.
- Recommended setup (local machine only, after you approve):
  1. `CLAUDE_MEM_ONLINE_OPTIN=false npx claude-mem install` (local-only, no account sign-in).
  2. Choose a provider you control (own Gemini/OpenRouter key or your Anthropic plan).
  3. Review `~/.claude-mem/settings.json` and add exclusions for FMC patient/employee folders before first use.
  4. Restart Claude Code, then verify the worker and a context recall in a new session.
- Status: NOT INSTALLED, NOT VERIFIED. The account-synced `persistent-memory` skill is only instructions for installing claude-mem and does not itself store anything.

### 3. Impeccable
- Source: https://github.com/pbakaus/impeccable (author Paul Bakaus, Apache-2.0). Site: https://impeccable.style
- Installed copy: `~/.claude/skills/synced/<account>/impeccable`, v3.8.0, `source: plugin` in the account manifest. Managed by your account sync, so it returns each session.
- Upstream: v4.6.0 (HEAD 0665bd8, 2026-10-19). Behind by several releases. Installed copy lacks the upstream SKILL.src.md, agents and some reference files. **Not upgraded**, because you asked that existing design skills not be replaced without approval.
- Official install for other machines: `npx impeccable install` (then `/impeccable init`), or `/plugin marketplace add pbakaus/impeccable`. Update: `npx impeccable update`. The installer also writes a project-level edit hook; review it before accepting.
- Commands (from the installed SKILL.md): `craft, shape, init, document, extract, critique, audit, polish, bolder, quieter, distill, harden, onboard, animate, colorize, typeset, layout, delight, overdrive, clarify, adapt, optimize, live` plus `pin, unpin, hooks`. Invoke as `/impeccable <command> [target]`.
- Older `frontend-design` skill: present (account-synced). Not removed.
- Test: `/impeccable craft` on a throwaway fictional product ("Tidewrack"). Single `index.html` in the session scratchpad (not in the repo).
  - First detector run: 7 `overused-font` findings (Fraunces, Instrument Sans). Fonts swapped to Newsreader and Schibsted Grotesk. Second run: 0 findings.
  - Playwright at 1280 and 390 px widths: no horizontal overflow; desktop screenshot reviewed.
  - Caveat: the craft flow's confirmation gates (shape brief, project setup via `init`/PRODUCT.md) were compressed because you asked for a throwaway test. Webfonts could not load in the sandbox, so the screenshot shows fallback fonts. The page is not a production design.

### 4. Superpowers
- Source: https://github.com/obra/superpowers (author Jesse Vincent, MIT). v7.0.0, HEAD bb92a77, 2026-10-09. Listed in Anthropic's official plugin marketplace.
- Install used:
  - `claude plugin marketplace add anthropics/claude-plugins-official` (this wrote `extraKnownMarketplaces` and `enabledPlugins` into a new `~/.claude/settings.json`; no existing settings file was overwritten).
  - `claude plugin install superpowers@claude-plugins-official` (scope: user).
- Hooks reviewed: one `SessionStart` hook (`startup|clear|compact`) that reads `skills/using-superpowers/SKILL.md` and injects it as context. No network calls and no tool-call capture. It adds to, and does not replace, the existing SessionStart context.
- Skills (15): brainstorming, writing-plans, executing-plans, subagent-driven-development, dispatching-parallel-agents, test-driven-development, systematic-debugging, verification-before-completion, requesting-code-review, receiving-code-review, using-git-worktrees, finishing-a-development-branch, writing-skills, using-superpowers, diagnosing-superpowers.
- Auto-activates: injected at session start; skills trigger from task context.
- Manual use: ask for the skill by name, e.g. "use superpowers:brainstorming", or `/superpowers:<skill>` if exposed as a command.
- Tests:
  - Fresh `claude -p` session listed all 15 skills and confirmed the SessionStart block was present.
  - Throwaway task (slugify with node:test, in scratchpad): invoked `superpowers:test-driven-development` and `superpowers:verification-before-completion`; test failed first (module not found), then 5/5 passed with exit 0.
  - Not individually tested: brainstorming, writing-plans, systematic-debugging, subagent workflows. NOT VERIFIED.
- Possible conflicts: overlaps with the project's `.claude/council.md` and agents only in role, not mechanically. Its injected "EXTREMELY_IMPORTANT" block competes with other plugins' injected context; no functional clash seen in the test session.

## Persistence and scope

| Item | Persists across sessions | Available in other projects |
| ---- | ------------------------ | --------------------------- |
| Impeccable (account-synced) | Yes, restored from your account | Yes, in cloud sessions on your account |
| Find Skills (`~/.claude/skills`) | No (container reset) | Only within the same container lifetime |
| Superpowers (user-scope plugin) | No (container reset) | Only within the same container lifetime |
| Claude-Mem | Not installed | n/a |

Making Find Skills and Superpowers persistent in cloud sessions needs one of: (a) run `skills-registry/bootstrap-skills.sh` at session start, (b) add a SessionStart hook that runs it (not enabled; needs your approval), (c) commit them as project-level skills under `.claude/` (not done; touches the project). On a local machine the installs persist normally.

## Commands for local Windows / Desktop

```powershell
npx skills add vercel-labs/skills --skill find-skills -g -a claude-code -y
claude plugin install superpowers@claude-plugins-official   # inside Claude Code: /plugin install superpowers@claude-plugins-official
npx impeccable install        # then /impeccable init
$env:CLAUDE_MEM_ONLINE_OPTIN="false"; npx claude-mem install   # only after approval and exclusions are set
```
