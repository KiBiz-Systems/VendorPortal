---
trigger: manual
description: Behavioral checklist to reduce common LLM coding mistakes. Load before a large or ambiguous change.
---

# Behavioral Guidelines

> **`CLAUDE.md` is authoritative.** This file is a behavioral checklist, not a process spec.
> Where it appears to bear on process — when tests run, what artifacts exist, how work is
> delegated — `CLAUDE.md` wins.

Guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria before you start.**

Every subtask needs an **acceptance condition** — a statement specific enough that reading
the diff proves or disproves it. Vague criteria ("make it work") force clarification
mid-execution; sharp ones let the orchestrator verify without asking.

Transform tasks into verifiable conditions:
- "Add validation" → "the handler rejects a request missing a required field with the project's standard error shape"
- "Fix the bug" → "the exact input that reproduced it now yields <specific value>"
- "Refactor X" → "behavior is unchanged; the call sites listed in the ticket still typecheck"

Write the corresponding **test case** into the ticket's Verification table at plan time, and
leave it `NOT RUN`. **Do not write or run test files unless the developer asks** — see
`CLAUDE.md` §7. The sanity gate (§6) plus a read diff is what verifies work in the meantime.

For multi-step work, the ticket's subtask table already carries this: one row per change, one
acceptance condition each.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.