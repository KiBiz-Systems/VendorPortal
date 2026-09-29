---
trigger: manual
description: Knowledge-graph discovery — setup and tool reference. Load when setting up the graph or writing advanced queries.
---

# Graph Discovery — Graphify

Discovery runs against a **knowledge graph** of the codebase: nodes for files, functions,
and components; edges for calls and imports; clustered into communities. Querying it beats
scanning directories, and it surfaces relationships text search cannot — including semantic
edges between documentation concepts and the code that implements them.

Graph discovery is **required** before the plan section of a ticket is written
(`CLAUDE.md` §4). If the graph does not exist yet, building it is a setup task — not a
licence to skip discovery.

---

## Setup for a new project

**1. Install the CLI globally.** Confirm it resolves:

```
graphify --help
```

> Always invoke `graphify` directly. Do not call it through a package runner — that path
> resolves differently and fails.

**2. Install the skill for your agent platform:**

```
graphify install --platform claude
```

Supported platforms include `claude`, `windows`, `codex`, `opencode`, `aider`, `claw`,
`droid`, `trae`, `gemini`, `cursor`, `antigravity`, `hermes`, `kiro`.

Platform-specific wiring is also available where it applies — for example
`graphify claude install` (writes the CLAUDE.md section plus a PreToolUse hook),
`graphify cursor install`, `graphify gemini install`.

**3. Build the initial graph** by invoking the `/graphify` skill on the repository. The
first build is semantic and produces:

| Output | What it is |
|--------|-----------|
| `graphify-out/graph.json` | The graph — what the MCP tools query |
| `graphify-out/graph.html` | Interactive visualization; open in a browser |
| `graphify-out/GRAPH_REPORT.md` | Human-readable audit: communities, god nodes, stats |

**4. Keep it fresh.** Pick one:

```
graphify update .          # re-extract and update; no LLM needed. Run once per ticket
graphify hook install      # git hooks: auto-update on commit/checkout
graphify watch .           # rebuild continuously on change (dev loop)
graphify check-update .    # cron-safe: reports whether semantic re-extraction is pending
```

`update` handles structural drift. When it reports that semantic re-extraction is pending,
re-run the `/graphify` skill.

**5. Record the stats** in your project's `CLAUDE.md` — node/edge/community counts and the
top god nodes. It is cheap orientation for every future session.

---

## MCP tools

| Situation | Tool |
|-----------|------|
| Which files/functions relate to a feature | `query_graph` with a keyword |
| A specific function, component, or module | `get_node` by label |
| What this calls / what calls it | `get_neighbors` |
| All code in a subsystem | `get_community` with the community ID |
| The most critical shared abstractions | `god_nodes` |
| How two concepts connect | `shortest_path` |
| Orientation — node/edge/community counts | `graph_stats` |

## CLI equivalents

When the MCP server is unavailable:

```
graphify query "<question>"     # BFS traversal; --dfs, --budget N to cap tokens
graphify path "A" "B"           # shortest path between two nodes
graphify explain "X"            # plain-language account of a node and its neighbors
```

Or read `graphify-out/GRAPH_REPORT.md` directly.

---

## Protocol

1. **Before any exploration** — query the graph first. Use the returned paths and node IDs
   to target reads precisely, instead of scanning directories.
2. **Before writing or editing** — `get_neighbors` on what you are about to touch, to learn
   its callers and dependents. This is the step that prevents unintended breakage.
3. **For cross-cutting changes** — `shortest_path` from entry point to affected leaves, to
   map the full call chain before touching anything.
4. **Do not skip it for "quick" lookups.** A single query often surfaces a dependency that
   grep would have missed, and that missing dependency is what breaks the build.
5. **Condense before recording.** The ticket gets findings that affect the plan — never raw
   tool output. Raw dumps are re-read on every later access and inform nothing.

---

## Useful extras

```
graphify merge-graphs <g1> <g2>   # one cross-repo graph — useful for split-repo topologies
graphify clone <github-url>       # clone a repo and print its path for /graphify
graphify add <url>                # pull external docs into the corpus (--author, --contributor)
graphify cluster-only .           # recluster an existing graph and regenerate the report
graphify benchmark                # measure token reduction vs. reading the full corpus
graphify save-result              # save a Q&A back into graphify-out/memory for feedback
```

For a split-repo topology (see `CLAUDE.md` §9), `merge-graphs` gives you one graph spanning
all repos, so `shortest_path` can trace a call chain across the boundary.

---

## If the graph is unavailable

Report it and request guidance rather than proceeding silently. Fall back, in order:

1. CLI equivalents above
2. `graphify-out/GRAPH_REPORT.md`
3. Targeted search — and say in the ticket that discovery was done without the graph, so
   the reviewer knows the dependency analysis is weaker than usual
