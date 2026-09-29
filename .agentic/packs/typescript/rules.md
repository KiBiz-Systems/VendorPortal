# TypeScript Pack

Load this optional pack only for TypeScript/JavaScript projects.

- Keep compiler strictness and lint configuration as project-owned policy; do not weaken them to pass a task.
- Prefer explicit boundary validation and typed domain values over assertion casts.
- Avoid `any`, unchecked JSON, and non-null assertions unless surrounding project conventions prove the invariant.
- Keep browser-only, Node-only, and shared code separated according to the project topology.
- Verify changed public types at their callers, not only at their declaration.
