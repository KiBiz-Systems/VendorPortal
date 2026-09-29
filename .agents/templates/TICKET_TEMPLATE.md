<!-- Copy this file to ai-workspace/tickets/T-NNN-slug.md and fill it in.
     For a filled-in ticket showing the intended depth of each section, see
     .agents/templates/EXAMPLE_TICKET.md — read it once, do not copy it. -->

# T-NNN: [Title]

**Status:** TODO
**Scope:** [scope type]
**Type:** [module-addition | feature-addition | enhancement | bug-fix | refactor | migration | chore | security-fix]
**Date:** YYYY-MM-DD
**Current subtask:** — <!-- while a wave is out: `3 — dispatched (agent a7f3c2), unverified` -->
**Files:** `path/a`, `path/b`
**Parent:** [T-NNN — delete this line entirely unless this ticket is a module component]
**Depends on:** [T-NNN — delete this line entirely unless a sibling component must land first]

<!-- RESUME HEADER ENDS HERE. Everything needed to pick this ticket back up is above.
     Read Part A to review the work. Read Part B only when implementing or digging in. -->

---

# Part A — Summary

> **Audience: technical lead / manager.** Must make sense without opening the code.
> No file paths, no function names, no line numbers, no jargon — say "one extra database
> query per row", not "N+1". Short bullets, not paragraphs.
>
> **Hard limit: 25 lines for all of Part A.** Every claim here is evidenced in Part B.
> State it once here in plain language; Part B does not repeat it.
>
> **Write Part B first, then compress it into Part A.** A summary written before the
> discovery is a guess.

## A1. What is wrong

- [One user- or business-visible symptom per bullet — what someone actually notices.]

## A2. What changes

- [The after-state, verifiable. "Loading a page makes 2 database calls instead of 9."]

## A3. How — in short

1. [One line per step. Named by what it achieves, not how it is coded.]

## A4. Impact & risk

- **Touches:** [screens / endpoints / areas, in words]
- **Could break:** [what to watch — or "nothing user-visible"]
- **Not included:** [deferred item + why, one line — or "nothing"]
- **Needs a human:** [SQL to run, approval, env var — or "nothing"]

---

# Part B — Technical Detail

> Audience: the implementing agent, and any developer digging deeper. Assumes Part A has
> been read — **do not restate it.** File paths, `file:line` evidence, and mechanisms live
> here and only here.

## B1. Root cause

[The mechanism, with `file:line` evidence. Why it happens, not that it happens.]

## B2. Non-goals

- [Explicitly out of scope — this list is copied into every subagent brief]

## B3. Discovery

- **Impacted components:**
- **Related files:**
- **Upstream / downstream dependencies:**
- **Architectural constraints:**

> Condensed findings only. Never paste raw graph or search output here — it is re-read on
> every later access and informs nothing.

**If `Parent:` is set above**, Discovery points at the parent's Architecture Decisions (M3) /
Cross-Component Contracts (M4) instead of re-deriving them. Complete this before B4:

**Deviation Check** (module components only — delete this block if `Parent:` is unset)
- [ ] Files touched fall within this component's `Files / area` cell in the parent's Component Manifest (M5)
- [ ] No new cross-component contract beyond what the parent's M4 already defines
- [ ] No subtask in this ticket's B5 exceeds the Manifest's tier bias for this component

Any box unchecked → stop here, do not proceed to this ticket's B4/B5. Log it in the parent's Deviation
Log (M9), get that re-approved, then resume this ticket.

## B4. Plan

> Paste the plan-mode output here **verbatim**. This section replaces any separate plan file.

[The approach, referencing the specific files and functions found during discovery. Each
step maps to a line in A3 — the technical detail of that step, not a second summary of it.]

## B5. Subtasks

> **Partition by file** — one agent owns one file. Where several subtasks hit the same file,
> give them all to that file's single agent; parallel agents sharing a file overwrite each
> other silently. Foundation rows (new shared modules others import) run to completion
> before consumer rows fan out.

> The **Agent** column is the literal `subagent_type` this row is dispatched to. Only
> `impl-small` or `impl-mid` are valid. Approving this table approves the model spend.

| # | Subtask | File(s) | Agent | Done |
|---|---------|---------|-------|------|
| 1 | [One change, one concern] | `path/a` | `impl-small` | [ ] |
| 2 | [One change, one concern] | `path/b` | `impl-mid` | [ ] |

**Done states:** `[ ]` not started · `[~]` dispatched, not yet verified · `[x]` gate
green, diff read, committed. Set `[~]` and the header's `Current subtask:` line — with
the agent ID — *before* dispatching. That ID is what recovers an interrupted subtask;
lose it and the work has to be redone.

**Tiers:** `impl-small` (Haiku) = mechanical single-site edit · `impl-mid` (Sonnet) =
judgment, contracts, correctness reasoning · the orchestrator never implements, only
dispatches and verifies. Model is set by `.claude/agents/<name>.md`, never by the dispatch
prompt — never pass a `model` override.

*Tiering test: if the subtask can be stated as "in file X at line N, change A to B," it is
`impl-small`. If stating it requires explaining why, it is `impl-mid`.*

*Default to `impl-small` and promote only when the test forces it. If every row here says
`impl-mid`, the work was not tiered — split the mechanical parts into their own rows.*

## B6. Verification

> Authored at plan time. **Not run unless the developer explicitly asks.**
> Lowest layer that can prove the behavior. Browser/E2E needs explicit approval.
> Confirm the harness exists before writing cases against it.
> Every A2 outcome needs at least one row here that proves it.

| # | Tool | Case | Expected | Result |
|---|------|------|----------|--------|
| 1 | [tool] | [exact condition checked] | [exact expectation] | NOT RUN |

**Sanity gate** (runs during implementation, no approval needed):

- [ ] `TYPECHECK_CMD` clean in affected package(s)
- [ ] `LINT_CMD` clean on touched files
- [ ] Every diff read by the orchestrator against its subtask's acceptance condition
- [ ] Each verified subtask committed as `T-NNN.S — <what it achieved>` (not pushed)

## B7. Decisions & Blockers

[Only what a future reader needs: a decision made, a constraint discovered, a blocker hit.
No execution log. No narration of work already reflected in the checkboxes above.]
