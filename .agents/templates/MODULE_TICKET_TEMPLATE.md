# T-NNN: [Module Name]

**Status:** TODO
<!-- Rolled up, never set directly: IN_PROGRESS if any child is active, AWAITING_TEST only
     when every child has reached it, COMPLETED only when every child has. BLOCKED applies
     only when no child can proceed — a single blocked child with workable siblings leaves
     the parent IN_PROGRESS, with that child named on the Blocked line below. -->
**Scope:** [scope type]
**Type:** module-addition
**Date:** YYYY-MM-DD
**Active child:** — (0/N)
**Children:** T-NNN.1 .. T-NNN.N — see Component Manifest (M5)
**Blocked:** none

<!-- RESUME HEADER ENDS HERE. Everything needed to pick this module back up is above.
     Read Part A to review the work. Read Part B only when re-deriving a decision or
     onboarding a new child ticket. -->

---

# Part A — Summary

> **Audience: technical lead / manager.** Same rules as the component ticket template:
> no file paths, no function names, no jargon, ≤25 lines total, evidenced in Part B.

## A1. What this module does

- [Business capability this module adds, in plain language.]

## A2. Why now

- [The trigger — PRD, request, dependency on another initiative.]

## A3. Shape, in short

1. [One line per component — named by what it achieves, not how it is coded.]

## A4. Impact & risk

- **Touches:** [systems / areas this module plugs into, in words]
- **Could break:** [what to watch — or "nothing existing"]
- **Not included:** [deferred to a later version + why — or "nothing"]
- **Needs a human:** [SQL to run, approvals, env vars, external accounts]

---

# Part B — Technical Detail

> Audience: whoever is decomposing or re-deriving this module. Every child ticket points
> back here instead of repeating this section — under-distilling here means every child
> ends up re-reading the source document anyway, which defeats the point of this file.
> Sections below are numbered `M` for module-level, so references from a child ticket are unambiguous.

## M1. Source

PRD / spec: [path or link] | Requested by: [name] | Date: YYYY-MM-DD

## M2. Discovery (one-time, module-level)

- **Existing subsystems this plugs into:**
- **Conventions to match:**
- **Related files / entry points:**

> Condensed findings only, same rule as the component template. Never repeated inside a
> child ticket — a child's Discovery section cites this section, it does not restate it.

## M3. Architecture Decisions

- [Decision + why — data model, key abstractions, module boundaries. This is what makes
  the children independently buildable without re-deriving the design each time.]

## M4. Cross-Component Contracts

[Interfaces, shared types, APIs that components must implement or consume. This is the
reference every child's Deviation Check (child ticket's B3) measures against — get
it right here, not discovered piecemeal later.]

## M5. Component Manifest

| Child | Component | Purpose | Files / area | Depends on | Tier bias | Status |
|-------|-----------|---------|--------------|------------|-----------|--------|
| T-NNN.1 | [name] | [one line] | `src/auth/**` | — | impl-small | TODO |
| T-NNN.2 | [name] | [one line] | `src/session/**` | T-NNN.1 | impl-mid | TODO |

**Files / area is what a child ticket's Deviation Check measures its touched files against.**

**Approving this table approves every child's plan.** Implementation on a child proceeds
without a separate gate unless its Deviation Check (component template) fails — that
re-opens approval for that child only, never blocking siblings already in flight.

## M6. Sequencing

[Foundation-first order: what must complete before what, what is safe to run in parallel.]

## M7. Module-Level Acceptance

[End-to-end scenario(s) spanning more than one component — the thing no single child's
Verification table can prove alone. Authored at plan time, run only on explicit test
request, same rule as §7. Record each outcome here; M7 is the parent's Verification table.]

| # | Tool | Case | Expected | Result |
|---|------|------|----------|--------|
| 1 | [tool] | [cross-component condition] | [exact expectation] | NOT RUN |

The parent rolls to `AWAITING_TEST` once every child is `AWAITING_TEST` or `COMPLETED`.
`/testing T-NNN` invoked on the parent ID runs these M7 cases — a child's own `/testing`
run never does. Parent `COMPLETED` requires M7 passing, or explicit developer approval to
close without them.

## M8. Non-Goals

- [Explicitly out of scope for this module's first version — inherited by every child
  unless a child ticket overrides it for a stated reason.]

## M9. Deviation Log

> One line per event. This is the sole exception to "never append" in the parent workflow
> — it is a decision log, not a status journal. Keep entries terse.

- [YYYY-MM-DD] T-NNN.x: [what changed] → [resolution, re-approved by whom]

---

**Line budget:** Part A + B, excluding M5 and M9, stays ≤120 lines. M5 (Component
Manifest) and M9 (Deviation Log) may grow with module size — that growth is expected and
does not count against the cap.
