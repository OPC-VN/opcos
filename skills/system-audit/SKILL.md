---
name: system-audit
description: >
  Whole-machine SCAN + REORGANIZE procedure for the agent system: inventory every
  installed repo/skill/MCP/tool, diff against the registry, detect duplicates,
  leftovers, and drift, clean up safely (soft-delete + human gate), and ensure
  everything sits in its correct place per the 3-branch storage law. Triggers on:
  "scan the machine", "what's installed", "audit the agent system", "reorganize
  skills", "check registry drift", "deep clean", "what's redundant here"; or
  PERIODICALLY every 1–2 months / after a burst of installs. Detailed removal of
  config-level junk is handled by config-gc; installing new things by adopt-repo.
---

# system-audit — scan the machine & restore the standard state

**Goal.** After a period of installing and extending, return the machine to its
standard state: every component (1) has an entry in `registry.json`, (2) sits in the
right place per the **3-branch storage law**, (3) has no duplicates or dead weight,
(4) junk is removed **safely, behind a human gate**.

## Hard rules

- **Read-only until the GATE.** Move or delete nothing before the human approves
  the list.
- **Soft-delete, never hard-delete:** MOVE to `~/.trash-cleanup/<YYYY-MM-DD>/<area>/`,
  keep 30 days; drop the cleanup script into the trash folder as the record. Touch a
  git repo only after verifying a backup (bundle or remote) — and verify
  `git bundle verify` by **exit code**, not by its noisy output streams.
- **Never read secret files** (.env, credentials, tokens) — judge by file NAME and
  mtime only.
- **UNSURE = HOLD.** Anything you're not certain about (possibly used by another
  process, a model store, a harness shim) → keep it and ask; don't guess. Real-world
  near-misses: a "seemingly idle" local LLM store that was actively used; a
  sandbox shim folder that was part of the harness itself; an innocuous-looking
  folder that was a live dependency of another tool.
- Mass-moves may be blocked by permission classifiers in autonomous mode → ask the
  user to explicitly grant soft-delete, or hand them the script to run. Any
  generated PowerShell script containing non-ASCII text MUST be saved UTF-8 with
  BOM and parse-checked BEFORE its first run.

## The 7 steps

### 1. Parallel scan (fan out read-only research agents in ONE message)

| Agent | Scope | Returns |
|---|---|---|
| dot-folders | every `~/.*` in the home root | owning tool, size class, last-active, verdict ACTIVE/LEFTOVER/SYSTEM-KEEP/UNSURE |
| skills per tool | each tool's skills directory | link type (junction/real), ORIGIN (repo-junction / duplicate-of-source / vendored / unknown pack), diffed against `plugins/*/skills` |
| code repos | `~/Code/*` | purpose, remote, last commit, ACTIVE/ARCHIVED/STALE/JUNK |
| offline tools | your heavy-tool folder families + any stray tool dirs | purpose, entry point, install-on-new-machine, size class |
| runtime registrations | each tool's `mcp list` / `plugin list`, scheduled tasks | registration table + whether each task goes through your notify wrapper |

Don't recurse into giant model/cache dirs when sizing — use heuristics
(venv / torch / node_modules).

### 2. Registry diff (drift check)

Every finding falls into exactly one of three buckets: ✅ correct entry exists ·
🆕 NO entry (red flag — installed off the books) · 👻 entry exists but the thing is
gone. Also check the upstream/provenance manifest for external sources.

### 3. Classify & propose

- **Duplicates:** a real skill directory that also exists in the repo's plugins =
  DUPE (the plugin version wins) → remove the copy; but if that tool has no junction
  replacement yet → **replace with a junction, don't just delete** (or the tool
  loses the skill).
- **Dead weight:** packs from rejected sources, plugins disabled for months, trial
  installs with no usage traces, empty folders, regenerable output.
- **Misplaced:** violations of the 3-branch storage law → propose moving to the
  correct branch (your patches → `vendor-adapt/`); but NEVER relocate heavy tools to
  consolidate them — it breaks registered MCP paths, junctions, and scheduled tasks.

### 4. GATE — present to the human

One table: the updated registry draft + the DELETE list grouped by risk
(high-confidence-safe / confirm-each-item) + the HOLD list. Wait for approval per group.

### 5. Execute (after approval)

One soft-delete script (BOM + parse-check first): move items into the dated trash by
area; DUPE in a tool missing its junction → move, then `New-Item -ItemType Junction`;
removed plugins → proper `plugin uninstall` + `marketplace remove`; repos → verify
bundle/remote before touching.

### 6. Verify

Skill counts per tool match expectations; every junction resolves
(`Get-Item .LinkType` + the SKILL.md exists); `plugin list` / `mcp list` intact;
no scheduled pipeline lost its script.

### 7. Record

Update `registry.json` (new entries, priority → deprecated + cleanup date, revised
when_to_use) → `bootstrap/build-registry.ps1` → commit + push → memory (WHAT: the
cleanup batch + numbers; HOW: new pitfalls, deduped against existing entries) →
refresh your component index snapshot.

## Correct-place checklist (quick reference)

Your OpcOS repo = governance / plugins / scripts / registry · `~/.mcp/<name>` = MCP
servers · your media/pipeline folder families = heavy engines and automations ·
`~/Code` = product repos (each with a remote or bundle) · the tool's own store =
third-party plugins · NO new files in the home root.
