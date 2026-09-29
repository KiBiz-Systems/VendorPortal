# Project Structure

> **Scaffold — fill this in.** Loaded when an agent needs to know where things live.
> Keep it current: an agent planning against a stale structure doc produces a plan that
> cannot work. Aim for accuracy over completeness — a short true doc beats a long stale one.

---

## Topology

**Type:** `single-repo` | `monorepo` | `split-repo` *(see `CLAUDE.md` §9)*

| Package | Path | Purpose | Remote / branch |
|---------|------|---------|-----------------|
| | | | |

*(For split-repo: note that each package is its own git repo — `cd` in before any git
command, and never commit across packages from the parent.)*

---

## Layout

```
[Directory tree, 2–3 levels deep. Only what an agent needs to navigate.]
```

---

## Where things live

| Concern | Location |
|---------|----------|
| Entry point(s) | |
| Routing / endpoints | |
| Business logic | |
| Data access | |
| Shared utilities | |
| Configuration | |
| Tests | |
| Static assets | |

---

## Commands

Mirror these from the `CLAUDE.md` §0 config block, per package. **Verified, not assumed.**

| Package | Typecheck | Lint | Unit test | API test | Build | Dev |
|---------|-----------|------|-----------|----------|-------|-----|
| | | | | | | |

> Note any command whose name misleads — a `test` script that is actually a smoke or domain
> script, for instance. That surprise costs a plan every time it goes unrecorded.

---

## Conventions

- **Naming:** [file, component, and module naming conventions]
- **Imports:** [aliases, ordering, barrel-file policy]
- **Layer order:** [e.g. `Route → Controller → Service → Model`, and what may skip a layer]
- **Error handling:** [the project's standard error shape and where it is applied]
- **State / data flow:** [how state is managed and where data access is centralized]

---

## Modules

Modules with an `agents.md` (see `.agents/templates/AGENTS_MD_TEMPLATE.md`):

| Module | Path | `agents.md` |
|--------|------|-------------|
| | | ☐ |

---

## Constraints and gotchas

- [Non-obvious invariant an agent would otherwise break]
- [Deprecated pattern still present, and what replaces it]
- [Anything that has already caused a production bug]
