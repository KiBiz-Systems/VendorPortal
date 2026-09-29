---
name: feature-addition
description: Add a net-new capability inside an existing module's boundary — not a new bounded domain (that's /module-addition), not a change to something that already works (that's /enhancement), not a correction (that's /bug-fix).
---

# /feature-addition

A feature is net-new capability that fits inside an existing module's existing data model
and conventions. Three adjacent-but-different cases:

| If instead... | Use |
|---|---|
| It needs its own data model / bounded domain | `/module-addition` |
| It changes what an existing capability does | `/enhancement` |
| It corrects behavior that violates an existing spec | `/bug-fix` |

## Usage

```
/feature-addition <description>
```

---

## Discovery — find the convention before writing the plan

The main risk on a feature ticket isn't technical difficulty, it's **inventing a new
pattern where an existing one already fits.**

1. `query_graph` for the module this plugs into.
2. `get_neighbors` on the nearest existing feature that does something structurally
   similar (the sibling endpoint, the sibling component) — that sibling's shape is the
   convention to match, not a fresh design.
3. If nothing similar exists inside the module, say so explicitly in Discovery (B3) — that
   absence is itself a finding, not a gap to quietly fill with a new pattern.

---

## Planning

- Prefer extending an existing structure over introducing a new one. A genuinely new
  pattern inside an existing module is a signal to re-check whether this is actually
  `module-addition` scope creep — flag it rather than plowing ahead.
- Tier per the normal test (`CLAUDE.md` §5): if the shape is copied from a sibling almost
  verbatim, it's `impl-small`; if the sibling's pattern doesn't quite fit and needs
  judgment to adapt, it's `impl-mid`.

---

## Non-goals to copy into every brief

- No refactor of surrounding code "to make room" — that's a separate `/refactor` ticket
- No new architectural pattern when an existing one in the module already fits
- No touching unrelated existing features

---

## Verification

New capability needs new cases proving it exists, at the lowest layer that can prove it
(`CLAUDE.md` §7). If the feature touches a shared component or shared data path, add one
regression case proving existing behavior is unchanged.
