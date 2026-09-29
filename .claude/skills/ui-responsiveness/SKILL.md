---
name: ui-responsiveness
description: Audit and fix how a UI behaves across viewport sizes — overflow, cramped or stranded layout, touch targets, breakpoint gaps. Produces a breakpoint-by-breakpoint findings table first, gets each intended visual change approved, then fixes within the project's existing design tokens.
---

# /ui-responsiveness

Frontend scope. `.agents/rules/frontend.md` governs everything else about frontend work —
this skill covers only the responsive dimension.

## Usage

```
/ui-responsiveness <screen or component>   # audit one surface
/ui-responsiveness --fix                   # audit, then fix the approved findings
```

---

## The approval problem — read this first

`CLAUDE.md` and `frontend.md` both forbid modifying existing UI design without explicit
approval. Responsiveness work **is** layout work, so it collides with that rule by nature.
The resolution is sequencing, not exemption:

1. **Audit first, always.** Produce the findings table. Change nothing.
2. **Each finding names the visual change it implies.** "Stacks to a single column below
   768px" is a design decision, not a bug fix.
3. **The developer approves the table**, then implementation proceeds — approving the ticket
   approves the visual changes listed in it.

A finding is only a defect-without-approval when the UI is **broken**: content clipped or
unreachable, horizontal scroll on the page body, overlapping interactive elements. Anything
that merely looks *better* your way needs approval like any other design change.

---

## Audit

Establish the breakpoints from the project's own config — Tailwind theme, CSS custom
properties, framework defaults, whatever the code declares. **Never import a breakpoint set
from convention.** Record them in §4; if none are declared anywhere, that finding is the
first thing to raise.

Check each surface against each declared breakpoint:

| Class | What to look for |
|---|---|
| Overflow | Horizontal body scroll · clipped text · tables and code blocks with no scroll container of their own · fixed `px` widths that exceed the viewport |
| Layout collapse | Multi-column grids that never stack · flex rows that wrap into unreadable fragments · sidebars that eat the content area |
| Stranded space | Content pinned to a narrow column on wide screens with no `max-width` intent behind it |
| Media | Images and embeds without `max-width: 100%` · missing intrinsic dimensions causing layout shift |
| Touch | Interactive targets under ~44px on coarse pointers · hover-only affordances with no tap equivalent |
| Text | Fixed viewport-unit type that becomes unreadable at the extremes · line lengths past ~75ch |
| Overlays | Modals, drawers, and menus taller than a short viewport with no internal scroll · focus escaping the overlay |

Findings go in the ticket's §4 as a compact table — surface, breakpoint, symptom, implied
change. Not screenshots, not raw CSS dumps.

---

## Fixing

- **Use the project's existing tokens, utilities, and breakpoints.** Do not introduce a new
  scale, a new custom property, or a one-off media query at a novel width. A new breakpoint
  is itself a design decision needing approval.
- Prefer intrinsic layout — `flex-wrap`, `minmax()`, `clamp()`, container queries where the
  project already uses them — over stacking more media queries onto a fragile cascade.
- Fix the container, not the child. Repeated per-element overrides are the symptom of a
  layout that is wrong one level up.
- **Partition by file.** Styles and markup for one component usually live together; one
  agent owns both. Where a shared layout primitive and its consumers both change, the
  primitive is subtask 1 and runs to completion first.
- Mechanical single-site fixes (`max-width: 100%`, a wrap utility, one token swap) are
  `impl-small`. Restructuring how a layout reflows is `impl-mid`.

---

## Verification

Responsive behavior mostly resists functional assertion, which makes it exactly the case
where a detailed browser test plan gets written and then never runs. Be honest about that:

| Change | Case |
|---|---|
| Pure CSS/token change, no logic | **Dry run** — sanity gate plus orchestrator diff read. Record it as `Dry Run` in the table, not as a test that passed. |
| Breakpoint-driven logic (a JS media-query hook, a conditional render) | Unit-test the hook or the predicate at the logic layer |
| Layout genuinely unprovable functionally | Browser check — **explicit developer approval required**, with the reason recorded in §B7 Decisions & Blockers |

Never write a browser scenario as a placeholder for verification you do not intend to run.
An accurate `NOT RUN` is worth more than an implied check that never happened.
