---
name: review
description: Run a fresh-context, evidence-based review of an approved implementation diff.
---

# Review

Use after the implementation sanity gate for non-trivial, security-relevant, cross-file, or
contract-changing work. Read the active ticket, diff, interfaces, and actual verification output.
Invoke the read-only `reviewer` agent where available; otherwise follow the same contract.

Do not edit code. Return exactly the contract in `.agentic/core/review-contract.md`. Record
findings in the ticket, assign accepted fixes as new file-owned subtasks, and preserve explicit
developer acceptance for any unresolved risk.
