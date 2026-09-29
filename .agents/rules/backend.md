---
trigger: manual
description: Backend-scope rules. Load when the task affects APIs, services, data access, or business logic.
---

# Backend Rules

Framework-agnostic. Where the project's existing patterns differ, match the project.

---

## Layered architecture (mandatory)

```
Transport  →  Handler  →  Service  →  Data
 (routes)   (controller)            (model/repo)
```

| Layer | Does | Must not |
|-------|------|----------|
| **Transport** | Define endpoints, attach middleware and handlers | Contain logic |
| **Handler** | Parse and validate input, map to service calls, shape the response | Contain business logic or query the database |
| **Service** | Business logic; reusable and independently callable | Depend on the web framework or touch request/response objects |
| **Data** | Queries and persistence | Contain business logic |

**Framework-free services are the load-bearing rule here.** A service that imports the web
framework cannot be tested without a server, so it will not be tested. It also cannot be
reused from a job, a script, or a scheduled task.

Cross-layer shortcuts are architecture changes and need explicit approval.

---

## Handlers

- Parse and validate every input at this boundary
- Extract cross-cutting request context (auth identity, locale, timezone, request ID) here
  and pass it explicitly downward — services must not reach back into request globals
- Map service results and errors to transport-appropriate responses
- No business logic, no queries

---

## Services

- All business logic lives here
- Framework-free and independently callable
- Receive everything they need as explicit arguments
- Return domain results, not transport responses
- Where the project has a timezone policy, services perform the conversion — see
  `.agents/rules/timezone.md`

---

## Data layer

- Queries and persistence only
- No business rules embedded in queries
- Parameterize everything; never build queries by string concatenation
- Beware the accidental N+1 and the accidental unbounded scan

---

## API contracts

Every created, updated, or modified endpoint is documented in `ai-workspace/docs/api/NNN_description.md`:

- request body
- path params
- query params
- headers (including any required context headers)
- response shape, success and error
- validation rules
- flow notes where the behavior is non-obvious

**Backend API changes are never left undocumented.** A contract that exists only in code is
a contract the frontend will guess at.

Changing an existing contract is a breaking change: both sides go in the plan, or the change
is additive and versioned.

---

## Idempotency and side effects

- Anything that charges, sends, or mutates external state needs an explicit
  idempotency story — retries and duplicate deliveries happen
- Scheduled and batch jobs must respect the same guards as the interactive path. A guard
  enforced only in the request handler will be bypassed by the job that calls the service
  directly
- Log enough to reconstruct what happened, without logging sensitive data

---

## Database

Never perform CRUD against a real database. See `.agents/rules/database.md`.

---

## Testing

Prove behavior at the lowest layer that can prove it:

```
pure function  →  service  →  API  →  end-to-end (last resort)
```

Service-level tests are the highest-value tier here — framework-free logic is cheap to test
and that is exactly where the business rules live.

**Confirm the harness exists before planning cases against it.** If the project's config
block records `NONE` for the API test command, wiring one is its own approved task — do not
write test cases against a runner that is not there.
