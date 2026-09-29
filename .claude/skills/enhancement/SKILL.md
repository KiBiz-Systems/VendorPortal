---
name: enhancement
description: Change existing behavior intentionally, even though it already met its spec — expanding, improving, or adjusting something that already worked. Distinct from /bug-fix (prior behavior was already correct) and /feature-addition (this changes something existing rather than adding something new).
---

# /enhancement

The distinguishing test: **was the prior behavior meeting its own spec/expectation?** If
yes, and this changes it anyway, it's an enhancement. If no, it's actually `/bug-fix` even
if the change feels like an improvement.

## Usage

```
/enhancement <description>
```

---

## Discovery — capture the baseline before touching anything

The "before" state has to be provable, or A2 ("What changes") degenerates into vague
improvement language instead of a verifiable diff.

1. Record current behavior and existing test coverage for the thing being changed in B3
   Discovery — this baseline is what A2 diffs against.
2. `get_neighbors` on the function/component being enhanced. Callers that depend on the
   *current* behavior are the primary risk here — an enhancement that silently breaks a
   consumer is worse than the improvement is worth.
3. Any caller found this way that isn't explicitly named in A2 as "changing" is assumed to
   need its current behavior preserved.

---

## Planning

State the exact before/after in A2 in verifiable terms — "returns top 20 sorted by X," not
"improves sorting." If a caller found via discovery depends on the current output shape or
ordering, its continued behavior belongs in the plan explicitly, not as an afterthought.

---

## Non-goals to copy into every brief

- No unrelated refactor of the touched code — separate `/refactor` ticket
- No fixing unrelated bugs found nearby — raise as `/bug-fix` tickets
- Preserve behavior for every caller not named in A2 as changing

---

## Verification

Two kinds of case, not one:

1. Proves the **new** behavior described in A2.
2. Regression case proving behavior for callers *not* mentioned in A2 is unchanged — this
   is what separates an enhancement ticket from a from-scratch feature ticket, where there
   is no prior behavior to protect.
