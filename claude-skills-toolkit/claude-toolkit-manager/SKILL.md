---
name: claude-toolkit-manager
description: Coordinate and safely install a five-tool Claude Code workflow consisting of Find Skills, Superpowers, Claude Mem, Impeccable, and Task Observer. Use when the user asks to install, configure, verify, update, explain, or troubleshoot these tools; wants Claude to plan and check work; needs cross-session project memory; wants stronger frontend design guidance; or wants workflow observations converted into proposed skill improvements.
---

# Claude Toolkit Manager

Coordinate five tools without treating them as interchangeable packages.

## Core workflow

1. Identify whether the user wants installation, configuration, verification,
   troubleshooting, or help using the tools.
2. Read [references/tool-catalog.md](references/tool-catalog.md) before installing
   or updating anything.
3. Inspect the environment and confirm that Node.js 20 or newer and Claude Code
   are available.
4. Explain what will be installed and obtain confirmation before downloading
   software, enabling hooks, or starting persistent services.
5. Use only the official source and installation method for each tool.
6. Verify every requested installation before reporting success.
7. Recommend restarting Claude Code after installation.

## Route tasks

- Use **Find Skills** to discover relevant skills, then verify their source and
  reputation before recommending installation.
- Use **Superpowers** for brainstorming, planning, implementation discipline,
  testing, review, and completion workflows.
- Use **Claude Mem** for cross-session project context after confirming its local
  service and privacy settings.
- Use **Impeccable** for frontend shaping, UI critique, accessibility,
  responsive behavior, visual polish, and design-system work.
- Use **Task Observer** during substantive multi-step work to capture workflow
  lessons and propose skill improvements for human review.

## Safety rules

- Never request or expose passwords, API keys, access tokens, or credentials.
- Never place credentials, patient information, employee records, or
  confidential client data in memory or observation logs.
- Treat Claude Mem as a plugin plus local service, not as a single Markdown
  skill.
- Treat Superpowers as a Claude Code plugin.
- Use Impeccable's official installer so its design hook is configured
  correctly.
- Do not let Task Observer silently modify other skills. Present proposed
  changes and obtain human approval.
- Do not claim installation succeeded until the relevant skill, plugin,
  service, or command is visible and working.

## Skill-upload limitation

When running inside a hosted Claude interface, this uploaded skill supplies the
workflow and instructions but cannot itself install software on the user's
computer. Provide the official commands from the catalog or perform them only
when an authorized local tool is available.

