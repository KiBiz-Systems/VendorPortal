---
name: bug-fix
description: Correct behavior that violates an existing spec or expectation — intent doesn't change, execution was wrong. Trigger — "fix", "broken", "error", "not working", a stack trace or repro. If the prior behavior actually met its spec and this changes it anyway, that's /enhancement, not a bug fix.
---

# /bug-fix

The distinguishing test: **was the prior behavior meeting its own spec/expectation?** If
no, it's a bug fix, even if the change also happens to feel like an improvement. If yes,
it's `/enhancement`.

## Usage

```
/bug-fix <description or repro>
```

---

## The one hard rule

**Root cause before plan.** B1 (Root cause) is the section this ticket type lives or dies
on. A plan written before the mechanism is understood is a guess — and a guessed fix that
happens to make the symptom disappear is debt with a delay timer, not a fix.

---

## Discovery — reproduce, then trace

1. **Reproduce first**, or get the exact repro / stack trace from the report. If it can't
   be reproduced and the report is only a symptom description, that is a blocker — record
   it in B7 and stop, don't guess a mechanism to fit the symptom.
2. `get_node` on the function/component nearest the symptom.
3. `get_neighbors` outward until you reach the actual point of divergence from spec — this
   becomes B1's `file:line` evidence, not the place the symptom was merely observed.
4. `shortest_path` when the divergence is far from the symptom (a UI bug caused by a
   backend data issue, for example).

---

## Planning

The fix addresses the mechanism found in B1, not the symptom. If the plan amounts to
"add a null check / try-catch to suppress it" without B1 explaining *why* the null or
exception occurs, stop — that's a symptom patch, not a fix, and the ticket isn't ready.

---

## Non-goals to copy into every brief

- No adjacent cleanup
- No fixing other bugs noticed along the way — raise each as its own ticket
- No behavior changes beyond restoring the specified/expected behavior

---

## Verification

Author the **failing case first** — it characterizes the bug and must fail against the
current code. The fix's job is to flip it to passing; that's the proof, not a new case
written after the fact to match whatever the fix happened to produce. Add a regression
case if the same mistake could recur elsewhere (check siblings via `get_neighbors`).
