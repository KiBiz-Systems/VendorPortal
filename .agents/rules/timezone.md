---
trigger: manual
description: Timezone and date-handling policy. Load whenever the task touches dates, times, scheduling, or age calculation.
---

# Timezone Policy

Adopt this if the project handles dates at all. This bug class is silent, typechecks
cleanly, reaches production, and corrupts stored data — the fix afterwards costs far more
than the policy up front.

---

## The three rules

1. **The client declares the timezone.** Every time-dependent request carries an explicit
   timezone. Define the header name and the fallback default in `CLAUDE.md` §0, e.g.
   `x-timezone`, defaulting to a named IANA zone (never an offset — offsets don't handle DST).

2. **The server's own local time is never an input.** Not for defaults, not for "now", not
   for formatting. Server local time is an accident of deployment and will differ between a
   developer laptop, CI, and production.

3. **Store UTC. Convert at the edges.** The database holds UTC. Conversion to local time
   happens where the value enters or leaves the system, never in the middle.

---

## Where each step happens

| Layer | Responsibility |
|-------|---------------|
| Client | Sends its timezone with the request; renders stored UTC in local time |
| Handler | Extracts the timezone header, applies the documented default if absent, passes it explicitly to the service |
| Service | Converts local → UTC for storage; performs all date arithmetic in an explicit zone |
| Data | Stores UTC. No implicit conversion |

The handler must **pass the timezone explicitly downward**. A service that reaches into
request-scoped globals for it cannot be tested or reused from a job.

---

## Where this bites

Apply the policy to all of these — each one has produced a real production bug:

- Date of birth and age calculation (off-by-one ages near midnight)
- Scheduling, bookings, availability, and time windows
- Date-range filtering and reporting boundaries
- Attendance and check-in
- Renewals, billing periods, and subscription anniversaries
- Anything that computes "today", "start of month", or "end of day"

---

## Date-only values are not timestamps

A date of birth, an invoice date, or a billing period boundary is a **calendar date**, not
an instant. Storing it as a timestamp and converting it will shift it across a day boundary
for roughly half the world.

- Store calendar dates as date-only
- Return them as plain `YYYY-MM-DD`, never as a timestamp with a `Z` suffix
- Never round-trip a calendar date through a timezone conversion

---

## Scheduled jobs

Batch and cron work has no request context, so it has no client timezone. Decide the zone
**explicitly** — usually the tenant's or location's configured zone, never the server's —
and pass it in the same way a handler would.

Scheduled jobs must also respect the same business guards as the interactive path. A guard
enforced only in a request handler will be bypassed by the job that calls the service
directly.

---

## Testing

Assert against at least two zones — one behind UTC and one ahead of it. A test suite that
runs only in UTC, or only in the developer's zone, will pass while the bug ships.

Include a case that sits within a few hours of midnight in each zone; that is where
off-by-one errors live. Include a DST transition if the project's zones observe one.

---

## When it has already gone wrong

Wrong dates already in the database are not fixed by fixing the code. See
`.agents/rules/database.md` — the ticket needs both the code fix and a data-correction
script, and the ticket must say which is still pending.
