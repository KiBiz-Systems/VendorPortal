---
trigger: manual
description: Database safety. Load when the task involves schema or data changes.
---

# Database Safety

## The hard rule

**The agent must never perform CRUD against a real database.** Not creating, not reading
production data, not updating, not deleting — including "just to check."

This holds for every tool path: an ORM, a raw client, a migration runner, an MCP database
tool, a psql/mysql shell, or a one-off script. The absence of an obvious guardrail is not
permission.

---

## Schema changes — the review flow

1. **Write the SQL** to `ai-workspace/sql/NNN_description.sql`, sequentially numbered
2. **Request the developer review and execute it manually**
3. **Update** `ai-workspace/docs/db-architecture.md` to reflect the new structure
4. Record in the ticket that execution is pending — the ticket cannot close on the
   assumption that someone ran it

Example: `ai-workspace/sql/007_add_user_phone_number.sql`

### What a migration script must contain

- The forward change, explicitly
- A rollback path, or an explicit note that it is irreversible and why
- Any required backfill, as a separate clearly-marked statement
- A comment naming the ticket it belongs to

Never write a destructive statement without a `WHERE` clause you have reasoned about out
loud in the ticket.

---

## Data corrections are a separate deliverable

**This is the lesson that costs the most when missed.** When a bug has already written wrong
data, fixing the code does not fix the records. Shipping only the code fix looks like
success and leaves live customers on corrupted state.

A bug that has corrupted stored data needs **two** things in the ticket:

1. The code fix that stops new bad writes
2. A data-correction script that repairs existing rows

Both go through the review flow above. State clearly, in the ticket, which one is still
pending — and if the correction must run before or after a deployment, say which.

---

## Reading data

- Never read production data
- Use fixtures, seeds, or a local/disposable database
- If a diagnosis genuinely requires production state, ask the developer to run a specific,
  narrow, read-only query and share the result — do not run it yourself
- Never paste production data into a ticket, a doc, or a commit

---

## Documentation

`ai-workspace/docs/db-architecture.md` is the schema's source of truth for agents. Keep it
current — an agent planning against a stale schema doc will produce a plan that cannot work.

Record for each table: purpose, columns with types and nullability, keys and indexes,
relationships, and any non-obvious constraint or invariant.
