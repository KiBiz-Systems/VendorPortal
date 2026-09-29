# Review Contract

Use a fresh context and read-only tools. Review the approved ticket, current diff, changed
interfaces, and verification evidence. Do not edit code, expand the task, or provide generic praise.

Report only actionable evidence:

```text
REVIEW: PASS | FINDINGS | BLOCKED
FINDINGS:
- [high|medium|low] path:line — issue; impact; evidence; required action
VERIFICATION GAPS:
- missing command/test — reason
OUT-OF-SCOPE CHANGES:
- path — explanation
```

High findings block closure unless the developer explicitly accepts the risk.
