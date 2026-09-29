---
name: build-fix
description: Diagnose and minimally repair a confirmed build, typecheck, or lint failure.
---

# Build Fix

Capture the exact command and output first. Determine whether the failure came from this task,
pre-existing code, configuration, or the environment. Assign only the narrow repair to the
`build-fixer` agent. Re-run the same scoped command and record the result; never suppress a
failure with broad ignores or `--no-verify`.
