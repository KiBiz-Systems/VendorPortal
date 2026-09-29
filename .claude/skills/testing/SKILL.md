---
name: testing
description: Run the tests for the active ticket. Confirms the harness exists, runs the sanity gate first, executes the cases already written in the ticket's Verification table, loops on failure up to 3 fix cycles, and records PASS/FAIL/NOT RUN in the ticket. Invoking this IS the explicit request to test — tests are never run at any other time.
---

# /testing

`.agents/workflows/test.md` is authoritative for the testing rules. This skill is the
operational runbook for carrying them out. Where the two differ, that file wins.

## Usage

```
/testing              # run the active ticket's Verification table
/testing <ticket ID>  # run that ticket's cases (Module-Level Acceptance for parents, B6 Verification for children)
/testing <case #>     # re-run one case after a fix
```

---

## Runbook

**1. Load the ticket.** Read `ai-workspace/active-tickets` for the row, then the
ticket's resume header and applicable §B6 Verification or §M7 Module-Level Acceptance table.
If there is no ticket, stop — there is nothing to test against. Ad-hoc test runs with no
recorded expectation produce results nobody can act on later.

The pointer file may carry a `PARENT: T-NNN (child M/N)` line. If the target ticket is a
module **child**, run only its own B6 table — its parent's §M7 is not this run's business.
If the target is a module **parent**, run its §M7 Module-Level Acceptance instead of a B6
table, and only once every child is `AWAITING_TEST` or `COMPLETED`; if any child is not
there yet, stop and say which.

**2. Confirm the harness.** Check the `CLAUDE.md` §0 config block for the command each case
needs. If it is `NONE`, that case is `NOT RUN` with the reason — wiring a harness is its
own approved task. **Never invent a test command, and never substitute a nearby script that
looks like one.**

**3. Sanity gate first**, scoped to the affected package: `TYPECHECK_CMD`, then `LINT_CMD`
on the touched files. A type error makes every downstream result meaningless — stop and fix
before running anything.

**4. Execute the cases that are already written.** Do not invent cases mid-run. If a real
gap appears, add the row to the ticket's table, say so out loud, then run it.

Use the lowest layer that can prove the behavior:
`pure function → logic unit → service → API → browser (last resort)`.
Browser/E2E needs explicit developer approval *and* a stated reason the behavior cannot be
asserted functionally.

**5. Loop on failure.**

```
run → diagnose → fix (dispatch `impl-small` or `impl-mid`) → re-run
```

Fixes follow the normal execution rules: delegated, partitioned by file, diff read by the
orchestrator before the re-run. The brief stays minimal — the failing case, the file, the
expectation. Not the ticket.

**Hard cap: 3 fix cycles.** On the 4th failure, stop. Record the failing case and your
diagnosis in §B7 Decisions & Blockers and hand it back. By the fourth attempt the defect is
usually in the expected value or the requirement, not the code.

**6. Record every outcome** in the applicable table — B6 Verification for a child or M7
Module-Level Acceptance for a parent — as `PASS` / `FAIL` / `NOT RUN`, in place. No
separate test-result file, no execution log.

**7. Report honestly.** A case that did not run — no harness, no env, no fixture — is
`NOT RUN` with the reason. An accurate `NOT RUN` beats an implied coverage that does not
exist.

---

## Closure

Move to `COMPLETED` only when the sanity gate is green, every diff has been verified, and
the requested cases pass. Anything unresolved stays `AWAITING_TEST` or goes `BLOCKED`, with
the reason in §B7 Decisions & Blockers.

A module parent additionally requires its §M7 Module-Level Acceptance cases passing, or
explicit developer approval to close without them. Children can reach `COMPLETED`
individually before §M7 runs — the parent's closure does not gate theirs.
