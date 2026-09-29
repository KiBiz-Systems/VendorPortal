---
description: Full workflow reference. The condensed, binding version is CLAUDE.md — load this only when auditing or extending the workflow itself.
---

# Agent Development Workflow — Full Reference

> **`CLAUDE.md` is authoritative.** This file adds rationale, sequencing detail, and worked
> examples. It does not introduce rules that `CLAUDE.md` lacks. If they disagree, `CLAUDE.md`
> wins and this file is the bug.

Design goal: **minimum token consumption with full context.**

---

## The pipeline

```
Prompt
  ↓ 1. Scope + Type Classification   (Type ∈ module-addition | feature-addition | enhancement
                                       | bug-fix | refactor | migration | chore | security-fix)
  ↓ 2. Graph Discovery
  ↓ 3. Ticket authoring
       module-addition  ──▶  Parent ticket (MODULE_TICKET_TEMPLATE) decomposes into
                              child tickets T-NNN.1, T-NNN.2, … (normal TICKET_TEMPLATE)
       other Types      ──▶  single ticket (normal TICKET_TEMPLATE)
  ↓ 4. Developer Approval
       module-addition  ──▶  approve the parent's Component Manifest once; covers every
                              child's plan and delegation split in the same pass
       other Types      ──▶  approve this ticket; nothing dispatches before it
  ↓ 5. Subagent Execution — one wave at a time, partitioned by file (per ticket; for a
       module, per child, unless a Deviation Check re-opens that child's approval)
  ↓ 6. Sanity Gate — typecheck, lint, diff read, commit (every subtask, automatic)
  ↓ 7. Orchestrator Verification
  ↓ 8. Graph Update (once per ticket)
  ↓ 9. AWAITING_TEST  (per ticket; for a module, per child)
  ↓ 10. [ Testing — only on explicit request. Loop to green, max 3 cycles ]
       module-addition  ──▶  parent's Module-Level Acceptance runs only once every child is
                              AWAITING_TEST or COMPLETED
  ↓ 11. COMPLETED
```

---

## Step 1 — Scope and Type classification

Classify before loading anything, on two dimensions. **Scope** (unchanged) decides which docs
load and which rules apply. **Type** — one of `module-addition`, `feature-addition`,
`enhancement`, `bug-fix`, `refactor`, `migration`, `chore`, `security-fix` — decides discovery
depth, ticket rigor, default tier, and which skill runs. Getting either wrong costs context
immediately.

Resist widening the Scope. `fullstack` means the task genuinely spans the UI *and* the
contract it depends on — not that you are unsure.

---

## Step 2 — Graph discovery

Mandatory, and it happens **before** the plan is written. Setup and tool reference:
`.agents/rules/graphify.md`.

Discovery must identify: impacted files, related modules, dependencies, request/response
flow, architectural constraints, and existing patterns to follow.

**Condense before recording.** The ticket gets the findings that affect the plan — not raw
tool output. Raw graph dumps in a ticket are re-read on every subsequent access and inform
nothing.

---

## Step 3 — Ticket authoring

Which template depends on Type.

**Every Type except `module-addition`:** one ticket, `ai-workspace/tickets/T-NNN-slug.md`
from `.agents/templates/TICKET_TEMPLATE.md`.

**`module-addition` is two-level:**
- **Parent** — `ai-workspace/tickets/T-NNN-slug.md` from
  `.agents/templates/MODULE_TICKET_TEMPLATE.md`. It reads the source PRD **once**, at
  decomposition, and distills it into: Architecture Decisions, Cross-Component Contracts, a
  Component Manifest table (one row per component — file scope, tier bias, dependencies),
  Sequencing, Module-Level Acceptance, and a Deviation Log. Nothing downstream re-opens the
  source PRD; the parent ticket is the distillation.
- **Children** — `ai-workspace/tickets/T-NNN.1-slug.md`, `T-NNN.2-slug.md`, … one per
  component, each from the normal `TICKET_TEMPLATE.md` and running the full pipeline
  (Steps 3–11) unmodified. A child does not restate the parent's architecture — it links back.

Both templates carry the same header fields plus two new ones: **`Type:`** (set on every
ticket) and, on children only, **`Parent:`** (the parent ticket ID) and **`Depends on:`**
(sibling child IDs it must sequence after, per the parent's Sequencing section).

The section table below describes the **component (child) ticket** — the normal template is
unchanged by this contract. The parent's own sections are the ones listed above, not this
table.

The ticket has two parts. **Part A** is the plain-language summary a technical lead or
manager reads to approve the work — no file paths, no function names, no jargon, 25 lines
max. **Part B** is the technical detail the implementing agent works from.

| Section | Purpose |
|---------|---------|
| Resume header | Cheap resume — status, scope, current subtask (with agent IDs while a wave is out), target files |
| A1–A4 (Part A) | What is wrong · what changes · how, in short · impact & risk |
| B1 Root cause | The mechanism, with `file:line` evidence |
| B2 Non-goals | Copied into every subagent brief |
| B3 Discovery | Condensed graph findings |
| B4 Plan | The plan-mode artifact, verbatim |
| B5 Subtasks | Table: subtask, file(s), **`subagent_type`** (`impl-small`/`impl-mid`), state (`[ ]` / `[~]` / `[x]`) |
| B6 Verification | Test cases authored now, run later or never |
| B7 Decisions & Blockers | Only what a future reader needs |

**Write Part B first, then compress it into Part A.** Part A states each point once in plain
language; Part B carries the evidence and does not restate it. Objective is not its own
section — the outcome lives in A2 and is proved by a matching row in B6.

Nothing else is created for a task. Genuine deliverables — API docs, SQL scripts, module
`agents.md` — are not process artifacts and are still written.

**Plan mode output is transient.** Paste it into the Plan section verbatim before execution.

---

## Step 4 — Approval

**For every non-module Type, this is unchanged:** the developer approves the plan **and** the
delegation split in one pass, because the agent column is already filled in. Nothing
dispatches before this.

**For `module-addition`, approval happens once, at the parent.** Approving the parent's
Component Manifest approves every child's plan and delegation split in the same pass — a
child does not carry its own separate approval gate. It dispatches on the strength of the
parent approval *unless* its Deviation Check fails: files outside its Manifest row, a new
cross-component contract not in the parent, or a subtask exceeding the child's tier bias. Any
of those re-opens approval for **that child alone**, logged in the parent's Deviation Log —
siblings already in flight are not blocked by it.

---

## Step 5 — Subagentic execution

The orchestrator does not write code. It plans, dispatches, and verifies.

### Tiering

| `subagent_type` | Model | Give it |
|-----------------|-------|---------|
| `impl-small` | Haiku | Mechanical single-site edits — swap a formatter, change one line, align a default, rename a field |
| `impl-mid` | Sonnet | Design judgment, cross-file contracts, correctness and date/time reasoning, new modules, invariants to preserve |
| Orchestrator | the main loop | Planning, dispatching, diff reading, verification. No edits. |

**The tiering test:** if the subtask can be stated as "in file X at line N, change A to B,"
it is `impl-small` work. If stating it requires explaining *why*, it needs `impl-mid`.
Default to `impl-small`; promote only when the test forces it.

**Worked examples.** The pairs below are the same underlying work, tiered differently by
how precisely the ticket states it — tiering is a property of the brief, not of the code.
A subtask that reaches `impl-mid` because it was written vaguely is a planning miss, not a
hard task.

| Subtask as written in the ticket | Tier | Why |
|---|---|---|
| In `invoice-row.tsx:42`, replace `toFixed(0)` with the existing `formatCurrency` helper | `impl-small` | Fully stated as X:N, A → B. Nothing left to decide. |
| Make the invoice amount format consistently across the app | `impl-mid` | "Consistently" is undefined — someone has to choose which format wins, and where. |
| Rename `email_addr` to `email` in `user-model.ts` and the three call sites listed | `impl-small` | Mechanical, and the blast radius is enumerated at dispatch time. |
| Rename `email_addr` to `email` everywhere it appears | `impl-mid` | "Everywhere" folds discovery into the task; the file set is unknown when the brief is written. |
| Add a `dueDate` that defaults to 30 days after `issuedAt` when unset | `impl-mid` | Date arithmetic plus a fallback rule — an invariant to hold and a timezone to get wrong. |

The first row of each pair is what a properly written ticket looks like. If a plan is
all `impl-mid`, re-read the subtask column before re-reading the code: the usual cause is
subtasks written as intentions rather than as edits.

### Dispatch — how the tier is actually enforced

The model is bound by the `model:` frontmatter in `.claude/agents/impl-small.md` and
`.claude/agents/impl-mid.md`. Nothing else binds it — a tier named in a prompt is a label,
not a routing decision.

```
Agent({ subagent_type: "impl-small", prompt: <the five-part brief> })
```

- The `subagent_type` string comes straight from the ticket's Agent column.
- **Never** dispatch implementation to `general-purpose`, `claude`, or any other type —
  those inherit the orchestrator's model and put every subtask on the expensive tier.
- **Never** pass a `model` override. If a tier is wrong for a whole class of work, edit the
  agent file; if it is wrong for one row, fix the row in the ticket.
- Read-only work stays in the orchestrator. Dispatching discovery buys a summary you then
  have to trust, at the cost of a round trip.

**When `impl-small` returns `ESCALATE:`** — it was tiered wrong. Correct the row in the
ticket to `impl-mid`, then re-dispatch. Do not silently retry on a bigger model; the ticket
is the record of what the work actually cost.

**Record the dispatch before it happens.** Set the row to `[~]` and write the agent ID onto
the resume header's `Current subtask:` line — `3 — dispatched (agent a7f3c2), unverified` —
*before* the agent is sent, never after it returns. Two things depend on it: a dead session
can tell never-started from half-done, and the ID is the only handle that can bring an
interrupted agent back with its context intact. Written after the fact, it is written
exactly when it is no longer available.

### Recovering an interrupted wave

Reconcile in this order, before doing anything else:

1. `ai-workspace/active-tickets` — which ticket, which subtask, what else is in flight
2. The ticket's resume header — state and agent IDs
3. `git log --oneline` and `git status` in the affected repo

**The ticket records intent; git records what landed. Where they disagree, git wins.** A
`[x]` row has a commit behind it, so it is settled. A `[~]` row is the one to investigate.

| Situation | Move |
|---|---|
| `[~]`, same session (or one reopened with `--resume`) | Message the agent by its ID. Subagent transcripts persist with the session, and a resumed subagent keeps its full history — tool calls, results, reasoning — continuing from where it stopped |
| `[~]`, genuinely new session | The agent is unreachable. Re-read the target file, re-derive the brief from its **current** state, dispatch fresh |
| `[~]`, edits already complete on disk | Do not re-dispatch. Run the gate, read the diff, commit, mark `[x]` |
| Dirty tree, no `[~]` anywhere | Something landed outside the ticket. Stop and ask before continuing |

**Never re-send a stale brief.** A half-applied edit has already moved the line numbers the
brief names. `impl-small` will refuse it — its escalate rule fires when the brief's line
numbers do not match the file — but `impl-mid` has a Write tool and can plausibly apply the
change a second time: a duplicated import, a second copy of a helper. Re-derive first.

Reconcile fully — commit or revert the stray work — before dispatching a new wave. Never
start one on top of an unreconciled tree.

### Partitioning — the hard constraint

**By FILE, never by subtask number.** One agent owns exactly one file, or a set no other
agent touches. Parallel agents sharing a file overwrite each other silently — no error, no
conflict marker, just work that quietly isn't there.

**This does not stop at the ticket boundary.** Two tickets running concurrently are two
sets of agents on one working tree, and nothing about being in separate tickets keeps them
apart. A ticket's `Files:` header is its claim; `active-tickets` lists every claim in
flight. Check it before dispatching. Overlapping claims mean the tickets serialize, or one
is re-planned to a disjoint file set — or the project moves to `worktree-per-ticket`
isolation (§0), which is the only option that removes the hazard rather than managing it.

**Sequencing — one wave per response.** A wave is a single agent, or several whose file
sets are disjoint. Dispatch the wave, read and verify every diff in it, and only then plan
the next. Foundation subtasks — new shared helpers or modules other files import — are
their own wave and complete first; consumers follow. Where the project declares a layer
order, respect it when sequencing.

### The brief

Five tagged fields, the same shape every time. The tags are not decoration: they keep the
fields separable for the agent, and they make a bloated brief obvious the moment it stops
fitting the shape.

```
<subtask>one change, one concern</subtask>
<targets>exact paths, with line numbers where known</targets>
<non_goals>copied from the ticket's B2, verbatim</non_goals>
<acceptance>the condition a read of the diff proves or disproves</acceptance>
<constraints>touch nothing else · run TYPECHECK_CMD · return the fixed block</constraints>
```

**A correctly scoped `impl-small` brief:**

```
<subtask>Replace the inline currency formatting with the shared helper.</subtask>
<targets>src/billing/invoice-row.tsx:42, the `amount` render line. The helper already
exists at src/lib/format.ts:18 (`formatCurrency`) — import it, do not write one.</targets>
<non_goals>Rounding behavior does not change. The totals row is not in scope. No new
tests.</non_goals>
<acceptance>Line 42 calls `formatCurrency(amount)` and no `toFixed` remains in the
file.</acceptance>
<constraints>Touch nothing else, in this file or any other · run
`npx tsc --noEmit -p packages/web` · return FILES / CHANGES / SELF-CHECK, no prose.</constraints>
```

**The same subtask, dispatched wrong:** Part A pasted in "for background", the whole B4
plan so the agent "understands the shape", and the other six subtasks so it "doesn't
conflict with them". The agent can use none of it — it owns one file and is forbidden the
rest — and the cost is paid once per agent, every wave. Context sent to N agents costs N
times.

Note what the good brief does *not* say: it names the helper's location so the agent has no
reason to search, and it forbids writing a new one, because "use the shared helper" without
a path is an invitation to invent a second one.

### The return contract

```
FILES: <paths touched>
CHANGES: <≤10 lines, what changed and where>
SELF-CHECK: <typecheck/lint result, or the specific condition verified>
```

Then the orchestrator reads the real diff. **A subagent's claim is not evidence.**

---

## Step 6 — Sanity gate

Automatic, every subtask, never skipped. Not testing.

| Check | Command |
|-------|---------|
| Types | `TYPECHECK_CMD` in the affected package |
| Lint | `LINT_CMD`, scoped to touched files |
| Logic | Orchestrator reads the diff against the acceptance condition |
| Commit | `T-NNN.S — <what the subtask achieved>`, affected repo, that subtask's files |

No subtask is `[x]` until all four are done.

**Why the commit is in the gate.** Claude Code's checkpoints — `/rewind`, double `Esc` —
do not restore edits made by a subagent, and do not track files changed by bash commands.
This workflow routes *every* edit through a subagent, so it opts out of that safety net by
construction. Git is what is left. A per-subtask commit means the log and the checkbox
column say the same thing, and a session that dies mid-wave leaves at most one subtask's
work to reconstruct instead of ten.

Commit locally; **do not push** — pushing is outward-facing and needs approval. Start each
ticket from a clean tree, so nothing downstream has to guess which changes were already
there.

---

## Step 7–8 — Verification and graph update

The orchestrator verifies each diff against the subtask's acceptance condition before the
checkbox moves. Then refresh the knowledge graph **once for the ticket**, not per subtask.

If the graph update fails, report it and request guidance rather than proceeding silently.

---

## Step 9–10 — Testing

Cases were authored at plan time and sit as `NOT RUN`. Nothing executes until the developer
asks. Invoking `.agents/workflows/test.md` *is* that request.

### Tool selection

```
pure function  →  logic unit  →  service  →  API  →  browser (last resort)
```

Confirm the harness exists before planning against it. `NONE` in the config block means
wiring it is its own approved task, not an assumption to build on.

### The loop

```
run → fail → diagnose → fix (dispatch a subagent) → re-run
```

**Hard cap: 3 fix cycles.** On the 4th failure, stop and hand back with the diagnosis — by
then the problem is usually the specification, not the code.

Results go in the Verification table: `PASS` / `FAIL` / `NOT RUN`. Report honestly; a
recorded `NOT RUN` is worth more than implied coverage.

### Module testing

For `module-addition`, this loop runs twice, at two scopes. A **child's** test run covers
only its own B6 Verification table — it does not attempt cross-component behavior. The
**parent's** Module-Level Acceptance (M7) is the module-level analogue of a child's B6
Verification table: it is invoked by requesting testing on the **parent ID**, and only once
every child has reached
`AWAITING_TEST` or `COMPLETED`. Children passing individually does not imply it — the parent
run is what actually proves the components work together, and it must be requested and
recorded, not assumed.

---

## Step 11 — Closure

`COMPLETED` requires the sanity gate green, every diff verified, and either the requested
tests passing or the developer approving closure without them.

---

## Anti-patterns

| Don't | Because |
|-------|---------|
| Create a plan/log/test file beside the ticket | Sprawl compounds; agents find and follow stale files |
| Append to the ticket registry, or leave a COMPLETED row in it | It becomes a second source of truth that can't be truncated |
| Run two tickets whose `Files:` claims overlap | Agents in different tickets clobber each other as silently as agents in the same one |
| Paste the ticket into subagent prompts | Multiplies context N times for no benefit |
| Partition parallel work by subtask | Agents sharing a file silently destroy each other's edits |
| Plan browser tests by default | They get written in detail and never run |
| Assume a `test` command runs tests | It frequently runs something else entirely |
| Copy these rules into a subdirectory | Copies drift, then contradict, then get followed |
| Loop on a failing test indefinitely | After ~3 tries the spec is wrong, not the code |
| Let the author verify their own work | A fresh reader reviews more critically |
| Re-read the source PRD after decomposition | The parent ticket is the distillation; re-opening the source means the parent failed to capture it |
| Restate parent architecture inside a child ticket | Drifts from the parent on the next edit; the child should link back, not duplicate |
| Let a module reach `COMPLETED` with Module-Level Acceptance never run | Children passing individually never proves cross-component behavior |
