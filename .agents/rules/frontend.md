---
trigger: manual
description: Frontend-scope rules. Load when the task affects UI, client-side logic, or rendering.
---

# Frontend Rules

Framework-agnostic. Where the project's existing patterns differ, match the project.

---

## Hard rule

**Never modify existing UI design** — spacing, colour, typography, layout, copy, or
component structure — unless the developer explicitly asks or approves it. A visual change
nobody requested is a regression even when it looks better.

If a fix requires a visual change, say so in the ticket and get approval before making it.

---

## Scope hygiene

- Inspect only what the task needs
- Do not make backend changes unless they are in the approved plan
- Do not assume backend behavior — read the API contract; if it is ambiguous, stop and ask
- Frontend assumptions must match documented backend behavior, not hoped-for behavior

---

## Components

- Keep components small and reusable
- Avoid deep nesting
- Separate presentation from logic where the project's conventions allow
- One component per file unless the project convention says otherwise

---

## State

- Keep state minimal — derive rather than duplicate
- Never store the same truth in two places
- Avoid unnecessary re-renders; be deliberate about what triggers an update
- Lift state only as far as it genuinely needs to go

---

## Data access

- Centralize API calls in a dedicated service/data layer
- Do not scatter fetch logic through UI components
- Handle loading, empty, and error states explicitly — all three, every time
- Never let a failed request leave the UI in an indeterminate state

---

## Validation

- Validate inputs before submitting
- Client validation is UX, not security — the server validates regardless
- Surface validation errors next to the field that caused them

---

## Framework correctness

Whatever the framework, respect its rules about conditional and ordered execution — hooks,
lifecycle, reactive scopes. Violations of these are a leading cause of hard-to-diagnose
runtime bugs, and they typecheck cleanly.

Produce valid markup. Invalid nesting causes hydration and accessibility failures that
surface far from their cause.

---

## Accessibility

- Interactive elements must be reachable and operable by keyboard
- Every input has an associated label
- Do not convey meaning by colour alone
- Preserve focus behavior in dialogs and overlays

---

## Testing

Prove behavior at the lowest layer that can prove it:

```
pure function  →  state/logic unit  →  component  →  browser (last resort)
```

Browser/E2E tests require explicit developer approval and a reason the behavior cannot be
asserted functionally. In practice, detailed browser test plans get written and then never
run — a functional assertion that actually executes is worth more than an E2E scenario that
does not.

Confirm the test runner is genuinely a test runner before planning cases against it.
