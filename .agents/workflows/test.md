---
trigger: manual
description: The explicit request to run tests. Tests are never run otherwise.
---

# Run Tests

**Invoking this file IS the explicit request to test.** Tests are not run at any other time —
see `CLAUDE.md` §7. What runs during implementation instead is the sanity gate (§6).

---

## Procedure

1. **Confirm the harness exists.** Check the `CLAUDE.md` §0 config block. If the relevant
   command is `NONE`, stop — wiring it is its own approved task, not part of this run. Never
   invent a test command.

2. **Run the sanity gate first**, scoped to the affected packages: `TYPECHECK_CMD`, then
   `LINT_CMD`. A type error makes every downstream test result meaningless.

3. **Verify compliance** with `.agents/rules/rules.md` and the ticket's non-goals — confirm
   nothing outside the plan was touched.

4. **Execute the cases already written.** For a module **child** ticket, this run covers only
   that child's own Verification table. For a module **parent** ticket, this run executes its
   M7 Module-Level Acceptance cases instead — and only once every child is `AWAITING_TEST` or
   `COMPLETED`; if any child is not there yet, stop and name it.

   Do not invent new cases mid-run; if a genuine gap appears, add the row to the ticket and
   say so.

   Use the lowest layer that can prove the behavior:
   `pure function → logic unit → service → API → browser (last resort)`.

   Browser/E2E requires explicit developer approval and a reason the behavior cannot be
   asserted functionally.

5. **Loop on failure:**

   ```
   run → diagnose → fix (dispatch `impl-small` or `impl-mid`) → re-run
   ```

   **Hard cap: 3 fix cycles.** On the 4th failure, stop. Record the failing case and your
   diagnosis in the ticket and hand it back — by that point the problem is usually the
   expected value or the requirement, not the code.

   Fixes follow the normal execution rules: delegated to `impl-small`/`impl-mid` by the same
   tiering test, never to a generic agent type, partitioned by file,
   diff read by the orchestrator.

6. **Record every outcome** in the applicable table — B6 Verification for a child or M7
   Module-Level Acceptance for a parent — as `PASS` / `FAIL` / `NOT RUN`. Do not create a
   separate test file.

7. **Report honestly.** If a case did not run — no harness, no environment, no data — record
   `NOT RUN` and say why. An accurate `NOT RUN` is worth more than an implication of
   coverage that does not exist.

---

## Closure

Only after this run can the ticket move to `COMPLETED`, and only if the sanity gate is
green, every diff has been verified, and the requested tests pass. Anything unresolved keeps
the ticket at `AWAITING_TEST` or `BLOCKED`, with the reason recorded.

A module **parent** additionally requires its M7 Module-Level Acceptance cases passing, or
explicit developer approval to close without them. Children may reach `COMPLETED`
individually before M7 runs.
