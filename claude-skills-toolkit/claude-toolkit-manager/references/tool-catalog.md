# Official tool catalog

## Find Skills

- Purpose: discover and install skills from the open agent-skills ecosystem.
- Source: https://github.com/vercel-labs/skills/tree/main/skills/find-skills
- Install:

```powershell
npx -y skills add vercel-labs/skills --skill find-skills --agent claude-code --global --yes --copy
```

## Superpowers

- Purpose: structured planning, testing, review, and completion workflows.
- Source: https://github.com/obra/superpowers
- Install:

```powershell
claude plugin install superpowers@claude-plugins-official --scope user
```

## Claude Mem

- Purpose: local, cross-session project memory.
- Source: https://github.com/thedotmack/claude-mem
- Requirement: Node.js 20 or newer.
- Install:

```powershell
npx -y claude-mem install
```

Do not substitute `npm install -g claude-mem`; that installs the SDK without
configuring the Claude Code plugin hooks and worker.

## Impeccable

- Purpose: frontend design guidance, commands, and deterministic design checks.
- Source: https://github.com/pbakaus/impeccable
- Install:

```powershell
npx -y impeccable install --providers=claude --scope=global
```

- Initialize each frontend project with `/impeccable init`.

## Task Observer

- Purpose: capture workflow observations and propose reusable skill changes.
- Source: https://github.com/rebelytics/one-skill-to-rule-them-all
- Creator: Eoghan Henn / rebelytics.
- License: CC BY 4.0.
- Install:

```powershell
npx -y skills add rebelytics/one-skill-to-rule-them-all --skill task-observer --agent claude-code --global --yes --copy
```

Task Observer recommends improvements; it must not silently rewrite skills.

## Verification

1. Restart Claude Code.
2. Confirm Find Skills and Task Observer appear in the skill list.
3. Confirm Superpowers appears in the plugin list.
4. Confirm Claude Mem reports its local service as running.
5. Run `/impeccable init` in a frontend project.
6. Confirm the Task Observer log location and privacy exclusions.

