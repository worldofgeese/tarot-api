---
name: rpi-verify
description: Verify implementation against design artifacts for completeness, correctness, and coherence
allowed-tools: Read,Glob,Grep,Bash,Agent,LSP,mcp__rpi__rpi_git_context,mcp__rpi__rpi_git_changed_files,mcp__rpi__rpi_git_sensitive_check,mcp__rpi__rpi_archive_scan,mcp__rpi__rpi_scan,mcp__rpi__rpi_scaffold,mcp__rpi__rpi_frontmatter_get,mcp__rpi__rpi_frontmatter_set,mcp__rpi__rpi_frontmatter_transition,mcp__rpi__rpi_chain,mcp__rpi__rpi_extract,mcp__rpi__rpi_extract_list_sections,mcp__rpi__rpi_verify_completeness,mcp__rpi__rpi_verify_markers,mcp__rpi__rpi_verify_spec,mcp__rpi__rpi_context_essentials,mcp__rpi__rpi_session_resume,mcp__rpi__rpi_suggest_next,mcp__rpi__rpi_archive_check_refs,mcp__rpi__rpi_archive_move
---

# Verify Implementation

## Goal

Validate that an implementation matches its design artifacts across three dimensions: completeness, correctness, and coherence. Produce a severity-classified verification report in `.rpi/reviews/`. This command is purely advisory — it never blocks anything.

If no path provided, auto-detect from recent git changes. If artifacts found, announce what you're verifying.

## Invariants

- Resolve the artifact chain from the provided or detected artifact — read all linked files (plan → design → research)
- Check `.rpi/specs/` for relevant specs and get the list of changed files
- Read actual implementation files — never trust summaries or checkboxes
- **Completeness**: check all plan phases/tasks done, tests exist, all planned files created/modified, scan for TODO/FIXME/HACK markers
- **Correctness**: extract scenarios from linked specs using the verify spec tool, then verify each scenario against actual code and tests with pass/fail per scenario and file:line references; check API contracts match design, flag silent deviations
- **Coherence**: verify naming conventions, error handling, code organization follow existing patterns; check for unnecessary dependencies
- Classify each finding as: blocker (must fix), warning (should fix), or note (consider fixing)
- Scaffold a verification report, fill in findings grouped by dimension and severity
- Present summary: overall status, counts by severity, report path; list blockers directly

## Principles

- Be specific — every finding includes a file:line reference
- Severity matters — distinguish genuine blockers from style nits
- Scale effort — small implementations get lighter verification; large ones get thorough checks
- Re-runnable — each run produces a new report file
