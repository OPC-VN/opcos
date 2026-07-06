---
name: adopt-repo
description: >
  Standard procedure for an AI agent to RESEARCH + ANALYZE + ADVISE + INSTALL an
  external repo or skill into the OpcOS-governed system, with a human decision gate.
  Triggers when the user: shares a repo link asking "evaluate this repo", "is this
  worth installing", "analyze this repo", "adopt/install this repo", "install a skill
  from ..."; OR asks to "add a new skill", "create a skill for ...", "extend the
  agent's capabilities". Also the human-judgment layer on top of any mechanical
  upstream checker — when the checker reports new upstream commits, run this
  procedure to decide what is worth bringing in. This is a COLLABORATIVE procedure:
  it always stops at the gate for human approval before installing or committing.
---

# adopt-repo — research → advise → adopt, with a human gate

**Purpose.** Standardize how the system grows through external sources (popular
repos, new skills) so that growth stays: consistent, non-duplicative,
non-conflicting with the existing setup, license-respecting, provenance-tracked,
and **always human-approved** before anything is installed. This skill is the
judgment layer that a mechanical upstream checker (commit counting, diff links)
deliberately does not provide.

**Required companion reading:** your provenance manifest (upstream tracking file),
the registry (`registry.json`), and the architecture doc (`docs/how-it-works.md`).

## Two entry points

- **A. Evaluate/adopt one repo from a link** (the user pastes a GitHub URL).
- **B. Add / author a new skill** (referencing a popular repo, or written from
  scratch — use your skill-authoring skill for the writing itself).

Both go through the same phases below.

## The 6 phases (GATE at phase 3 — never install before human approval)

1. **Intake** — pin the scope: goal, constraints, source (link/name). If ambiguous,
   ask 2–3 clarifying questions.
2. **Research** — fetch the repo (README / architecture docs / file tree /
   **LICENSE** / stars / recency); search reputable sources; summarize *what it
   does*. Fan out parallel read-only research agents when the repo is broad.
3. **Analyze + Advise → GATE** — score against the **rubric** below: what
   duplicates or conflicts with existing skills/agents/governance, stack fit,
   license, cost and complexity. Produce a clear **recommendation** (adopt whole /
   cherry-pick / skip) with reasons and risks. **Present it and wait for the human
   decision.**
4. **Adopt/Install** (only after approval) — classify the storage branch
   (see the storage law below), place content in the right location, keep naming
   prefixes/scopes, strip irrelevant notes, replace machine-specific paths with
   `$HOME`/`~`; **record provenance** in your upstream manifest (upstream + license
   + baseline commit) **and add a registry entry** (category + **priority**
   core/recommended/optional + purpose + when_to_use + install) → regenerate the
   registry views (`bootstrap/build-registry.ps1`); honor attribution requirements.
5. **Verify** — the skill/agent actually loads; any scripts parse cleanly;
   **no duplicate** of something already installed; parity across all governed tools.
6. **Record** — commit (registry + generated views included); run the update script
   to propagate to every tool; update your component index; save a memory entry if
   there is a reusable lesson.

## Rubric — "is this worth adding?" (used in phase 3)

Adopt when ALL signals pass; skip on any hard ❌:

- **Stack fit**: matches the work this machine actually does. Outside your stack → ❌.
- **No duplication**: not already covered by an installed pack or skill. Mostly
  overlapping → take only the delta, or ❌.
- **No governance conflict**: doesn't demand ownership of your rules files, memory,
  or hooks (beware "constitution-style" frameworks) → if it conflicts, cherry-pick
  the ideas only; never install it whole.
- **Quality & maintenance**: recently maintained; clear license (MIT/Apache OK;
  restrictive or missing → verify or ❌); not a low-quality quantity-over-quality list.
- **Cross-tool portability**: works across your governed tools is best; single-tool
  → consider the vendored branch.
- **Cost/complexity proportional to value.**

## The 3-branch storage law (decides WHERE things live — recorded in the registry `storage` field)

> **Modify the content → copy into the repo (`adopted-in-repo`). Use verbatim /
> path-bound / has a runtime → clone OUTSIDE + keep your patches in `vendor-adapt/`
> (`vendored-outside`). Has a first-party store → install from the store, only
> record it (`store`).** Self-written: small text goes in the repo
> (`homegrown-in-repo`); heavy things (venv/models) live outside in a well-known
> folder family (`homegrown-outside`). NEVER relocate heavy tools to "tidy up" —
> it breaks registered MCP paths, junctions, and scheduled tasks.

## Hard rules

- **Report-only until the GATE**: no installs, no commits before human approval.
  This is a *collaborative* procedure.
- **Never import a whole repo** when you only need parts — cherry-pick selectively.
- **Provenance is mandatory** for everything inherited → record it in the upstream
  manifest so the upstream checker can watch it.
- **The skill ladder applies**: note → procedure (memory) → skill; create a skill
  only for capabilities that are reused, stable, and complex enough to earn it.
  Not every adoption deserves a new skill.
- **Safety**: never read or commit secrets; read the license before copying code.

Detailed per-phase checklist: [`references/procedure.md`](references/procedure.md).
