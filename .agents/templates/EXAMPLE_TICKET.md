# T-042: Invoice list loads one query per row

**Status:** AWAITING_TEST
**Scope:** backend
**Type:** bug-fix
**Date:** 2025-03-11
**Current subtask:** — (all complete)
**Files:** `src/billing/invoice.service.ts`, `src/billing/invoice.model.ts`

<!-- RESUME HEADER ENDS HERE. Everything needed to pick this ticket back up is above.
     Read Part A to review the work. Read Part B only when implementing or digging in. -->

> **This is a worked example, not a template.** Copy `TICKET_TEMPLATE.md` to start a real
> ticket. This file exists to show what a finished one looks like: Part A readable without
> the code, Part B evidenced, subtasks partitioned by file, tiers actually mixed, and
> verification authored but honestly marked. It is deliberately a small, ordinary ticket —
> most tickets are.

---

# Part A — Summary

## A1. What is wrong

- Opening the invoice list is slow, and gets slower the more invoices a customer has.
- Customers with large histories occasionally see the page time out entirely.

## A2. What changes

- Loading a page of 50 invoices makes 2 database calls instead of 51.
- The page returns in roughly the same time regardless of how many invoices are shown.
- What appears on screen does not change.

## A3. How — in short

1. Fetch every customer name for the page in one call instead of one call per invoice.
2. Have the list assemble its rows from that single result.

## A4. Impact & risk

- **Touches:** the invoice list screen and the endpoint behind it.
- **Could break:** invoices whose customer record was deleted — previously blank, must stay blank.
- **Not included:** the invoice detail screen, which has the same pattern; separate ticket.
- **Needs a human:** nothing.

---

# Part B — Technical Detail

## B1. Root cause

`InvoiceService.listForCustomer` (`src/billing/invoice.service.ts:88`) maps over the invoice
rows and awaits `CustomerModel.findById` inside the loop (`:94`). One round trip per row, so
cost is linear in page size. `findById` is correct in isolation — the defect is calling it
per row rather than once per page.

## B2. Non-goals

- No change to the response shape, field names, or ordering.
- No caching layer. No new dependency.
- `getInvoiceDetail` keeps its current behavior; it is a separate ticket.
- No change to how a missing customer renders — it stays an empty name.

## B3. Discovery

- **Impacted components:** `InvoiceService`, `CustomerModel`.
- **Related files:** `src/billing/invoice.service.ts:88-101`, `src/billing/invoice.model.ts`.
- **Upstream / downstream:** `get_neighbors` on `listForCustomer` returns one caller,
  `InvoiceController.list` (`src/billing/invoice.controller.ts:31`), which passes the result
  through unchanged — so the response contract is safe as long as the shape holds.
- **Architectural constraints:** the batch query belongs in the model layer; the service
  stays framework-free and does the assembly.

## B4. Plan

Add `findByIds(ids: string[])` to `CustomerModel`, returning a `Map<string, Customer>` so
the caller gets O(1) lookup and missing ids are simply absent — which preserves today's
blank-name behavior without a branch.

Then rewrite `listForCustomer` to collect the customer ids off the invoice page, make one
`findByIds` call, and read names out of the map while mapping rows. The per-row `await`
disappears; the mapping stays synchronous.

Foundation first: `invoice.model.ts` completes before `invoice.service.ts` starts, because
the service imports the new method.

## B5. Subtasks

| # | Subtask | File(s) | Agent | Done |
|---|---------|---------|-------|------|
| 1 | Add `findByIds(ids)` returning a `Map` keyed by id; absent ids are omitted, not null | `src/billing/invoice.model.ts` | `impl-mid` | [x] |
| 2 | Replace the per-row `await` in `listForCustomer` with one `findByIds` call and map lookups | `src/billing/invoice.service.ts` | `impl-mid` | [x] |
| 3 | Drop the now-unused `CustomerModel` single-fetch import | `src/billing/invoice.service.ts` | `impl-small` | [x] |

Two waves: subtask 1 alone, then 2 and 3 — which share a file, so they go to that file's
single agent, not two agents in parallel. Each row went `[ ]` → `[~]` at dispatch (with
its agent ID on the header's `Current subtask:` line) → `[x]` once the gate was green,
the diff read, and the change committed.

*Subtask 3 is `impl-small` because it is statable as "remove line 4." Subtasks 1 and 2 need
the missing-customer invariant explained, so they are `impl-mid`. A plan where all three
said `impl-mid` would not have been tiered.*

## B6. Verification

| # | Tool | Case | Expected | Result |
|---|------|------|----------|--------|
| 1 | `UNIT_TEST_CMD` | `findByIds` with 3 ids where 1 does not exist | Map has 2 entries; the missing id is absent | NOT RUN |
| 2 | `UNIT_TEST_CMD` | `findByIds([])` | Empty map, no query issued | NOT RUN |
| 3 | `API_TEST_CMD` | `GET /invoices?customerId=X` with 50 invoices, query counter attached | Exactly 2 queries; body identical to pre-change snapshot | NOT RUN |
| 4 | `API_TEST_CMD` | Invoice whose customer row was deleted | `customerName` is `""`, status 200 | NOT RUN |

**Sanity gate** (runs during implementation, no approval needed):

- [x] `TYPECHECK_CMD` clean in affected package(s)
- [x] `LINT_CMD` clean on touched files
- [x] Every diff read by the orchestrator against its subtask's acceptance condition
- [x] Each verified subtask committed — `T-042.1`, `T-042.2`, `T-042.3` (not pushed)

## B7. Decisions & Blockers

- `findByIds` returns a `Map` rather than an array so the service does no re-sorting and
  missing customers need no special case — the key is simply absent.
- Case 3 needs the query counter the API harness already exposes; confirmed present before
  the case was written.
