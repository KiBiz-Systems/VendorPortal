# Lessons — Why This Template Looks Like This

Every rule in `CLAUDE.md` was paid for on a real production codebase (a multi-module
booking/billing/POS platform, ~3000 graph nodes, agentic development over roughly six
months). This file records what actually went wrong, so nobody has to relearn it.

Read this before deciding a rule is bureaucratic overhead.

---

## 1. Multi-file-per-task workflows silently produce sprawl

**What happened.** The original workflow was `ticket → plan → execution log → test scenario`.
Four markdown files per task, each partly duplicating the others. Nobody audited it for
months.

By the time it was measured: **191 obsolete markdown files** — 86 plans, 43 execution logs,
55 test files, 7 implementation plans. Three *parallel* ticket systems had accumulated (124
tickets at the repo root, 135 in one subdirectory, 78 in another) because the workflow docs
were duplicated per package and each copy pointed somewhere different.

**Why it hurts more with agents than with humans.** A human ignores stale files. An agent
finds them, reads them, believes them, and follows the pattern — producing the 192nd file.
Sprawl is self-reinforcing.

**The rule.** One ticket per task, carrying everything. `CLAUDE.md` §2.

---

## 2. Append-only status files become a second source of truth

**What happened.** An `active-ticket` file was meant to say "here's what's in flight."
Because every session appended rather than overwrote, it grew to 44 lines covering six
tickets, restating status, blockers, and pending actions that also lived in the tickets
themselves. It was read on every resume.

Worse: the two copies drifted. Some notes existed *only* in `active-ticket`, so it could not
safely be truncated — the very thing that would have fixed it was now blocked by it.

**The rule.** The file is **rewritten whole**, never appended, and holds nothing that is
not already in the tickets it points at. `CLAUDE.md` §2.

**Corollary.** Any "just a small log" file trends toward becoming a database. If it grows
monotonically and is read every session, it is a bug.

**Refinement — the original rule over-corrected.** The first fix capped the file at a
handful of lines covering *one* ticket. That made concurrent tickets impossible: two
sessions overwrote each other's pointer, and the second ticket became invisible. But
"one ticket" was never the lesson. Re-read the failure: the file broke because it grew
**monotonically in time** and because it carried notes that existed nowhere else. A row
per in-flight ticket breaks neither property — it is bounded by concurrency, it shrinks
when a ticket closes, and every field in it is a copy of that ticket's resume header, so
truncating it can never lose anything.

The registry it became also carries each ticket's **file claims**, which turned out to
matter more than the status column: lesson 4 (parallel agents on one file) applies just
as well to agents in two different tickets, and the ticket boundary is not a lock. The
index of what is in flight is the only place that hazard is visible before it happens.

**The generalization.** When a rule blocks legitimate work, check whether the rule states
the failure or merely one situation where the failure occurred. A cap on *lines* was a
proxy; the real invariants were *bounded* and *non-duplicating*. Fix the proxy, keep the
invariants.

---

## 3. The token leak in subagentic development is the brief, not the file count

**What happened.** Consolidating to one ticket felt like the win. It wasn't the big one.
The real cost was fan-out: the full ticket — problem, discovery, plan, all subtasks, all
test cases — pasted into every subagent prompt. Ten agents, ten copies of context nine of
them could not use.

**The rule.** A brief carries only: the subtask, exact `file:line` targets, the ticket's
non-goals, the acceptance condition, and "touch nothing else." `CLAUDE.md` §5.

**The mirror problem.** Agents returning prose essays about what they did, straight back
into the orchestrator's context. Hence the fixed `FILES / CHANGES / SELF-CHECK` return
contract — and the orchestrator reading the real diff, because an agent's *claim* that it
made a change is not evidence.

---

## 4. Parallel agents on one file destroy each other's work

**What happened.** Subtasks were partitioned by subtask number, which reads naturally and
is wrong. Two subtasks touching the same file, dispatched in parallel, each wrote its
version. Last write won. The loss was silent — no error, no conflict marker, just a change
that quietly wasn't there.

**The rule.** Partition by **file**, never by subtask. One agent owns one file; where
several subtasks land in the same file, that file's single agent takes all of them.
`CLAUDE.md` §5.

This is a hard constraint, not a style preference. It is the single easiest way to lose work.

---

## 5. Browser test suites get specified in exhaustive detail and then never run

**What happened.** One ticket carried eight numbered Playwright scenarios. The repo had a
`playwright.config.ts` and **zero spec files**. The scenarios were carefully written,
reviewed, and never executed — the harness didn't exist and standing one up was never
anyone's task.

This was not isolated. Detailed browser test plans accumulated across dozens of tickets
while the actual verification performed was "typecheck passed and I read the diff."

**The rules.**

- Prove behavior at the lowest layer that can prove it: pure function → logic unit →
  service → API → browser. `CLAUDE.md` §7.
- Be honest about what ran. A ticket that says `NOT RUN` is worth more than one implying
  coverage that never existed.
- Don't pretend the sanity gate is a test suite — but don't pretend it's worthless either.
  Typecheck plus a read diff caught real bugs. Name it, require it, and stop conflating it
  with testing.

---

## 6. Verify the harness exists before planning tests against it

**What happened.** Rules mandated "Supertest for backend API behavior." No Supertest
harness existed. Meanwhile `npm test` in that package ran a domain-specific billing script,
and `npm test` in the frontend ran an API smoke script — the actual unit runner was
`test:unit`. Every one of those is something an agent would assume wrong from convention.

**The rules.**

- Record the *real* commands in the `CLAUDE.md` §0 config block, verified by running them.
- Record `NONE` where a harness genuinely doesn't exist. An absent harness is a planning
  constraint to surface, not something to write test cases around.

---

## 7. Duplicated rule docs drift, then contradict, then get followed

**What happened.** Each package carried its own `.agents/rules/rules.md` and
`workflows/workflow.md`. They were copies, so they were never updated together. One was five
months stale. Both were marked auto-load. An agent working inside that package loaded the
old spec — separate plan files, execution logs, test-scenario files — and dutifully followed
it, while the root spec said the opposite.

Three README files also documented the superseded process across some fifteen sections each.

**The rules.**

- **One authority.** Nested docs are *views* that name the authoritative file and say so at
  the top.
- **Mark supersession explicitly.** A stale doc left unmarked will be found and believed.
  A banner naming what replaced it costs three lines and prevents the whole failure.
- Archive obsolete artifacts out of the live tree, with a README explaining why.

---

## 8. Unbounded fix loops don't converge

**What happened.** "Test until it passes" sounds obviously right. In practice, by the fourth
failed fix the problem was almost never the code — it was a wrong expected value, a
misunderstood requirement, or a missing fixture. The loop kept spending on the wrong
hypothesis.

**The rule.** Cap at 3 fix cycles. On the 4th failure, stop and hand back with the
diagnosis. `CLAUDE.md` §7.

---

## 9. Timezone bugs are silent, reach production, and corrupt stored data

**What happened.** Date handling that relied on the server's local time, plus dates stored
without a clear UTC contract. Symptoms surfaced far from the cause: ages off by one, renewal
dates landing on the wrong day, a customer overcharged, and — worst — signed documents
asserting wrong figures. Some records were already wrong in the database, so the code fix
alone couldn't clear them; a separate data correction was needed.

**The rules.** An explicit client-supplied-timezone policy with a documented default. The
server's own local time is never an input. Store UTC, convert at the edges. See
`.agents/rules/timezone.md`.

**Meta-lesson.** When a bug class has already corrupted stored data, the fix is two tickets:
the code path *and* the data correction. Shipping only the first looks like success and isn't.

---

## 10. The expensive model should judge, not type

**What happened.** Having the strongest model write the code was the intuitive default. It
was expensive and, more surprisingly, worse at review — an author who just wrote a change
verifies it less critically than a reader encountering it fresh.

**The rule.** Small models do mechanical edits, mid models do judgment work, the
orchestrator never writes code and reviews everything. `CLAUDE.md` §5.

**The tiering test.** If the subtask can be described as "in file X at line N, change A to
B," it's small-model work. If describing it requires explaining *why*, it needs the mid tier.

---

## 13. A tier written in prose is not a tier

**What happened.** Lesson 10 was written into the rules and into every ticket's subtask
table — `small`, `mid`, per row, approved at plan time. And every subtask still ran on the
orchestrator's model. The tier column was documentation. Dispatch went to a generic
subagent type, and a generic subagent **inherits the caller's model**. Nothing was
misconfigured and nothing errored; the whole tiering scheme was decorative, and the bill
looked exactly like having no tiering at all.

The tell was that it was invisible. A rule that is ignored usually produces a wrong result.
This one produced correct results at 10× the cost, so nothing surfaced it.

**The rule.** A tier must be bound by a mechanism the agent cannot route around. Concretely:
one agent definition file per tier, with `model:` in its frontmatter, and a ticket column
holding the literal `subagent_type` that gets dispatched. No prompt-time `model` override —
an override is invisible to review and drifts from the approved plan. `CLAUDE.md` §5.

**The generalization.** Any rule of the form "the agent should choose X" is a suggestion
until something outside the prompt makes X the only reachable option. Prefer a config file,
a named artifact, or a tool boundary over an instruction. When you cannot, at least make the
approved artifact carry the *exact literal* the execution step consumes — a plan that says
`small` needs translating at dispatch time, and translation is where intent leaks.

---

## 11. Cheap resume matters more than fewer files

**What happened.** Reducing four files to one helped. But the recurring cost turned out to
be re-reading a whole ticket to answer "where was I?" — which happens at every resume, far
more often than the plan itself is needed.

**The rule.** A resume header in the first ~7 lines: status, scope, current subtask, target
files. Read the header on resume; read the body only when the plan is genuinely needed.
`CLAUDE.md` §2.

---

## 12. Approve the delegation split, not just the plan

**What happened.** Plans got approved; the agent then chose tiering and partitioning at
dispatch time. The developer only found out how work had been split after it was done —
including the cases where it was split wrong.

**The rule.** The agent column lives in the ticket's subtask table, filled in at plan time.
Approving the plan approves the split. `CLAUDE.md` §5.

---

## 14. The built-in undo does not cover subagent work

**Not a production incident — a property of the harness**, found by reading the docs rather
than by losing a day to it. It is recorded here because the rule it produces looks like
ceremony until you know this, and §11 of the load table points here when a rule looks like
overhead.

Claude Code checkpoints every file edit and lets you rewind with `/rewind` or a double
`Esc`. That safety net has two holes: it does not track files changed by bash commands, and
**it does not restore edits made by a subagent**. The docs are explicit — *"rewinding
doesn't restore the edits. Use git to revert them."*

This workflow routes **every** edit through a subagent; the orchestrator has no Edit budget
at all. So it opts out of checkpointing by construction. The undo button that appears to be
there covers approximately none of the work this template produces.

**The rules.**

- The sanity gate ends in a commit. Green typecheck, green lint, diff read, **commit** —
  one per subtask, in the affected repo. `CLAUDE.md` §6.
- Commit locally, never push. Pushing is outward-facing and needs approval. §10.
- Start a ticket from a clean tree, or stop and ask. Otherwise no later reader — human or
  agent — can separate this ticket's changes from what was already sitting there.

**The related mechanism, worth knowing before you delete a `[~]`.** Subagents *are*
recoverable: each has an agent ID, a resumed subagent keeps its full history, and
transcripts persist with the session, so an interrupted agent can be continued after a
restart if the same session is resumed. But the ID is only knowable while the agent exists.
Recording it after the agent returns is recording it exactly when it stopped mattering —
hence `[~]` and the ID on the resume header *before* dispatch, not after.

**The generalization.** A safety net you did not verify covers your case is worse than no
safety net, because you stop building your own. Check what the tooling actually protects
before designing around it.

---

## Summary — the transferable principles

1. **One artifact per task.** Anything else drifts and gets believed.
2. **Overwrite, never append.** Monotonically growing context files are bugs.
3. **Minimal briefs.** Context you send N agents costs N times.
4. **Partition by file.** The alternative silently loses work.
5. **Lowest layer that proves it.** Higher layers get planned and skipped.
6. **Verify the tooling exists.** Never infer a command from convention.
7. **One authority; mark the stale.** Unmarked stale docs get followed.
8. **Bound every loop.** Repeated failure means the spec is wrong.
9. **Judge ≠ author.** The reviewer should not be the writer.
10. **Be honest about what ran.** `NOT RUN` beats implied coverage.
11. **Bind rules to mechanism.** A tier in prose is a label; a tier in frontmatter is a tier.
12. **Verify what the safety net covers.** An undo that skips your whole execution path is not an undo. Commit, and let git be the checkpoint.
