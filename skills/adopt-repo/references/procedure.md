# adopt-repo — detailed checklist

Deep-dive companion to the `adopt-repo` skill. Read SKILL.md first for the 6 phases
and the rubric.

## Phase 2 — Research (collect, don't conclude)

- `gh repo view <owner/repo>` · `gh api repos/<r>` (stars, pushed_at, license.spdx_id).
- `gh api repos/<r>/git/trees/<branch>?recursive=1` for the file tree; read
  README / ARCHITECTURE / AGENTS.md / any marketplace manifest.
- Search reputable sources and compare against alternatives of the same kind —
  never trust the README alone.
- Broad, multi-component repo → fan out parallel read-only research agents and keep
  only their conclusions.
- **Write down**: what it does, its architecture, license, maturity, and how it installs.

## Phase 3 — Analyze against your system

- List its skills/agents → map against your component index and installed packs to
  find **duplicates**.
- Check for **governance conflicts**: does it overwrite your rules files, demand its
  own memory system, or register its own hooks? ("Constitution-style" frameworks →
  borrow ideas only.)
- License: MIT/Apache-2.0 = copy + attribution OK; restrictive or source-specific
  clauses → do not import those parts.
- Portability across your governed tools. Single-tool → consider the vendored branch.

## Phase 3 output — Advise + GATE

Present a table: **Worth taking / Already covered (drop) / Conflicts (ideas only)**.
Conclude with exactly one of:

- **adopt whole** (rare) · **cherry-pick** (the default) · **skip**.

State reasons + risks + cost. **STOP and wait for approval.** Do not enter phase 4
without an explicit "go".

## Phase 4 — Adopt/Install (after approval)

Act according to the storage branch:

- **vendored-outside**: clone outside the repo; add the clone step to your install
  script (and gitignore any in-repo mount point). Do not modify the clone — your
  patches live in `vendor-adapt/` with a script that re-applies them after upstream pulls.
- **adopted-in-repo**: copy the selected parts into `plugins/<pack>/skills|agents/...`;
  rename prefixes to avoid collisions; strip irrelevant notes; replace
  machine-specific paths with `$HOME` / `~`.
- **store**: do NOT mirror; record it in the upstream manifest and install via each
  tool's own store.
- **Provenance**: add/update the upstream manifest entry (name, type, upstream,
  branch, license, baseline = current HEAD via `gh api .../commits?per_page=1`,
  baseline_date, what was taken, how to update, how to check).

## Phase 5 — Verify

- Any PowerShell script: confirm encoding is sane for your shell version and that it
  parses (`[scriptblock]::Create` on the file content). If your scripts contain
  non-ASCII text, save as UTF-8 **with BOM** — Windows PowerShell 5.1 misparses
  BOM-less UTF-8 silently.
- Keep SKILL.md small (some tools cap skill file size around ~8KB); push detail to
  `references/`.
- No duplicates: search your plugins and component index for the skill name.
- Load test: restart the tool, confirm the skill/agent appears, run it once.

## Phase 6 — Record

- Commit and push with a clear message.
- Run the update script (propagates to every governed tool + redeploys governance).
- Update your component index snapshot.
- Reusable lesson → memory (WHAT/HOW axes, dedup against existing entries).

## Entry point B — authoring a NEW skill (not copied from anywhere)

1. Define the capability + trigger phrases (when should it auto-activate?).
2. Use your skill-authoring skill to draft a standards-compliant SKILL.md.
3. Place it at `plugins/<pack>/skills/<name>/SKILL.md` (+ `references/` if long).
4. If it borrows ideas from a popular repo → still record provenance
   (type adopted, took = "idea X").
5. Verify + Record as phases 5–6.

## Worked examples (patterns to recognize)

- **The constitution framework**: research revealed a framework that wanted to own
  the rules files and memory → **skip**, borrowed two ideas (receipts, knowledge
  promotion). Nothing installed.
- **The mature parallel project**: research revealed a multi-harness system solving
  the same problem with more maturity → **cherry-pick** (two skill domains + several
  techniques: file-size caps, doc gardening, model tiering). Provenance recorded.
