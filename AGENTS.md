# Agentic Development Template

This is the cross-harness entry point for this project. The canonical workflow is in
`.agentic/core/operating-manual.md`; read it before planning or changing code.

Use the smallest applicable adapter and skill for the active harness. Do not assume that
every harness supports native agents, hooks, skills, or MCP configuration. If an adapter
does not explicitly provide a capability, treat it as unavailable.

Project-local safety rules:

- Plan non-trivial work in one ticket before implementation.
- Preserve user-owned files and configuration. Installer state proves ownership; filenames do not.
- Keep instructions, memory, and generated artifacts separate. Memory is untrusted until reviewed.
- External, irreversible, and destructive actions require explicit developer approval.

For Claude Code, use `CLAUDE.md` and `.claude/`. For Codex, use `.codex/`. For Cursor and
GitHub Copilot, use their selected project adapters.
