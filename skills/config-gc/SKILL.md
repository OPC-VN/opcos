---
name: config-gc
description: >
  Safe garbage collection for AI-agent configuration across tool config dirs
  (.claude / .codex / .gemini / your OpcOS repo): duplicate or orphaned
  skills/agents, dead memory files, unused MCP servers, bloated caches,
  .bak/.disabled leftovers. Triggers on: "clean up config", "config gc", "remove
  duplicate skills", "clean .claude/.codex", "scan for bloat", or as a periodic
  sweep. Human-in-loop, soft-delete first, logged — this skill implements the core
  rules' anti-junk principle at the config layer. Concept distilled from the
  everything-claude-code project (MIT); tailored for a multi-tool OpcOS setup.
---

# config-gc — garbage-collect agent config (safely)

Purpose: distributing skills and agents across 3–4 tools inevitably accumulates
duplicates and orphans. This skill cleans them **under control**, without ever
deleting something still in use.

## Hard rules (safety first)

- **Human-in-loop**: list candidates + reasons → wait for approval → only then act.
  Never delete autonomously.
- **Multi-step soft-delete**: `rename → *.disabled` (inert but present) → move to
  `_gc_trash/` → hard-delete ONLY after the human confirms and a test run shows
  nothing broke.
- **Cap ~20 candidates per run** so the review stays humanly possible; append-only
  log at `_gc_trash/gc_log.md` (date, path, reason, action).
- **Never touch the source**: do not delete skills/agents inside your OpcOS repo's
  `plugins/*` (the source of truth) — only clean the INSTALLED / COPIED / JUNCTIONED
  instances in each tool.

## Scan channels

1. **Duplicate skills/agents**: a standalone copy in a tool's skills dir that
   **already exists in an OpcOS plugin** → redundant shadow of the plugin version.
   Candidate for removal once the plugin is confirmed active. (Diff against
   `plugins/*/skills` + your component index.)
2. **Orphans**: skills/agents no longer in any marketplace and never invoked;
   junctions whose target has been deleted (broken links).
3. **Dead memory**: files in the agent memory directory that the memory index
   doesn't reference, or whose content is outdated/wrong.
4. **Unused MCP servers**: declared in config but never used.
5. **Cache/junk**: bloated caches, old `*.bak` files, expired `_gc_trash/` content,
   forgotten scratch files.

## Procedure (each run)

1. **Scan** the channels → collect candidates (cap 20); for each record: path, type,
   reason, and "safe to remove because…".
2. **Report + Gate**: present the table for human review (keep / disable / trash).
3. **Soft-delete**: approved items → `.disabled` or move to `_gc_trash/`; log to
   `gc_log.md`.
4. **Verify**: restart the tool / run a quick session → confirm no capability in
   active use was lost.
5. **Purge** (a later run): hard-delete items in `_gc_trash/` that have passed the
   safety window.

## Machine-specific notes (adapt to your setup)

- Know your **vendored** exceptions before scanning: some toolkits legitimately
  live as real directories in a tool's skills folder (path-bound installs) — those
  are KEEP, not duplicates.
- Third-party caches that merely mirror external content can be dropped if nothing
  reads them.
- Never GC: your OpcOS repo itself, standalone tools other configs depend on, or
  any file your rules mark as protected.
