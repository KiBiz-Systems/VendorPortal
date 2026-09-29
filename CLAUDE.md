# Claude Code Operating Manual

For cross-harness baseline rules, read `AGENTS.md` and `.agentic/core/operating-manual.md`.
This file supplies Claude-specific implementation-agent and ticket detail. Where the shared
core defines ownership, safety, memory, or review behavior, it wins; this file adds no broader
permission. Loaded every Claude session. Binding. **Design goal: minimum tokens, full context** — one
artifact per task, cheap models writing, an expensive model only judging. Expansions
live in `.agents/` (§11), loaded on demand only. `LESSONS.md` holds the production
failure behind each rule.

## 0. Project Configuration — FILL THIS IN FIRST

Until filled in, **ask rather than guess.** Never infer a command from convention
— run it once, record what it actually does. `NONE` is a valid value and a planning
constraint, not something to invent around.

| Key | Value |
|-----|-------|
| `TYPECHECK_CMD` | `<e.g. npx tsc --noEmit / mypy . / go vet ./... / cargo check>` |
| `LINT_CMD` | `<e.g. npm run lint / ruff check / golangci-lint run>` |
| `UNIT_TEST_CMD` | `<the unit test runner — verify it is actually a test runner>` |
| `API_TEST_CMD` | `<the API/integration test runner, or NONE if not wired>` |
| `BUILD_CMD` | `<the build command, if distinct from typecheck>` |
| Repo topology | `<single-repo / monorepo / split-repo — see §9>` |
| Packages | `<the top-level packages or apps, e.g. web, api, worker>` |
| Scope types | `<the valid scope classifications for this project — see §3>` |
| `Parallel isolation` | `<same-branch / branch-per-ticket / worktree-per-ticket — see §9>` |

**Implementation agents** are fixed, not configurable here — `impl-small` and
`impl-mid`, defined in `.claude/agents/`. Their `model:` frontmatter is what binds
the tier; change a tier by editing that file, never by prompting.

## 1. The Workflow

```
prompt → scope (§3) → graph discovery (§4)
  → ticket: plan + subtasks + `subagent_type` per subtask + test cases, all in one file (§2)
  → DEVELOPER APPROVAL — the plan and the delegation split, together
  → subagent execution, one subtask at a time, partitioned by file (§5)
  → sanity gate on every subtask: typecheck · lint · diff read (§6)
  → orchestrator verification → graph refresh → AWAITING_TEST
  → [ testing ONLY on explicit request: loop to green, max 3 cycles (§7) ] → COMPLETED
```

No implementation without an approved ticket. No exceptions — for `module-addition`,
the parent's Component Manifest approval covers every child unless that child's
Deviation Check fails, which reopens approval for that child alone (§2).

## 2. The Ticket Is The Only Artifact

`ai-workspace/tickets/T-NNN-slug.md` from `.agents/templates/TICKET_TEMPLATE.md` —
problem, discovery, plan, subtasks, agent-per-subtask, test cases, decisions. **One
file per task, nothing else.** No separate plan files, execution logs, status-update
sections, test-case files, or hand-off docs. *(API docs, SQL scripts, module `agents.md`
are deliverables, still written.)* Plan-mode output is transient: paste it into the
Plan section **verbatim**.

- **`module-addition` is two-level.** A parent ticket (`MODULE_TICKET_TEMPLATE.md`)
decomposes the module into components; each is its own child ticket (`T-NNN.1-slug.md`,
`TICKET_TEMPLATE.md`) running §1–§7 unmodified, citing the parent's Architecture
Decisions instead of re-deriving them.
- **Two parts, two audiences.** *Part A — Summary* (lead/manager): what's wrong,
what changes, impact & risk, plain language, no paths/names/line numbers/jargon, ≤25
lines. *Part B — Technical Detail* (implementing agent): root cause with `file:line`,
non-goals, discovery, plan, subtasks, verification; write B first, compress into A.
- **Hygiene — the token budget.** Resume header (~7 lines): status, scope, subtask,
files — read first, body only when needed. Ticket **≤170 lines**. Update **in
place**, never append (module parent's Deviation Log is the sole exception — a
decision log, not a status journal). Discovery holds only plan-relevant findings.
- **Context turns over; the ticket carries the state.** The window compacts
automatically — never wind a subtask down early, skip verification, or thin a plan to
save tokens. Keep the resume header true as each subtask closes, so a fresh window
resumes from the ticket instead of reconstructing it.
- **Three subtask states, not two.** `[ ]` not started · `[~]` dispatched, not yet
verified · `[x]` gate green, diff read, committed. Write `[~]` and the resume header's
`Current subtask:` line — `3 — dispatched (agent a7f3c2), unverified` — **before**
dispatching, not after. Without it a dead session cannot distinguish never-started from
half-done, and the agent ID that would have recovered the work is gone.
- **Resuming — reconcile before acting.** `active-tickets` → the ticket's resume header
→ `git log --oneline` and `git status` in the affected repo. The ticket records intent;
git records what landed, and where they disagree **git wins**. A `[~]` row means an agent
was mid-flight: in the same session (including one reopened with `--resume`) message it
by its ID and it continues with full context; in a genuinely new session re-derive the
brief from the file's current state — never re-send line numbers a half-applied edit has
already moved.
- **Status:** `TODO` → `IN_PROGRESS` → `AWAITING_TEST` → `COMPLETED` |
`BLOCKED`. `AWAITING_TEST` means implementation verified, tests not yet run (§7).
- **`ai-workspace/active-tickets` is an index, not a journal** — one row per in-flight ticket:
ID, path, status, current subtask, claimed files (a module child adds its parent
as `T-NNN (child M/N)`). **Rewritten whole** on every status change, never appended, and
a row holds nothing that is not already in that ticket's resume header. **`COMPLETED`
deletes the row** — the ticket file is the record. The file is bounded by what is in
flight, never by how long the project has run: if it keeps growing, that is concurrency
to question, not a file to trim.

## 3. Scope & Type Classification

Classify both before any work. **Scope** decides which docs load. Defaults (adjust in
§0): **frontend** — UI, client logic, rendering · **backend** — API, middleware,
services, data access, business rules · **fullstack** — both, including the API
contract the UI depends on. Do not claim `fullstack` unless the task genuinely spans
both. **Type** decides discovery depth, ticket rigor, default agent tier — record
it in the ticket's `Type:` header line:

| Type | Definition | Ticket | Skill |
|------|------------|--------|-------|
| `module-addition` | New bounded domain — own data model, plugs into the existing app | `MODULE_TICKET_TEMPLATE.md` + one `TICKET_TEMPLATE.md` per component | `/module-addition` |
| `feature-addition` | New capability inside an existing module's boundary | `TICKET_TEMPLATE.md` | `/feature-addition` |
| `enhancement` | Existing behavior changes intentionally — nothing was broken | `TICKET_TEMPLATE.md` | `/enhancement` |
| `bug-fix` | Behavior violates an existing spec/expectation | `TICKET_TEMPLATE.md`, Part B leads with root cause | `/bug-fix` |
| `refactor` | Behavior-preserving restructuring | `TICKET_TEMPLATE.md` — see `/refactor` | `/refactor` |
| `migration` | Dependency, framework, API, or data version change | `TICKET_TEMPLATE.md` | — |
| `chore` | Tooling, CI, config — no user-visible behavior | `TICKET_TEMPLATE.md`, lighter discovery | — |
| `security-fix` | Vulnerability remediation | `TICKET_TEMPLATE.md`, own urgency | — |

Classifying the Type selects the skill; invoke it rather than treating the table as
passive. Unclear type → ask rather than guess.

## 4. Discovery Before Editing — Graph First

The project keeps a **Graphify knowledge graph** of the codebase. Query it instead of
scanning directories — call reference: `.agents/rules/graphify.md`. No graph yet
→ building it is a setup task, not a licence to skip discovery. Query the graph
**before any exploration**, using returned paths to target reads. `get_neighbors`
on anything about to be edited, for callers and dependents — prevents unintended
breakage. `shortest_path` entry point → leaves for cross-cutting changes. Discovery
completes **before** the plan is written; refresh the graph **once per ticket**.

**The graph locates; it does not testify.** Never describe what code does, or write a
plan step against it, from graph metadata, a filename, or a symbol name alone — open the
file first. A path and an edge point at evidence; they are not the evidence.

## 5. Execution Is Always Subagentic

Implementation is delegated by default; the developer never has to ask for it.

- **Small** (`impl-small`) — mechanical single-site edits: swap a formatter, change
one render line, align a fallback, rename a field.
- **Mid** (`impl-mid`) — design judgment, cross-file contracts, correctness and
date/time reasoning, new modules, anything with an invariant to preserve.
- **Orchestrator** (the main loop) — **never writes code.** Plans the split,
dispatches, reads every diff, verifies against acceptance criteria.
- **Dispatch is by agent name, not by intention** — the only thing that
binds a model is the `model:` frontmatter in `.claude/agents/impl-small.md` and
`.claude/agents/impl-mid.md`. Every dispatch is `Agent` with `subagent_type:
"impl-small"` or `"impl-mid"` — the literal string from the ticket's Agent column.
- **Never dispatch implementation to `general-purpose`, `claude`, `Explore`, `Plan`,
or any other type** — those inherit the orchestrator's model, silently escalating tier.
- **Never pass a `model` override** on an implementation dispatch — the agent file
is the single source of truth; a prompt override is invisible to review and drifts.
- The orchestrator has no Edit/Write budget for implementation — editing a file
yourself "because it's quick" is a dispatch you skipped.
- **Read-only work stays in the orchestrator** — discovery, graph queries, diff
reading, verification are never dispatched; a subagent that only reads costs a round
trip and returns a summary you then have to trust.
- **Tier assigned per subtask in the ticket at plan time** — the Agent column holds
the literal `subagent_type`, so approval and dispatch read the same string.
- **Default to `impl-small`.** Promote to `impl-mid` only when the tiering test forces
it: statable as "in file X at line N, change A to B" → `impl-small`; needs *why*
explained → `impl-mid`. All-`impl-mid` plans were not tiered.
- **`ESCALATE` is a valid return.** An `impl-small` agent returning `ESCALATE:` was
tiered wrong, not broken — re-dispatch to `impl-mid` and correct the tier in the
ticket; never just raise the model on the same brief without recording it.
- **Partition by FILE** — one agent owns one file, or a file set no other agent
touches; several subtasks in one file all go to that file's agent. Hard constraint:
parallel agents sharing a file clobber each other silently.
- **Across tickets the same rule holds.** A ticket's `Files:` header is its claim on
those paths. Before dispatching into one ticket while another is in flight, check the
claims in `active-tickets`: overlapping file sets mean the tickets serialize, or one gets
re-planned. Agents in two different tickets clobber each other exactly as silently as two
in the same one — the ticket boundary is not a lock.
- **Foundation first** — shared helpers/modules others import run to completion
before consumer edits fan out.
- **The brief is fixed and minimal** — the same five tagged fields every time, so bloat
is visible at a glance. Never paste the whole ticket, plan, or a graph dump into it:
  ```
  <subtask>one change, one concern</subtask>
  <targets>exact paths, with line numbers where known</targets>
  <non_goals>copied from the ticket's B2, verbatim</non_goals>
  <acceptance>the condition a read of the diff proves or disproves</acceptance>
  <constraints>touch nothing else · run TYPECHECK_CMD · return the fixed block</constraints>
  ```
- **The return is fixed and compact**, no prose, no restating the plan:
  ```
  FILES: <paths touched>
  CHANGES: <≤10 lines, what changed and where>
  SELF-CHECK: <typecheck/lint result, or the specific condition verified>
  ```
- **Read the actual diff** before marking a subtask `[x]`. A subagent's claim that it
did something is not evidence that it did.

Constraints: **one wave dispatched and verified per response** — a wave is one agent, or
several whose file sets are disjoint; every diff in a wave is read and verified before the
next wave is planned · only files listed in the ticket's plan · no new frameworks,
unplanned refactors, or silent architecture changes · **never modify existing UI design
without explicit developer approval** · if the plan is wrong, stop and revise the ticket
rather than expanding scope mid-execution.

## 6. Sanity Gate — Automatic, Every Subtask

Cheap static checks during implementation. **Not** "testing"; never skipped or
deferred. `TYPECHECK_CMD` in the affected package · `LINT_CMD` **scoped to the touched
files** (never lint the whole repo for one file) · orchestrator reads the diff against
the subtask's acceptance condition. No `[x]` until all three are clean.

**Then commit — the gate's fourth step, not an optional extra.** `/rewind` does not
restore subagent edits and does not track bash-driven changes, and this workflow puts
every edit through a subagent. Git is the only recovery mechanism that covers the work,
so a green gate ends in a commit inside the affected repo (§9), message
`T-NNN.S — <what the subtask achieved>`, scoped to that subtask's files. Committing is
local and reversible; **pushing is not, and needs approval** (§10). Start a ticket from
a clean tree — a dirty one on arrival means stopping to ask, because otherwise nothing
downstream can tell your changes from the ones already there.

## 7. Testing — On Explicit Request Only

**Never run tests unless the developer explicitly asks** — `/testing` is that
request. Author cases at plan time, leave them `NOT RUN`, set `AWAITING_TEST`. §6
guards correctness meanwhile. **Prove behavior at the lowest layer that can prove it:**
`pure function → state/logic unit → service → API → browser (last resort)`. Use
`UNIT_TEST_CMD` (§0) for pure functions, logic units, and component/state behavior;
use `API_TEST_CMD` (§0) for endpoint behavior and cross-layer flows. A dry run —
typecheck plus diff read — covers static or aesthetic changes only. Browser/E2E is
**avoided**; use it only when behavior is genuinely unreachable functionally, and only
with explicit developer approval.

- **Confirm the harness exists first:** if `API_TEST_CMD` is `NONE`, say so in the
ticket and treat wiring it as its own approved task. Never write cases against a runner
that isn't there.
- **The loop:** run → fail → diagnose → fix via subagent → re-run. **Hard cap
3 fix cycles.** On the 4th failure, stop, record the failing case and diagnosis, hand
it back — by then the problem is usually the specification. Record every outcome as
`PASS` / `FAIL` / `NOT RUN`.
- **The fix addresses the cause, never the assertion.** Do not edit, weaken, skip, or
delete a case to reach green, and do not special-case the input it uses. A case you
believe is wrong is a finding — record it and hand back. That is the 4th-failure
outcome arriving early, not a way around it.
- **Module-level testing.** For a `module-addition`, a child's `/testing` run covers
only that child's B6 table; the parent's M7 Module-Level Acceptance runs via `/testing`
on the parent ID, once every child is `AWAITING_TEST` or `COMPLETED`.
- **`COMPLETED` requires:** sanity gate green · every diff verified by the orchestrator
· the requested tests passing, or the developer approving closure without them. A
module parent additionally requires M7 passing, or explicit closure approval without it.

## 8. Module `agents.md`

Every module carries one at its root so an agent orients in one read instead of
exploring. Template `.agents/templates/AGENTS_MD_TEMPLATE.md`, **max 100 lines**:
purpose · key exports with `file:line` · dependencies · layer breakdown · common
tasks · where tests live · non-obvious gotchas. Missing → create on first work
there. Significant change → update it.

## 9. Repository Topology

Declare it in §0. Rules say "the affected package" rather than naming directories,
so they hold for single repo, monorepo (scope and gate per package), and split repos
under one parent — each subdirectory its own git repo: `cd` into the specific repo
before any git command · commit and push within that repo only · **never** commit
across repos from the parent · shared `ai-workspace/` lives at the parent, no nested
copies. **One authority.** A subdirectory's own rules/workflow doc is a *view* of this
file; anything describing a superseded process carries a superseded banner.

**Parallel tickets.** Declare `Parallel isolation` in §0. `same-branch` — concurrent
tickets interleave commits on one branch; only sound when their file claims are disjoint,
and reverting one ticket means picking its commits out by hand. `branch-per-ticket` — one
branch per ticket, merged at closure, so each ticket stays revertible as a unit.
`worktree-per-ticket` — a separate working directory per branch, so two sessions never
share a tree; the strongest isolation and the only one that removes the file-claim hazard
outright, at the cost of a checkout per ticket. Note that a worktree gets its own
`ai-workspace/`: designate one tree (normally the primary checkout) as authoritative for
the ticket registry rather than editing per-tree copies.

## 10. Standing Rules

- **Communication.** Answer like a developer briefing a technical manager: outcome
first, short bullets, only what's needed to understand the decision/issue/next step,
no repetition or text dumps; offer detail, supply when asked. Governs conversation
only — files follow their templates, and §5's return format wins where they overlap.
- **Database.** Never CRUD a real database. Schema change → write SQL to
`ai-workspace/sql/NNN_description.sql`, ask the developer to review and run it, then
update `ai-workspace/docs/db-architecture.md`. Detail: `.agents/rules/database.md`.
- **Irreversible and outward-facing actions.** Local, reversible work — editing files,
running the sanity gate — proceeds unasked. Anything hard to undo or visible to other
people stops for approval first: `git push --force`, `git reset --hard`, amending pushed
commits, deleting branches or files you did not create, `rm -rf`, dropping tables, and
anything that leaves the machine — pushing, opening or commenting on a PR, posting to an
external service. Never route around an obstacle destructively: `--no-verify` and
discarding unfamiliar working-tree changes are not fixes.
- **API contracts.** Document every new or changed endpoint in
`ai-workspace/docs/api/NNN_description.md` — body, params, query, headers, response
shape, validation notes; never left undocumented. Keep the declared layer order
(commonly `Route → Controller → Service → Model`): HTTP validates/delegates,
service holds business logic and stays framework-free, data layer holds queries only.
- **Time.** Dates involved → adopt `.agents/rules/timezone.md`: client supplies
the timezone against a documented default, server's own local time is never an input,
store UTC and convert at the edges — this bug class is silent and corrupts stored data.
- **Environment.** Never hardcode credentials, keys, IDs, secrets, URLs, or test inputs
— read from environment/config, including in scratch and diagnostic scripts. Missing
variable → stop and ask; the agent is not authorized to edit environment files.
- **General.** Minimal safe changes, no cleanup beyond scope · keep backward
compatibility unless told otherwise · no repo-wide changes without explicit approval
· clarify ambiguity, never guess · scratch scripts in `temp/`, never the repo root,
deleted when the task ends.

## 11. Load On Demand

Never preload. Fetch by scope, only when needed. Missing doc → stop and ask.

| Doc | Load when |
|-----|-----------|
| `.agents/rules/coding-guidelines.md` | any implementation work |
| `.agents/rules/frontend.md` | frontend scope |
| `.agents/rules/backend.md` | backend scope |
| `.agents/rules/database.md` | DB changes involved |
| `.agents/rules/timezone.md` | date/time logic involved |
| `.agents/rules/graphify.md` | graph setup or advanced queries |
| `.agents/templates/MODULE_TICKET_TEMPLATE.md` | Type classified as `module-addition` (§3) |
| `.agents/templates/EXAMPLE_TICKET.md` | writing a first ticket, or unsure how much detail a section wants |
| `.agents/rules/karpathy.md` | behavioral checklist before a large or ambiguous change |
| `LESSONS.md` | a rule here looks like overhead, or you are about to weaken one |
| `.agents/rules/rules.md` | auditing or extending the rules |
| `.agents/workflows/workflow.md` | auditing or extending the workflow |
| `ai-workspace/docs/db-architecture.md` | schema work |
| `ai-workspace/active-tickets` | resuming work, or checking what else is in flight |

**Skills** — auto-discovered from `.claude/skills/<name>/SKILL.md`, each carrying
out this workflow for one kind of task: `/testing` (the §7 trigger) · `/refactor`
(behavior-preserving restructuring) · `/ui-responsiveness` (viewport behavior audit
and fix) · `/module-addition`, `/feature-addition`, `/bug-fix`, `/enhancement`
(the §3 Type taxonomy — discovery focus, ticket rigor, and non-goals specific to
each). A skill that contradicts this file is wrong, not authoritative.

## Compact Instructions

Preserve verbatim when compacting: the §0 configuration table · this session's ticket ID,
path, status, and `Current subtask:` line including any agent IDs · that ticket's
non-goals · which subtasks stand at `[ ]`, `[~]`, and `[x]`.

Summarize the rest freely. File contents already read, tool output, and narration of
finished subtasks are all recoverable from the ticket and `git log` — they do not need
to survive in the transcript.
