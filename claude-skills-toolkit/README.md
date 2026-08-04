# Claude Skills Toolkit

This toolkit installs five complementary Claude Code enhancements from their
official sources:

The machine-readable configuration is available in
`claude-skills.yaml`.

## Upload directly to Claude

Upload `Claude-Toolkit-Manager-Skill.zip` in **Settings â†’ Capabilities â†’
Skills**. Do not upload `claude-skills.yaml`; that file is a machine-readable
manifest, not a skill. The upload ZIP contains `SKILL.md` at its root with the
required YAML frontmatter.

| Tool | Type | Purpose |
| --- | --- | --- |
| Find Skills | Agent skill | Finds and installs additional skills from the open skills ecosystem. |
| Superpowers | Claude Code plugin | Adds structured planning, testing, review, and completion workflows. |
| Claude Mem | Claude Code plugin and local service | Adds cross-session project memory. |
| Impeccable | Agent skill and optional hook | Adds design direction, UI review commands, and deterministic frontend checks. |
| Task Observer | Agent skill | Records workflow observations and proposes skill improvements for human review. |

## Quick install on Windows

1. Install the latest Claude Code and Node.js 20 or newer.
2. Double-click `install-claude-toolkit.cmd`, or run the PowerShell installer:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-claude-toolkit.ps1
```

3. Review the privacy notice and confirm.
4. Restart Claude Code when the installer finishes.
5. In each frontend project, run `/impeccable init` once.

The installer uses global/user scope so the tools are available across Claude
Code projects. Run it with `-WhatIf` to preview the actions without changing
anything, or `-Yes` to skip its confirmation prompt.

## What is already stored in this repository

The directly reusable skill packages are vendored in `.agents/skills`:

- `find-skills`
- `task-observer`

The repository's `.claude/skills` link exposes the same shared directory to
Claude Code without duplicating the files. Superpowers, Claude Mem, and
Impeccable use their official installers because they include plugin, service,
or hook behavior that a copied prompt folder would not configure correctly.

## Privacy and security

- Agent skills and plugins can influence Claude's behavior and may run commands.
  Review their source and updates before enabling them in sensitive projects.
- Claude Mem stores project observations locally. Use its settings and
  `<private>...</private>` controls for content that must not enter memory.
- Task Observer writes an observation log and recommends changes; it does not
  silently rewrite skills. Review recommendations before applying them.
- Impeccable may install a design-check hook. The official installer explains
  the hook and allows it to be skipped.

## Official sources

- Find Skills: https://github.com/vercel-labs/skills/tree/main/skills/find-skills
- Superpowers: https://github.com/obra/superpowers
- Claude Mem: https://github.com/thedotmack/claude-mem
- Impeccable: https://github.com/pbakaus/impeccable
- Task Observer: https://github.com/rebelytics/one-skill-to-rule-them-all
- Claude Code plugin documentation: https://code.claude.com/docs/en/discover-plugins

Task Observer is created by Eoghan Henn / rebelytics and licensed under CC BY
4.0. Its bundled license and attribution are preserved in the vendored folder.

## Updating

```powershell
npx skills update -g -y
npx impeccable update
claude plugin update superpowers@claude-plugins-official
```

Check the Claude Mem repository for its current update instructions before
upgrading because it includes a local service and database migrations.

