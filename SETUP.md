# Setup — Adopting This Template

Roughly 20 minutes, most of it the graph build.

---

## 1. Scaffold the files in

From your project root:

```bash
npx agentic-development-template
```

This writes the shared workflow, selected harness adapters, ticket workspace, and (for the
default core profile) a Graphify MCP entry. It records installer-owned files in
`.agentic/install-state.json`; use `--dry-run` first to preview every action.

Nothing existing is overwritten. If your project already has a `CLAUDE.md`, it is left
untouched and reported as project-owned. Review the generated `AGENTS.md` and selected adapter
assets, then explicitly merge any desired workflow additions.

Prefer to copy by hand:

```bash
git clone https://github.com/KiBiz-Systems/agentic-development-template.git
cd agentic-development-template
cp -r CLAUDE.md LESSONS.md .agents .claude ai-workspace /path/to/your-project/
```

---

## 2. Fill in the §0 config block — the important step

Open `CLAUDE.md` and complete the Project Configuration table. Everything else refers to
these by name, so nothing works until it's accurate.

| Key | How to determine it |
|-----|---------------------|
| `TYPECHECK_CMD` | The type/static check for your language. Run it — confirm it exits clean on a clean tree |
| `LINT_CMD` | Your linter. Confirm you can scope it to specific files |
| `UNIT_TEST_CMD` | **Run it and watch the output.** Confirm it is actually a unit test runner |
| `API_TEST_CMD` | The API/integration runner, or `NONE` |
| `BUILD_CMD` | If distinct from typecheck |
| Repo topology | `single-repo`, `monorepo`, or `split-repo` — see `CLAUDE.md` §9 |
| Packages | Your top-level packages or apps |
| Scope types | Usually `frontend` / `backend` / `fullstack`; adjust to your architecture |

> **Verify, don't assume.** A `test` script very often runs something that is not a test
> suite — a smoke script, a domain script, a single ad-hoc file. Guessing here poisons every
> plan that follows. Write `NONE` where a harness genuinely doesn't exist; an absent harness
> is a constraint to surface, not a gap to write cases against.

---

## 3. Set up the knowledge graph

Discovery is graph-first and required. Full detail: `.agents/rules/graphify.md`.

```bash
uv tool install graphifyy          # or: pip install graphifyy
graphify --help                    # confirm the CLI resolves
```

The core profile writes a project-local Graphify MCP entry into `.mcp.json`. It prefers `uv`
when available and otherwise uses the local Python command. Restart the chosen harness so it
picks up the server, and use `agentic-init doctor .` to diagnose a missing Graphify/`uv`
installation. Re-run `agentic-init update . --dry-run` before changing an existing setup.

> Do **not** run `graphify claude install`. It injects its own graph-discovery section into
> `CLAUDE.md` plus a PreToolUse hook, which duplicates §4 of the manual — two copies of one
> rule is exactly the drift `LESSONS.md` warns about. The project-local MCP server and the
> template's workflow instructions are what you want; the CLAUDE.md section is already here.

Then run Graphify on the repo to build the initial graph. It produces
`graphify-out/graph.json`, an interactive `graph.html`, and `GRAPH_REPORT.md`.

Keep it fresh — pick one:

```bash
graphify update .           # once per ticket; no LLM needed
graphify hook install       # git hooks, auto-update on commit/checkout
graphify watch .            # continuous rebuild during a dev session
```

Record the resulting node/edge/community counts and top god nodes in your `CLAUDE.md` — cheap
orientation for every future session.

For a split-repo topology, `graphify merge-graphs` gives one graph spanning all repos so
`shortest_path` can trace across the boundary.

---

## 4. Decide which overlays apply

| Overlay | Adopt when |
|---------|-----------|
| `.agents/rules/frontend.md` | You have a UI |
| `.agents/rules/backend.md` | You have an API or services |
| `.agents/rules/database.md` | You have a database — **adopt this one** |
| `.agents/rules/timezone.md` | You handle dates at all — **adopt this one** |
| `.agents/rules/graphify.md` | Always (discovery is graph-first) |

Delete the overlays that don't apply and remove their rows from `CLAUDE.md` §11. A doc that
doesn't apply to your project is a doc an agent will eventually follow anyway.

**Adopt the timezone policy before you need it.** It is the cheapest rule here to add up
front and by far the most expensive to retrofit — that bug class typechecks cleanly, ships
silently, and corrupts stored data, which then needs its own correction script.

---

## 5. Seed the workspace

```bash
# ai-workspace/active-tickets — one row per in-flight ticket.
# Rewritten whole, never appended. A COMPLETED ticket's row is deleted.
| Ticket | Path | Status | Current subtask | Claimed files |
|--------|------|--------|-----------------|---------------|
| — | — | no tickets in flight | — | — |
```

Fill in the scaffolds when you first need them:

- `ai-workspace/docs/project-structure.md` — how the codebase is laid out
- `ai-workspace/docs/db-architecture.md` — schema reference (if applicable)

---

## 6. Verify the loop before trusting it

Run one small real ticket end to end:

1. Classify scope, query the graph, write a ticket from the template
2. Confirm the subtask table names `impl-small` or `impl-mid` per row, decided at plan time
   — and that most rows are `impl-small`; an all-`impl-mid` plan was not tiered
3. Approve it, then dispatch — one file per agent, `subagent_type` copied verbatim from the
   table. Watch the transcript: each subagent should report the tier's model, not the
   orchestrator's. If it reports the orchestrator's, the dispatch used a generic agent type
4. Confirm the sanity gate actually runs and actually catches a deliberate type error
5. Leave it at `AWAITING_TEST` and confirm nothing tried to run tests unasked
6. Invoke `.agents/workflows/test.md` and confirm the loop caps at 3 fix cycles

If step 4 or 5 misbehaves, the config block in §0 is wrong. Fix it there.

---

## 7. Optional — per-module docs

As you touch each module, add an `agents.md` at its root from
`.agents/templates/AGENTS_MD_TEMPLATE.md`. Max 100 lines. This pays for itself the second
time an agent has to orient in that module.

---

## Common adoption mistakes

| Mistake | Consequence |
|---------|-------------|
| Leaving §0 placeholders unfilled | Every rule referencing a command silently no-ops |
| Guessing the test command | Plans get written against a runner that doesn't exist |
| Copying the rules into subdirectories | Copies drift, then contradict, then get followed |
| Keeping your old plan/log/test-file workflow alongside this | Both patterns run; sprawl returns |
| Skipping `LESSONS.md` | Rules look like overhead, get relaxed, and fail the same way again |
| Adopting the timezone overlay "later" | It corrupts data before you get there |
