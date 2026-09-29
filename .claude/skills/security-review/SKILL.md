---
name: security-review
description: Review security-sensitive changes and agent configuration using explicit trust-boundary evidence.
---

# Security Review

Trigger for authentication, authorization, payments, uploads, exports, webhooks, tenancy,
secrets, or sensitive data. Map assets, callers, input validation, authorization checks, data
storage/transit/logging, external effects, and dependency assumptions.

Use `security-reviewer` if available. Report severity, file:line evidence, attack path, impact,
and minimum remediation. Do not edit code. Record any unrun negative tests honestly.
