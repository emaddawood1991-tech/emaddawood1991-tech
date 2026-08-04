# Claude Code project guidance

- At the start of every substantive multi-step task, invoke `task-observer` and
  record useful workflow observations. Never modify skills automatically;
  present proposed changes for human review.
- Use `find-skills` when a requested capability may already exist as a trusted,
  installable skill. Verify the source before recommending or installing it.
- Use `impeccable` for frontend design, UI critique, accessibility, responsive
  quality, and visual polish. Run `/impeccable init` once per frontend project.
- Use the Superpowers workflow for planning, implementation discipline, testing,
  review, and completion when its Claude Code plugin is installed.
- Use Claude Mem only when installed and configured. Never place credentials,
  patient data, employee records, or other confidential information in memory
  or observation logs.

