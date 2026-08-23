# Task Observer activation instruction

Add the following paragraph to the `CLAUDE.md` file in projects where you want
Task Observer to run reliably:

> At the start of every multi-step task or substantive tool-using session,
> invoke the `task-observer` skill. Record useful workflow observations in the
> configured observation log, but never modify skills automatically. Present
> proposed skill changes for human review and approval.

Keep observation logs out of repositories that may contain confidential client,
employee, patient, or medical information unless the storage location and
retention rules have been explicitly approved.

