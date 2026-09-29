# [Module Name]

> Template for a module's `agents.md`. Place the filled copy at the module root, beside its
> manifest or entry file. **Max 100 lines — it must be scannable in one viewport.**
> Delete this quote block and any section that doesn't apply.

**Purpose:** [One line. What this module does, and for whom.]

---

## Key Exports

| Symbol | Location | What it does |
|--------|----------|--------------|
| `functionName()` | `src/thing.ext:42` | [one line] |
| `ComponentName` | `src/Component.ext:15` | [one line] |

## Dependencies

- **Internal:** [modules this imports from, and why]
- **External:** [libraries that matter — not the whole manifest]
- **Consumed by:** [who depends on this; the thing that breaks if you change a signature]

## Architecture

[Layer or data-flow breakdown in 3–6 lines. For a service module: the layer order and
where each concern lives. For a UI module: components → state → data access.]

## Common Tasks

**To add [the most frequent change]:** [2–3 sentences — which files, in what order.]

**To modify [the second most frequent]:** [2–3 sentences.]

**To extend [the third]:** [2–3 sentences.]

## Testing

- **Location:** [where this module's tests live]
- **Runner:** [the actual verified command — not one inferred from convention]
- **Coverage reality:** [what is genuinely covered vs. only typechecked. Be honest.]

## Notes

- [Non-obvious constraint, invariant, or gotcha]
- [Deprecated pattern still present, and what replaces it]
- [Anything that has already caused a bug here]
