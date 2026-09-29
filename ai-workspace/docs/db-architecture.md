# Database Architecture

> **Scaffold — fill this in** if the project has a database. This is the schema's source of
> truth for agents. Keep it current: a plan written against a stale schema doc cannot work.
>
> Updating this file is **step 3 of the migration review flow** in
> `.agents/rules/database.md`. It is not optional.

---

## Engine

**Type:** [engine and version]
**Access layer:** [ORM, query builder, or raw client]
**Migrations:** `ai-workspace/sql/NNN_description.sql`, reviewed and executed manually by
the developer — never by the agent

---

## Conventions

- **Naming:** [table and column naming convention]
- **Primary keys:** [type and generation strategy]
- **Timestamps:** [the audit columns every table carries]
- **Soft deletes:** [used or not; if used, how every query must account for it]
- **Dates vs. timestamps:** which columns are **calendar dates** and must never be
  timezone-converted — see `.agents/rules/timezone.md`

> Date-only values (dates of birth, invoice dates, billing-period boundaries) stored as
> timestamps shift across a day boundary for half the world. Record the distinction here.

---

## Tables

### `table_name`

**Purpose:** [one line]

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| | | | | |

**Keys and indexes:** [primary, unique, foreign, and performance indexes]
**Relationships:** [what it references and what references it]
**Invariants:** [constraints the application relies on that the schema does not enforce]

*(Repeat per table.)*

---

## Relationships

```
[Diagram or indented outline of the main entity relationships.]
```

---

## Access control

[Row-level security, roles, or tenancy rules — and which of them the application relies on
rather than enforcing itself.]

---

## Known issues

- [Denormalization, legacy column, or constraint that exists only in application code]
- [Any table where wrong data is known to exist and a correction script is pending]

> When a bug has already written wrong data, the code fix alone does not repair it. Track
> the pending data correction here and in the ticket until it has actually run.
