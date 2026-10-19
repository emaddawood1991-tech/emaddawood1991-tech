# Non-rendering verification checklist — permanent skills & production memory

Run automatically: `npm run verify:skills` (add `-- --fresh-session` for the headless-session discovery test). Latest generated results: `docs/v7/PERSISTENCE_CHECKLIST.generated.md`. Nothing here renders video or calls a paid API.

| # | Requirement | How verified | Automatic |
|---|---|---|---|
| 1 | `CLAUDE.md` contains the FMC production rules (identity, skills, architecture, character, anatomy, Arabic, audio, transitions, QC) | 23 required markers checked | `verify:skills` |
| 2 | Producer skill exists and follows the supported format (`.claude/skills/<name>/SKILL.md`, YAML frontmatter `name` + `description`, name = directory, lowercase-hyphen, description ≤ 1024 chars) | frontmatter parsed; copies at repo root and in the FMC folder are byte-identical | `verify:skills` |
| 3 | Installed plugins discoverable | `~/.claude/plugins/installed_plugins.json` entries, install paths and skill files exist; versions match the registry; fresh session lists `hyperframes:*` and `lemo-opuscar:lemo-opuscar` | `verify:skills`, `--fresh-session` |
| 4 | Project-level skills discoverable | fresh headless session lists `fmc-video-producer` from **both** the repo root and the FMC folder (a child-folder skill is NOT visible from the parent, hence the root copy) | `--fresh-session` |
| 5 | Skill/CLAUDE.md/registry references point to real files | every backticked path resolved | `verify:skills` |
| 6 | Existing production components still work | `tsc --noEmit` + 34 tests (audio policy, camera/transitions, Arabic/brand, collage, skills registry) | `verify:skills` (without `--quick`) |
| 7 | Audio policy still enforced | `FMC_AUDIO` flags, `audio:qc` on the repo, guard wrapper refuses `render` | `verify:skills` |
| 8 | Future sessions can locate the instructions | `CLAUDE.md` in the FMC folder (loaded when working there), a root `CLAUDE.md` pointer, project skill in both locations, `.claude/settings.json` for plugin registration | `verify:skills` |
| 9 | Registry honest | machine block validated: statuses from {INSTALLED, CONFIGURED, TESTED, NOT AVAILABLE}; `TESTED` requires stated evidence; listed files exist | `verify:skills` |

## Manual items (cannot be automated)
- A *new container* will not have the user-scope plugins until Claude Code installs them from the project `settings.json` (it asks for trust) or you run the two install commands printed by `verify:skills` when `installed_plugins.json` is missing.
- Whether the model picks `fmc-video-producer` automatically depends on the request matching its description; invoke `/fmc-video-producer <topic>` to force it.
- Human sign-offs (Arabic, pronunciation, medical accuracy, listening) remain outside this checklist.

## Auto-selection test (done once)
Fresh headless session, prompt "Make an FMC video about lower back pain. Do not render anything yet — just start." → first tool call: `Skill: fmc-video-producer`. One sample only; selection is model-dependent.
