# Agentic Memory Format

Memory is portable context, not executable policy. Store project-local records under
`.agentic/memory/` with this structure:

```md
---
format: agentic-memory-v1
status: proposed
scope: project
created: 2026-09-09
sourceTicket: T-001
tags: [example]
trust: unreviewed
---

# Short title

## Evidence
- Ticket, source path, or documentation reference.

## Reuse guidance
- Concise reusable fact or decision.

## Verification needed
- What must be checked before relying on this note.
```

Only human-approved decisions belong in canonical project documentation or `LESSONS.md`.
