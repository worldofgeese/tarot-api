---
name: rpi-research
description: Research the codebase to understand problems before proposing solutions
context: fork
allowed-tools: Read,Glob,Grep,Bash,Agent,LSP,mcp__rpi__rpi_git_context,mcp__rpi__rpi_git_changed_files,mcp__rpi__rpi_git_sensitive_check,mcp__rpi__rpi_archive_scan,mcp__rpi__rpi_scan,mcp__rpi__rpi_scaffold,mcp__rpi__rpi_frontmatter_get,mcp__rpi__rpi_frontmatter_set,mcp__rpi__rpi_frontmatter_transition,mcp__rpi__rpi_chain,mcp__rpi__rpi_extract,mcp__rpi__rpi_extract_list_sections,mcp__rpi__rpi_verify_completeness,mcp__rpi__rpi_verify_markers,mcp__rpi__rpi_verify_spec,mcp__rpi__rpi_context_essentials,mcp__rpi__rpi_session_resume,mcp__rpi__rpi_suggest_next,mcp__rpi__rpi_archive_check_refs,mcp__rpi__rpi_archive_move,WebSearch,WebFetch
---

# Codebase Research

## Goal

Investigate the codebase conversationally to understand how things work, find patterns, and surface insights. This is the entry point: **research** → propose → plan → implement.

When insights crystallize into something actionable, suggest → `/rpi-propose` (with the research artifact path if one was saved).

## Invariants

- Always interview before investigating — ask about motivation, prior attempts, constraints, and success criteria (1-2 questions at a time, adapt based on answers)
- Reflect back a concise problem statement and get confirmation before codebase investigation
- Check for existing research artifacts on this topic — build on prior work
- Read all mentioned files fully before investigating further
- Scale investigation to the question — focused questions need minimal research; broad questions need parallel investigation across multiple areas
- Include file:line references in all findings — no vague descriptions
- Checkpoint after initial findings for broad/exploratory questions — let the user redirect
- Do not force artifact creation — save to `.rpi/research/` only when asked or clearly valuable for cross-session handoff
- If saving: scaffold a research artifact, fill in findings, and transition to active

## Principles

- Be interactive — stop interviewing when you have enough; ask more if findings raise new questions
- Facts first, opinions when warranted — present what exists before suggesting what should change
- Follow-ups welcome — append to existing research docs rather than creating new ones
