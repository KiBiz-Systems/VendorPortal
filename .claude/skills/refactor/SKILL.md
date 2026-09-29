---
name: refactor
description: Behavior-preserving restructuring — extract a helper, split a file, remove duplication, rename across call sites, untangle a layer violation. Maps every caller through the graph before touching anything, keeps observable behavior identical, and never bundles a fix or a feature into the same ticket.
---

# /refactor

A refactor changes **structure, not behavior**. If observable behavior changes, it is not a
refactor — it is a fix or a feature, and it needs its own ticket.

## Usage

```
/refactor <target>        # a file, function, module, or duplication you want restructured
/refactor                 # restructure whatever was just discussed
```

---

## The one hard rule

**Never bundle a refactor with a behavior change.** Two tickets, in order — the behavior
change first, then the restructuring, or the reverse. A mixed diff cannot be reviewed: every
behavioral difference becomes ambiguous between "intended" and "broke it while moving it."

If you discover a genuine bug mid-refactor, stop. Record it in §B7 Decisions & Blockers,
finish or abandon the refactor cleanly, and raise the bug as its own ticket.

---

## Discovery — this is where a refactor is won or lost

Before writing the plan:

1. `get_node` on the target to get its exact location.
2. **`get_neighbors` on every symbol you intend to move, rename, or change the signature of.**
   The callers are the actual scope of the work. A refactor that misses one caller is a
   silent production break that typechecks in dynamically-typed code.
3. `shortest_path` from the entry point when the target sits in a call chain — it tells you
   how far the blast radius reaches.
4. `god_nodes` before restructuring anything shared. A heavily-depended-on abstraction is a
   different risk class from a leaf.

Record in §4 **the caller count and the list of files that must change together**. That list
is the subtask partition.

---

## Planning

- Every file the graph named as a caller goes in the plan. No caller edits discovered
  mid-execution — that means discovery was incomplete, so stop and revise the ticket.
- **Foundation first.** The new shared helper or moved module runs to completion as subtask
  1. Consumer edits fan out only after it exists. Order this explicitly in §6.
- **Tier honestly.** A mechanical rename at known line numbers is `impl-small`. Anything
  where the agent must decide *what the right boundary is* is `impl-mid` — extraction, layer
  separation, and signature design are judgment, not mechanics.
- State the invariant in each subtask's acceptance condition: *"the call sites produce
  identical results; no signature visible outside this module changes."*

---

## Verification

Behavior preservation is the only thing being proven, so the cases are the same on both
sides of the change:

| Situation | Case to write |
|---|---|
| Existing tests cover the target | Re-run them unchanged — **do not edit a test to make it pass a refactor.** An edited assertion proves nothing. |
| No coverage exists | Write the characterization case against the **current** behavior *before* refactoring, so it can fail if you break something |
| Pure structural move, typed language | Sanity gate + orchestrator diff read may be sufficient — say so explicitly in the table |

Cases stay `NOT RUN` until the developer asks (§7). The sanity gate still runs on every
subtask, and here it matters more than usual: `TYPECHECK_CMD` across the **whole affected
package**, not just the touched files, because the point of the change is that other files
depend on what moved.

---

## Non-goals to copy into every brief

- No behavior changes, no bug fixes, no new features
- No new dependencies, patterns, or abstractions the plan did not name
- No opportunistic cleanup of adjacent code
- No test edits beyond mechanical import/path updates
