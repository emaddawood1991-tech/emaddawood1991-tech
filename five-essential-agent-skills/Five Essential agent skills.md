---
name: five-essential-agent-skills
description: Coordinate and safely install a five-tool Claude Code workflow consisting of Find Skills, Superpowers, Claude Mem, Impeccable, and Task Observer. Use when the user asks to install, configure, verify, update, explain, or troubleshoot these tools; wants stronger planning and review; needs cross-session project memory; wants professional frontend design guidance; or wants workflow observations converted into proposed skill improvements.
---

# Five Essential agent skills

Coordinate the five tools without treating them as interchangeable packages.

## Workflow

1. Identify whether the user wants installation, configuration, verification,
   troubleshooting, or help using the tools.
2. Confirm that Node.js 20 or newer and Claude Code are available.
3. Explain what will be installed and obtain confirmation before downloading
   software, enabling hooks, or starting persistent services.
4. Use only the official source and installation method for each tool.
5. Verify every installation before reporting success.
6. Recommend restarting Claude Code after installation.

## Find Skills

Use Find Skills to discover relevant agent skills. Verify the source and
reputation before recommending installation.

Source: https://github.com/vercel-labs/skills/tree/main/skills/find-skills

```powershell
npx -y skills add vercel-labs/skills --skill find-skills --agent claude-code --global --yes --copy
```

## Superpowers

Use Superpowers for brainstorming, planning, implementation discipline,
testing, review, and completion workflows.

Source: https://github.com/obra/superpowers

```powershell
claude plugin install superpowers@claude-plugins-official --scope user
```

## Claude Mem

Use Claude Mem for cross-session project context after confirming its local
service and privacy settings.

Source: https://github.com/thedotmack/claude-mem

```powershell
npx -y claude-mem install
```

Do not substitute `npm install -g claude-mem`; that does not configure the
Claude Code plugin hooks and worker.

## Impeccable

Use Impeccable for frontend shaping, UI critique, accessibility, responsive
behavior, visual polish, and design-system work.

Source: https://github.com/pbakaus/impeccable

```powershell
npx -y impeccable install --providers=claude --scope=global
```

Run `/impeccable init` once in each frontend project.

## Task Observer

Use Task Observer during substantive multi-step work to capture workflow
lessons and propose skill improvements for human review.

Source: https://github.com/rebelytics/one-skill-to-rule-them-all

```powershell
npx -y skills add rebelytics/one-skill-to-rule-them-all --skill task-observer --agent claude-code --global --yes --copy
```

Task Observer is created by Eoghan Henn / rebelytics and licensed under CC BY
4.0. It must not silently rewrite other skills.

## Safety

- Never request or expose passwords, API keys, access tokens, or credentials.
- Never place credentials, patient information, employee records, or
  confidential client data in memory or observation logs.
- Obtain confirmation before enabling persistent services or hooks.
- Do not claim success until the relevant skill, plugin, service, or command is
  visible and working.
- In a hosted Claude interface, provide these workflows and commands without
  claiming to have installed software on the user's computer.

