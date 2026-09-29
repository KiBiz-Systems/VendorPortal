---
trigger: manual
description: Coding standards. Load for any implementation work.
---

# Coding Guidelines

Language- and framework-agnostic. Where a project convention already exists in the
surrounding code, **the surrounding code wins** — match it rather than importing a
preference from here.

---

## Core principles

- Write clean, readable, maintainable code
- Prefer simplicity over cleverness
- Follow consistent naming and structure
- Avoid unnecessary abstractions — indirection added "for later" is a cost paid now
- Keep logic modular and reusable
- Maintain strict separation of concerns
- Do not introduce breaking changes unless explicitly instructed

**Final principle:** code should be understandable by another developer without explanation.
If something feels complex, simplify it. Always prioritize clarity over cleverness.

---

## Writing code that matches its surroundings

An agent's output should be indistinguishable from the existing codebase. Before writing,
read enough of the target file to match:

- naming style and casing conventions
- comment density — do not add explanatory comments to a file that has none
- error-handling idiom
- import ordering and grouping
- test style, if you are writing tests

A technically correct change in a foreign style is a review burden.

---

## General rules

- Never hardcode credentials, API keys, URLs, or environment-specific config — read them
  from environment/config
- Do not leave unused code, imports, or variables behind
- Do not log sensitive data
- Do not commit debug logging
- Delete dead code you created; leave unrelated dead code alone unless cleanup is in scope

---

## Naming

| Kind | Convention |
|------|-----------|
| Variables | Project convention; meaningful names. Avoid `data`, `temp`, `val`, `obj` |
| Functions | Describe the action — `getUserById`, `calculateTotalAmount` |
| Constants | Project convention for constants (commonly upper snake case) |
| Files | Project convention, applied consistently |
| Booleans | Read as a predicate — `isActive`, `hasPermission`, `canSubmit` |

---

## File and function structure

- Keep files small and focused; one responsibility per file
- Avoid mixing unrelated logic in one file
- A function that needs a paragraph to explain probably does two things
- Prefer early returns over deep nesting

---

## Error handling

- Handle errors gracefully; never swallow them silently
- Do not expose internal errors, stack traces, or implementation detail to clients
- Use one consistent error response shape across the project
- Handle async errors explicitly — no unhandled rejections or ignored failures
- Fail loudly in development, safely in production

---

## API design

- Clear, consistent, predictable naming
- Follow the project's established convention (REST, RPC, GraphQL) rather than mixing
- Validate all inputs at the boundary
- Return structured, consistently shaped responses
- Version or extend rather than silently changing a contract

---

## Validation

- Validate at the boundary — never trust client input
- Client-side validation is for UX; it is never the security boundary
- Server-side validation is mandatory even when the client already validated

---

## Security

- Never trust user input; validate and sanitize
- Never expose sensitive data in responses, logs, or errors
- Secrets come from environment/config, never source
- Apply least privilege to data access
- Do not roll your own crypto or auth primitives

---

## Testability

- Write code that is easy to test: pure where possible, injected dependencies, no hidden
  global state
- Avoid tight coupling to frameworks in business logic — logic that requires a running
  server to test will not get tested
- If something is hard to test, that is usually a design signal, not a testing problem

---

## Performance

- Avoid unnecessary computation and redundant round trips
- Do not prematurely optimize; measure before optimizing
- Do watch for the accidental N+1 and the accidental full-collection scan — those are
  design errors, not optimizations

---

## Multi-package rules

- Do not mix responsibilities across package boundaries
- Shared logic must be deliberately designed and placed, not duplicated opportunistically
- A change in one package must not silently break another — if the contract moves, both
  sides are in the plan
