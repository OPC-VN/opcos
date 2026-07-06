# Core Operating Rules (tool-agnostic template)

> This is the single source of truth for how your AI agents work, across every
> platform (Claude Code / Codex / Gemini / any AGENTS.md-compatible tool).
> Structure follows the **AGENTS.md** standard so any tool can read it.
> Keep this file **tool-agnostic**: no tool names, no machine-specific paths, no
> platform-only features. Put per-tool rules in each tool's own file — this layer
> is the shared floor beneath all of them.
>
> **How to use this template:** copy it, delete what doesn't apply to you, and
> deploy it to every tool via the adapter table (see `deploy-adapters.md`).

## Safety & boundaries

Three tiers, in strict priority order:

- **Always**: list and briefly explain terminal commands **before** running them,
  and wait for approval; create `.env.example` files instead of ever writing secrets.
- **Ask-first**: any outward-facing action (push, deploy, send or publish content,
  modify CI), or any action outside the project directory.
- **Never**: destructive or high-risk commands (`rm -rf`, formatting, disk
  operations); reading or printing secrets (`.env`, keys, tokens) into output;
  committing secrets.

## Workflow

Base process: **Plan → Implement → Verify → Document**. Each task produces up to
four artifacts:

1. **PLAN** — checklist + assumptions + risks
2. **CHANGESET** — diff / list of changed files
3. **VERIFICATION** — tests / build output / a short log
4. **HANDOFF** — how to run it + what changed + rollback (if needed)

**Right-sizing (do just enough — no ceremony for its own sake):**

| Task size | Phases to run |
|---|---|
| trivial (one line, text change) | Implement + quick Verify |
| small | short Plan → Implement → Verify |
| standard | all 4 artifacts |
| large / touches security / public API / migration | all 4 + thorough review; security review is **mandatory** (see escalation) |

**Two gates (stop and wait for a human):**

- **Gate 1 — after PLAN**: for standard+ or risky tasks, present the plan and wait
  for approval before writing code.
- **Gate 2 — before COMMIT / any outward-facing action**: wait for approval before
  push / deploy / publish.

**Security escalation:** if a task touches secrets, auth, external input, a public
API, or infrastructure → promote it to "large" and run a security review (use your
security-review skill or a dedicated reviewer agent).

## Tool-selection ladder (smallest structure that works)

direct answer → one-off task → note/procedure (memory) → skill → agent → workflow →
schedule (fixed times) → loop (indefinite, with verification).

Rules: one-off work never justifies a skill or workflow; a fixed time means a
schedule, not a loop; **before creating any new structure, check for duplicates**
(existing memory / skills / agents) — if one exists, update it instead.

## Browser tooling — pick the right tool for the job (if installed)

If your setup has more than one browser-capable MCP, split roles instead of mixing:

- **Measure / optimize / debug the web** — performance traces, Core Web Vitals,
  audits, memory snapshots, deep network inspection, device emulation → use a
  **devtools-grade MCP** (fresh browser instance, clean profile). This is the tool
  for every "why is this page slow / heavy / leaking?" question.
- **UI testing / automation, dogfooding a local app** → use a **test-automation MCP**
  (e.g. a Playwright-based server).
- **Acting inside the user's real browser** (open tabs, logged-in accounts,
  recordings) → use a **real-browser extension MCP**, if your tool offers one.

All three can click, navigate, and screenshot — choose by role, and don't mix tools
within one task.

## Autonomy tiers for automation

For any background job, schedule, or loop — especially outward-facing pipelines:

- `suggest` — read-only + propose; a human decides.
- `auto-safe` — do the safe parts autonomously (drafts, renders, logs); never
  publish, send, or spend.
- `full` — full autonomy including outward-facing actions; granted only after the
  pipeline has been explicitly reviewed and approved.

Default for any automation created in chat = `suggest`. Raising the tier requires
human approval.

## Decision ladder before WRITING CODE

Stop at the first rung that satisfies the need — *the best code is the code you
don't have to write*:

1. **YAGNI** — does this need to be built at all?
2. Does the **codebase** already have it?
3. Does the **standard library** have it?
4. Does the **platform** have it natively?
5. Does an **already-installed dependency** have it?
6. Is it a **one-liner**?
7. Only then: write the **minimal working version**.

Understand the problem and trace the flow end-to-end **before** climbing — the
ladder is not a shortcut around understanding the code. Fix bugs at the **root
cause** (fix the shared function once; don't patch every caller). Simplify
deliberately: leave a comment stating the ceiling and the upgrade path. Never apply
"minimal" to: validation at trust boundaries, error handling that prevents data
loss, security, or accessibility. Non-trivial logic ships with at least one runnable
verification — lazy code without verification is unfinished code.

## Surgical changes

Touch only what the task scopes. Never delete or rewrite comments, code, or
structure you don't fully understand. Match the file's existing style and idioms.
See a problem **outside** the scope? Note it as a suggestion — don't "fix it while
you're there".

## Definition of Done

- The code builds / runs.
- Minimal tests exist for what changed (or an explanation of why they can't yet).
- README / docs updated if the way to run or configure it changed.

## Communication

- Missing information → state 2–3 reasonable assumptions, clearly marked
  **ASSUMPTION**.
- Trade-offs exist → pick one **recommended** option, give the reason and the risk.

## Reflection & memory (WHAT vs HOW)

After every significant step (a root-caused bug fix, a deploy, a new procedure, or
a mistake-then-correction), ask: *"is there a reusable lesson here?"* If yes, save
it to memory along two axes:

- **WHAT (what to do)** — state / decisions / facts, so future sessions have context.
- **HOW (how to do it)** — repeatable procedures / pitfalls / canonical commands,
  so future sessions are faster and safer.

High bar: only reusable lessons. **Dedup** — update the existing entry instead of
creating a near-duplicate. Never store what can be re-derived from code / git / docs.

## Repository & file hygiene

Don't create one-off files and leave them behind. Drafts and intermediates go to a
temp area (`./.tmp/` or the OS temp dir) and are **deleted within the same task**.
Prefer stdout / pipes over intermediate files. At the end of every task: review the
artifacts you created, clean up, and **report what was cleaned**.

## Knowledge layer (optional)

Domain and personal knowledge lives in a separate knowledge base (for example
`~/knowledge/`) with its own governance — **separate** from this OS layer. When
domain context is needed, consult it (starting from its index file) and respect its
rules. **If the machine has no knowledge base, operate normally — never assume it
exists.** Never copy knowledge-base content into distributed artifacts (repos /
plugins / deployed rule files).

## Scope & precedence

This is the **global base layer**. Override order (low → high):

1. this file (core rules)
2. the tool's global user rules file
3. the project's AGENTS.md / rules file (closest to cwd wins)
4. the user's direct instructions in chat (override everything)
