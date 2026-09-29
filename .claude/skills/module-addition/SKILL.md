---
name: module-addition
description: Convert a PRD or scope document into a new bounded module — one parent ticket decomposing it into components, one child ticket per component. Use for a new domain with its own data model that plugs into the existing app, not a capability inside an existing module (that's /feature-addition).
---

# /module-addition

A module is a **new bounded domain** — its own data model, its own boundary, plugged into
the existing app. If the request fits entirely inside an existing module's data model and
conventions, it is not this — use `/feature-addition` instead.

## Usage

```
/module-addition <path-to-PRD-or-scope-doc>
/module-addition <description>   # no doc — describe the module, discovery fills the gaps
```

---

## The one hard rule

**Read the source document once, carefully, right now.** The parent ticket
(`MODULE_TICKET_TEMPLATE.md`) is the last time anyone should need to open it. Anything
under-distilled into M2–M4 becomes a re-read tax paid by every child ticket downstream —
see `CLAUDE.md` §2. Precise wording, formulas, or schemas that can't be safely paraphrased
get quoted directly into the ticket, not summarized.

---

## Building the parent ticket

1. **Discovery (M2), once for the whole module** — `query_graph` for existing subsystems
   this plugs into, `god_nodes` for shared abstractions it must respect, conventions to
   match. Condensed findings only, same rule as any ticket's Discovery.
2. **Architecture Decisions (M3)** — the design choices that make every component
   independently buildable without re-deriving them: data model, key abstractions, module
   boundary.
3. **Cross-Component Contracts (M4)** — interfaces, shared types, APIs components must
   implement or consume. Get this right here — it's what every child's Deviation Check
   measures against later.
4. **Component Manifest (M5)** — one row per component: Child | Component | Purpose |
   Files / area | Depends on | Tier bias | Status. This table *is* the subtask partition at
   the module level, same principle as §5's "partition by file," one level up. The
   `Files / area` cell must name the component's actual files or area — it's what that
   child's Deviation Check measures against, so a vague or missing cell makes the check
   unenforceable.
5. **Sequencing (M6)** — foundation-first order; what parallelizes safely.
6. **Module-Level Acceptance (M7)** — the cross-component scenario(s) no single child's
   Verification table can prove alone.

Present the parent ticket for **one approval.** Approving the Component Manifest approves
every child's plan — see `CLAUDE.md` §1.

---

## Running the children

Spin up child tickets (`T-NNN.1-slug.md`, plain `TICKET_TEMPLATE.md`, `Parent:` set) in
dependency order from Sequencing (M6). **Each child runs the normal §1–§7 loop untouched —
this skill governs the handoff between children, not what happens inside one.**

Before a child's subtasks dispatch, its Deviation Check (child ticket's B3) must pass:

- Files touched fall within this component's `Files / area` cell in the Manifest (M5)
- No new cross-component contract beyond what M4 already defines
- No subtask exceeds the Manifest's tier bias for this component

**Any box fails → stop that child only.** Log it in the parent's Deviation Log (M9),
resolve, re-approve, resume. Siblings already in flight are not blocked — this is the
whole point of gating once instead of per-child.

Parent `Status:` is rolled up, never set directly: `IN_PROGRESS` while any child is active.
The parent rolls to `AWAITING_TEST` once every child is `AWAITING_TEST` or `COMPLETED`; M7
Module-Level Acceptance then runs by invoking `/testing` on the parent ID, and parent
`COMPLETED` requires M7 passing or explicit closure approval without it. The parent is
`BLOCKED` only when no child can proceed — one blocked child with workable siblings leaves
the parent `IN_PROGRESS`, with that child named on the `Blocked:` header line.

---

## Non-goals to copy into every child's brief

- Do not re-derive architecture already decided in the parent — cite it
- Do not introduce a new cross-component contract without updating the parent first
- Do not touch files outside this component's Manifest row
- Module-level integration behavior is proven by the parent's Module-Level Acceptance
  cases, not smuggled into a child's Verification table
