# T-029: Orders "PendingDocs" filter tab

**Status:** AWAITING_TEST
**Scope:** fullstack
**Type:** feature-addition
**Date:** 2026-10-06
**Current subtask:** — (all subtasks done; awaiting manual test)
**Files:** `services/filemakerService.ts`, `app/admin/(protected)/orders/page.tsx`, `app/dashboard/orders/page.tsx`

---

# Part A — Summary

## A1. What is wrong

- There is no way to see which purchase orders still have documents that are missing or not yet approved.
- The existing "AP Pending" tab is an accounting status and does not answer that question.

## A2. What changes

- A new "PendingDocs" tab appears next to "AP Pending" on the admin and vendor Orders screens.
- It lists every order whose documents still need attention, in any status except Closed.
- The vendor screen shows only that vendor's orders; the admin screen shows all vendors.
- The tab uses the same paging as the other tabs. Search is not combined with it, as with the other tabs.

## A3. How — in short

1. Teach the order lookup to filter on the FileMaker "needs attention" flag.
2. Add the tab to the admin Orders screen.
3. Add the tab to the vendor Orders screen.

## A4. Impact & risk

- **Touches:** admin and vendor Orders lists only.
- **Could break:** the other tabs, if the new filter leaks into them (guarded by one case per tab).
- **Not included:** a visible indicator on each row; the flag itself (already built in FileMaker).
- **Needs a human:** confirm the flag field is on the layout the Orders list reads from (see B7).

---

# Part B — Technical Detail

## B1. Root cause

Not a defect — new capability. The flag `IsDocNeedAttention` is computed in FileMaker (1 when the
PO is not Closed and any document is missing or unapproved). The portal never queries it.

## B2. Non-goals

- No Google Drive calls; approval state comes only from the FileMaker flag.
- No change to the existing All / Open / Closed / AP Pending behavior.
- No row-level badge, no new columns, no change to existing UI design.
- No change to FileMaker schema or the flag calc (owned by the developer).
- No change to dashboard summary counts.

## B3. Discovery

- **Impacted components:** `getVendorPOs` (`services/filemakerService.ts:440`) and `getAllPOs`
  (`:1133`) build the `_find` query; both add `Status == "<tab>"` when `options.status` is set
  and not "All". `getAllPOsWithVendorNames` (`:1333`) wraps `getAllPOs`.
- **Related files:** `app/api/orders/route.ts` and `app/api/admin/orders/route.ts` pass `status`
  through verbatim (no change). `app/dashboard/dashboard-data-context.tsx:197` forwards `status`
  as a query param (no change). Tab lists: `app/dashboard/orders/page.tsx:9`,
  `app/admin/(protected)/orders/page.tsx:8`.
- **Dependencies:** both list functions read layout `Web_PO` (`config/filemaker.ts:10`).
- **Constraints:** the flag must be a stored, indexed field to be searchable via the Data API.

## B4. Plan

In both list functions, when `options.status === "PendingDocs"`, set `IsDocNeedAttention: "==1"`
and do **not** set `Status`. Define the sentinel once as an exported constant in
`filemakerService.ts` so the query code reads clearly. Add `"PendingDocs"` to `statusTabs` in
both pages; the existing click handler already forwards the tab string as `status`.
Search combined with a tab already ignores the tab (`status: trimmedSearch ? undefined : ...`),
so no extra handling.

## B5. Subtasks

| # | Subtask | File(s) | Agent | Done |
|---|---------|---------|-------|------|
| 1 | Handle "PendingDocs" status in `getVendorPOs` and `getAllPOs` | `services/filemakerService.ts` | `impl-mid` | [x] |
| 2 | Add "PendingDocs" to `statusTabs` (admin) | `app/admin/(protected)/orders/page.tsx` | `impl-small` | [x] |
| 3 | Add "PendingDocs" to `statusTabs` (vendor) | `app/dashboard/orders/page.tsx` | `impl-small` | [x] |

Subtask 1 runs first (foundation); 2 and 3 are disjoint files and may run together.

## B6. Verification

> `UNIT_TEST_CMD` / `API_TEST_CMD`: no test script in `package.json` — none wired. Cases below
> are manual/dry-run and stay NOT RUN until requested.

| # | Tool | Case | Expected | Result |
|---|------|------|----------|--------|
| 1 | Diff read | `status="PendingDocs"` query in both functions | `IsDocNeedAttention: "==1"`, no `Status` key | NOT RUN |
| 2 | Diff read | `status="Open"` / `"Closed"` / `"AP Pending"` | unchanged `Status == ...` query | NOT RUN |
| 3 | Manual (admin) | Click PendingDocs | only POs with flag = 1, across vendors | NOT RUN |
| 4 | Manual (vendor) | Click PendingDocs | only that vendor's flagged POs | NOT RUN |

**Sanity gate:**

- [ ] `npx tsc --noEmit` clean
- [ ] `npx eslint <touched files>` clean
- [ ] Every diff read by the orchestrator against its subtask's acceptance condition
- [ ] Each verified subtask committed as `T-029.S — <what it achieved>` (not pushed)

## B7. Decisions & Blockers

- Tab label: **PendingDocs** (user's choice); Closed excluded by the FileMaker calc, all other
  statuses (incl. Voided) are evaluated by it.
- Resolved: user confirmed `IsDocNeedAttention` is on layout `Web_PO` (the layout the Orders
  list reads). Plan approved 2026-10-06.
- §0 of CLAUDE.md is unfilled; gate commands above were inferred from `package.json`
  (`lint` = `eslint`; no typecheck script). Confirm on first run.
